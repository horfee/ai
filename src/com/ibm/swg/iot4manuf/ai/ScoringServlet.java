package com.ibm.swg.iot4manuf.ai;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.file.Files;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;

import javax.net.ssl.SSLContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

import org.apache.commons.lang3.SystemUtils;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.HttpEntityWrapper;
import org.apache.http.entity.mime.HttpMultipartMode;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.ssl.SSLContexts;
import org.apache.http.util.EntityUtils;

/**
 * Servlet implementation class ScoringServlet
 * Used to forward the query to the server/URL defined in the initial request headers, as "url"
 * The post method will use the file to determine if the file must be transcoded or not.
 * To transcode, it uses the ffmpeg software.
 */
@WebServlet(asyncSupported = true, description = "used to send the score request", urlPatterns = { "/proxy" })
@MultipartConfig
public class ScoringServlet extends HttpServlet {
	
	private static final long serialVersionUID = 1L;
       
    private String ffmpegPath;
    private String ffprobePath;
    
    @Override
    public void init() throws ServletException {
    	super.init();
    	
    	String arch = SystemUtils.OS_ARCH.contains("64") ? "64" : "32";
    	String os = SystemUtils.IS_OS_MAC ? "mac" : SystemUtils.IS_OS_WINDOWS ? "win" : SystemUtils.IS_OS_LINUX ? "linux" : "";
    	
    	try {
			ffmpegPath = URLDecoder.decode(this.getClass().getResource("resources/ffmpeg_" + os + arch).getFile(), "UTF-8");
			ffprobePath = URLDecoder.decode(this.getClass().getResource("resources/ffprobe_" + os + arch).getFile(), "UTF-8");
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		
    }
    

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    	
    	String apiKey = request.getHeader("apikey");
		String urlString = request.getHeader("url");
		
		HttpClient client = HttpClientBuilder.create().build();
		HttpGet req = new HttpGet(urlString);
		req.setHeader("APIKEY", apiKey);
		
		HttpResponse resp = client.execute(req);
		response.setStatus(resp.getStatusLine().getStatusCode());
		
		for(Header h : resp.getAllHeaders()) {
			response.addHeader(h.getName(), h.getValue());
		}
		
		HttpEntity body = resp.getEntity();
		String bodyString = EntityUtils.toString(body);
		response.getWriter().write(bodyString);
		response.getWriter().flush();
    }

    
  //Set the https use TLSv1.2
    private static Registry<ConnectionSocketFactory> getRegistry() throws KeyManagementException, NoSuchAlgorithmException {
        SSLContext sslContext = SSLContexts.custom().build();
        SSLConnectionSocketFactory sslConnectionSocketFactory = new SSLConnectionSocketFactory(sslContext,
                new String[]{"TLSv1.2"}, null, SSLConnectionSocketFactory.getDefaultHostnameVerifier());
        return RegistryBuilder.<ConnectionSocketFactory>create()
                .register("http", PlainConnectionSocketFactory.getSocketFactory())
                .register("https", sslConnectionSocketFactory)
                .build();
    }
	
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String apiKey = request.getHeader("apikey");
		String urlString = request.getHeader("url");
			
		HttpClientBuilder builder = HttpClientBuilder.create();
		
		try {
			PoolingHttpClientConnectionManager clientConnectionManager = new PoolingHttpClientConnectionManager(getRegistry());
			clientConnectionManager.setMaxTotal(100);
	        clientConnectionManager.setDefaultMaxPerRoute(20);
	        builder.setConnectionManager(clientConnectionManager);
			
		} catch (KeyManagementException | NoSuchAlgorithmException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        
		
		HttpClient client = builder.build();

		HttpPost req = new HttpPost(urlString);
		req.setHeader("APIKEY", apiKey);

		File f = Files.createTempFile("ai", ".wav").toFile();
		Part p = request.getPart("data");
		
		if ( p != null ) {
			p.write(f.getAbsolutePath());
		}

		if ( needToTranscode(f) ) {
			f = transcode(f);
		} 
		
		MultipartEntityBuilder entityBuilder = MultipartEntityBuilder.create().setMode(HttpMultipartMode.BROWSER_COMPATIBLE).addBinaryBody("data", f, ContentType.create("audio/x-wav"), f.getName());
		HttpEntity entity = entityBuilder.build();
		req.setEntity(entity);
		
		ProgressListener pListener = new ProgressListener() {
	        @Override
	        public void progress(float percentage) {
	        	System.out.println("Progress : " + percentage);
	        }
	    };
	 
	    req.setEntity(new ProgressEntityWrapper(entity, pListener));
			 
				
		HttpResponse resp = client.execute(req);
		response.setStatus(resp.getStatusLine().getStatusCode());
		
		for(Header h : resp.getAllHeaders()) {
			response.addHeader(h.getName(), h.getValue());
		}
		
		HttpEntity body = resp.getEntity();
		String bodyString = EntityUtils.toString(body);
		response.getWriter().write(bodyString);
		
	}

