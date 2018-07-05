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
import '@polymer/paper-spinner/paper-spinner.js';
import './shared-styles.js';

/*
import {WaveSurfer} from 'wavesurfer.js';
import {TimelinePlugin} from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import {RegionPlugin} from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import {MinimapPlugin} from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';
*/

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
        
        .controls paper-icon-button:first-of-type, 
        .controls paper-spinner  {
          margin-left: auto;
        }
      
        .hidden {
          display:none
        }
      </style>
      <div>
        <div  class="controls layout horizontal center-center" >
          <paper-icon-button id="play" icon="av:play-circle-filled" on-click="togglePlay"></paper-icon-button>
          <paper-icon-button id="replay" icon="av:replay-30" on-click="throwBack"></paper-icon-button>
          <paper-icon-button id="mute" icon="av:volume-up" on-click="toggleMute"></paper-icon-button>
          <paper-icon-button id="score" icon="av:hearing" on-click="score"></paper-icon-button>
          <paper-spinner active="{{working}}"></paper-spinner>
        </div>
        <div id="waveSurfer"></div>
        <div id="wavetimeline"></div>
        <div class="layout horizontal start-left" id="classes">
          <dom-repeat items="{{detectedClasses}}" as-index="idx">
            <template>
              <div style$="width:{{item.duration}}%; background-color:{{_getNewColor(idx)}}">{{item.class}} - ({{item.confidence}}%)</div>
            </template>
          </dom-repeat>
        </div> 
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
      
      working: {
        type: Boolean
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

      scoreFunction: {
        type: Object
      }
    };
  }


  _loadScript(){
    var promise = new Promise(function(resolve,reject){
      var urls = ["wavesurfer.min.js","wavesurfer.regions.min.js","wavesurfer.timeline.min.js"];
      
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
            console.debug("Loading script : " + url);
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

    var plugins = [
            WaveSurfer.timeline.create({
              container: this.$.wavetimeline

            }),
            WaveSurfer.regions.create({ 
              regions: regs 
            })];
   
    this.wavesurfer = WaveSurfer.create({
      container: this.$.waveSurfer,
      waveColor: 'violet',
      progressColor: 'purple',
      plugins: plugins
    });

    this.wavesurfer.on("finish", function(e){
        this.$.play.icon = "av:play-circle-filled";  
    }.bind(this));
    
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



  togglePlay(e) {
    this.wavesurfer.playPause();  
    if ( this.wavesurfer.isPlaying()) {
      this.$.play.icon = "av:pause-circle-filled";
    } else {
      this.$.play.icon = "av:play-circle-filled";  
    }
  }

  throwBack(e) {
    this.wavesurfer.skipBackward(30);
  }

  score(e) {
    this.working = true;
    this.scoreFunction().then(
      function(resolve){
        this.working = false;
      }.bind(this), 
      function(reject){
        this.working = false;
      }.bind(this));

  }

  toggleMute(e) {
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


  
}

window.customElements.define('wave-surfer', AIWaveSurfer);
