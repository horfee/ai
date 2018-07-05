/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import './shared-styles.js';

class AIWaveSurfer extends PolymerElement {
  static get template() {
    return html`
      <style include="iron-flex iron-flex-alignment shared-styles">
        .centred {
          top:calc(50% - 20px);
          left:calc(50% - 20px);
          transition:all .3s ease
        } 
        .left,.middle,.right {
          transform:scale(1)
        } 
        
         .controls {
          height:50px;
          width:100%;
          top:0;
          background:var(--accent-color);
          z-index:20
        }
        
        .hidden {
          display:none
        }
      </style>
      <div  class="layout horizontal center-center">
        <paper-icon-button hidden$="{{!microphoneEnabled}}" id="rec" icon="av:mic" on-click="toggleRec"></paper-icon-button>
        <paper-icon-button id="play" icon="av:play-circle-filled" on-click="togglePlay"></paper-icon-button>
        <paper-icon-button id="replay" icon="av:replay-30" on-click="throwBack"></paper-icon-button>
        <paper-icon-button id="mute" icon="av:volume-up" on-click="toggleMute"></paper-icon-button>
        <paper-icon-button id="score" icon="av:hearing" on-click="score"></paper-icon-button>
      </div>
      <div id="waveSurfer" on-click="_stopPropagation"></div>
      <div class="layout horizontal start-left" id="classes">
        <dom-repeat items="{{detectedClasses}}" as-index="idx">
          <template>
            <div style$="width:{{item.duration}}%; background-color:{{_getNewColor(idx)}}">{{item.class}} - ({{item.confidence}}%)</div>
          </template>
        </dom-repeat>
      </div> 
    `;
  }

  static get properties() {
    return {      
      sound: {
        type: Object,
        notify: true,
        observer: "_onSoundChanged"
      },
      
      url: {
        type: String,
        readOnly: true,
        notify: true
      },

      regions: {
        type: Array,
        value: [],
        notify: true,
        observer: "_regionsChanged"
      },

      microphoneEnabled: {
        type: Boolean,
        notify: true,
        value: false,
        observer: "_onMicrophoneEnabledChanged"
      },

      scoreFunction: {
        type: Object
      }
    };
  }

  _loadScript(){
    var promise = new Promise(function(resolve,reject){
      var urls = ["wavesurfer.js","wavesurfer.regions.min.js", "wavesurfer.microphone.min.js"];
      
      if ( window.loadingScript == undefined ) {
        window.loadingScript = { loading: false, loaded: false, urls: urls, promises: [], step: 0};
      }
      
      if ( window.loadingScript && window.loadingScript.loaded == true) {
        resolve();
      } else if ( window.loadingScript.loading == false ){
        var _f = function() {
          window.loadingScript.step++;
          if (  window.loadingScript.urls.length == 0 ) {
            window.loadingScript.loaded = true;
            window.loadingScript.promises.forEach(function(p){ p()});
          } else {
            var url = urls.splice(0, 1);
            console.log("Loading script : " + url);
            var scriptTag = document.createElement('script');
            scriptTag.src = url;
            scriptTag.onload = _f;
            document.head.appendChild(scriptTag);   
          }

        };

        _f();
        window.loadingScript.loading = true;
        window.loadingScript.promises.push(resolve);
        
        urls.forEach(function(url){
          
        });
      } else {
        window.loadingScript.promises.push(resolve);
      }
        
    });
    
    return promise;
    
  }


  _createRegion(region) {
    return { drag: false, resize: false, start: region.start, end: region.start + region.duration, color: region.color};
  }

  _initializeWaveSurfer() {
    
    if ( this.wavesurfer != undefined ) {
      this.wavesurfer.destroy();
    }

    var regs = [];
    this.regions.forEach(function(region, index){
      regs.push(this._createRegion(region));
    }.bind(this));

    var plugins = [WaveSurfer.regions.create({ regions: regs })];
    if ( this.microphoneEnabled ) {
      plugins.push(WaveSurfer.microphone.create());
    }
    this.wavesurfer = WaveSurfer.create({
      container: this.$.waveSurfer,
      waveColor: 'violet',
      progressColor: 'purple',
      plugins: plugins

    });
    
    if ( this.url ) {
      this.wavesurfer.load(this.url);  
    }
  }

  getDuration() {
    return this.wavesurfer.getDuration();
  }

  _regionsChanged(newValue, oldValue) {
    if ( this.wavesurfer == undefined ) return;
    this.wavesurfer.clearRegions();
    newValue.forEach(function(region) {
      this.wavesurfer.addRegion(this._createRegion(region));
    }.bind(this));
    
  }


  _stopPropagation(e) {
    e.stopPropagation();
  }

  togglePlay(e) {
    this._stopPropagation(e);
    this.wavesurfer.playPause();  
    if ( this.wavesurfer.isPlaying()) {
      this.$.play.icon = "av:pause-circle-filled";
    } else {
      this.$.play.icon = "av:play-circle-filled";  
    }
  }

  throwBack(e) {
    this._stopPropagation(e);
    this.wavesurfer.skipBackward(30);
  }

  score(e) {
    this._stopPropagation(e);
    this.scoreFunction();

  }

  toggleMute(e) {
    this._stopPropagation(e);
    this.wavesurfer.toggleMute();
    
    if ( this.wavesurfer.getMute() ) {
      this.$.mute.icon = "av:volume-off";
    } else {
      this.$.mute.icon = "av:volume-up";
    }

  }

  _onSoundChanged(newValue, oldValue) {
    this._setUrl(URL.createObjectURL(this.sound));
    this._loadScript().then(function(){
      this._initializeWaveSurfer();
     }.bind(this));
  }


  _onMicrophoneEnabledChanged(newValue, oldValue) {
    if ( newValue != oldValue ) {
      this._loadScript().then(function(){
        this._initializeWaveSurfer();
       }.bind(this));
    }
  }

  toggleRec() {
    this.wavesurfer.microphone.togglePlay();
  }
  
}

window.customElements.define('wave-surfer', AIWaveSurfer);