	/**
	 * Determine if the file sent from the UI needs to be transcoded or not.
	 * The criteria are quite simple and come from AI scoring service : needs to be a 44.1KHz wave file, with format PCM_S16LE
	 * @param unencodedFlow the original file.
	 * @return true if the file needs to be transcoded before sent to the AI scoring API.
	 * @throws IOException if unable to create a result temp file.
	 * @see ProcessBuilder#start()
	 */
	public boolean needToTranscode(File unencodedFlow) throws IOException {
		ProcessBuilder processBuilder = new ProcessBuilder(
				ffprobePath, 
				"-select_streams", "stream=0:0",
				"-i", unencodedFlow.getAbsolutePath()
	    );
		processBuilder.redirectErrorStream(true);
		Process process = processBuilder.start();
		InputStream processOutputStream = process.getInputStream();
		BufferedReader reader = new BufferedReader(new InputStreamReader(processOutputStream));
		String result;
		
		boolean isPCM = false;
		boolean is44100Hz = false;
		while ( (result = reader.readLine()) != null ) {
			is44100Hz |= result.contains(", 44100 Hz,");
			isPCM |= result.contains(" pcm_s16le ");
		}
		reader.close();
		
		return !(isPCM && is44100Hz);
	}
	
	/**
	 * Transcode the file to wave 44.1KHz
	 * @param unencodedFlow is the file which is in a different format than in wave 44.1KHz
	 * @return the wave file transcoded
	 * @throws IOException if unable to create a result temp file.
	 * @see ProcessBuilder#start()
	 */
	public File transcode(File unencodedFlow) throws IOException {
		File tempFile = Files.createTempFile("aitranscoded", ".wav").toFile();
		Process process = new ProcessBuilder(
				ffmpegPath,
				"-i", unencodedFlow.getAbsolutePath(),
				"-vn",
				"-acodec", "pcm_s16le",
				"-ac", "1",
				"-ar", "44100",
				"-f" ,"wav",
				"-y",
				tempFile.getAbsolutePath()
	    ).start();
		try {
			if ( process.waitFor() != 0 ) {
				return null;
			}
		} catch (InterruptedException e) {
			e.printStackTrace();
			return null;
		}
		return tempFile;
	
	}
	
	
    public static class CountingOutputStream extends FilterOutputStream {
        private ProgressListener listener;
        private long transferred;
        private long totalBytes;
     
        private File file;
        
        private FileOutputStream fos;
        
        public CountingOutputStream(OutputStream out, ProgressListener listener, long totalBytes) throws IOException {
            super(out);
            this.listener = listener;
            transferred = 0;
            this.totalBytes = totalBytes;
            
            file = Files.createTempFile("temp", ".wav").toFile();
            fos = new FileOutputStream(file);
            
            System.out.println(file.getAbsolutePath());
        }
     
        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            out.write(b, off, len);
            fos.write(b, off, len);
            transferred += len;
            listener.progress(getCurrentProgress());
        }
     
        @Override
        public void write(int b) throws IOException {
            out.write(b);
            fos.write(b);
            transferred++;
            listener.progress(getCurrentProgress());
        }
     
        private float getCurrentProgress() {
            return ((float) transferred / totalBytes) * 100;
        }
    }
    
    public static interface ProgressListener {
        void progress(float percentage);
    }
    
    public class ProgressEntityWrapper extends HttpEntityWrapper {
        private ProgressListener listener;
     
        public ProgressEntityWrapper(HttpEntity entity, ProgressListener listener) {
            super(entity);
            this.listener = listener;
        }
     
        @Override
        public void writeTo(OutputStream outstream) throws IOException {
            super.writeTo(new CountingOutputStream(outstream,  listener, getContentLength()));
            
        }
    }
    
}
