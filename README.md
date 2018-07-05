# IBM Acoustic Insights
IBM Acoustic Insights frontend, developped in J2EE and using Polymer 3

In order to use it, you will need to build the polymer and move the build to the webcontent folder.

If you want to debug, run your app on tomcat or any other webcontainer, then serve your polymer frontend with :
polymer serve --proxy-path /proxy --proxy-target http://localhost:8888


This application allows the user to score sound against IBM Acoustic Insights service,  available here :
https://ai.predictivesolutionsapps.ibmcloud.com/ibm/iotm/solution/

You will need to request the API Key for this service. Please contact support to get it.

