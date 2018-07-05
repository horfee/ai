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
import '@polymer/iron-label/iron-label.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/paper-slider/paper-slider.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/iron-list/iron-list.js';
import '@polymer-vis/file-drop-zone/file-drop-zone.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/av-icons.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js'
import '@polymer/app-media/app-media.js';
import './shared-styles.js';
import './ai-sound.js';
import { AILocalizable } from './ai-localizable.js';

class AICapture extends AILocalizable {
  static get template() {
    return html`
      <style include="shared-styles iron-flex iron-flex-alignment">
        :host {
          display: block;

          padding: 10px;
        }

        paper-slider {
          flex: 1;
        }
      </style>

      <div class="card">
        <a name="scoring"><h1>{{localize('captureTitle')}}</h1></a>
        <div class="layout horizontal">
          <iron-label for="duration"><p>{{localize('captureDurationLabel')}}</p></iron-label>
          <paper-slider id="duration" value="{{duration}}" min="1" max="60"></paper-slider>
          <p>{{localize('captureDurationValue', 'duration', duration)}}</p>
        </div>
        <app-media-devices kind="audioinput" selected-device="{{audioDevice}}"></app-media-devices>
        <app-media-stream audio-device="[[audioDevice]]" stream="{{stream}}" id="audioStream" active></app-media-stream>
        <app-media-audio style="position: relative; top: 0px; left: 0px; width: 100%; height : 100%" id="video" source="[[stream]]" analyser="{{analyser}}"></app-media-audio>
        <app-media-recorder id="recorder" audio-bits-per-second="41000" stream="[[stream]]" duration="[[recordingDuration]]" elapsed="{{elapsed}}" data="{{recording}}"></app-media-recorder>
        <app-media-waveform id="waveform" analyser="[[analyser]]" active="{{isRecording}}" style="width:100%"></app-media-waveform>
        <div class="layout horizontal center-center" style="margin: 5px;">
            <paper-button disabled="{{!canStartScoring(files)}}" id="ScoringButton" toggles raised class="green" on-tap="_onRecord">[[getRecordingText(isRecording)]]</paper-button>
        </div>
        <div class="layout vertical">
          <dom-repeat items="[[capturedFiles]]">
              <template>
                 <ai-sound auto-score item="{{item}}" url="{{url}}" user="{{user}}" product="{{product}}" cell="{{cell}}" api-key="{{apiKey}}"></ai-sound>
              </template>
          </dom-repeat>
        </div>
       
      </div>
    `;
  }

  static get properties() {
    return {
      url: {
        type: String,
        notify: true
      },

      cell: {
        type: String,
        notify: true
      },

      product: {
        type: String,
        notify: true
      },

      user: {
        type: String,
        notify: true
      },

      apiKey: {
        type: String,
        notify: true
      },

      meadiaStreamActive: {
        type: Boolean,
        value: false,
      },

      isRecording: {
        type: Boolean,
        value: false,
        notify: true,
        readOnly: true,
        observer: "_isRecordingChanged"
      },

      recordingDuration: {
        type: Number,
        readOnly: true,
        computed: "_getRecordingDuration(duration)"
      },

      recording: {
        type: Blob,
        observer: '_recordingChanged'
      },

      capturedFiles: {
        type: Array,
        notify: true,
        value: []
      },

      duration: {
        type: Number,
        value: 5,
        notify: true
      }
    };
  }

  takeSample() {
    this._setIsRecording(!this.isRecording);
  }
  
  ready() {
    super.ready();
    this._ready = true;
  }

  _isRecordingChanged(newValue, oldValue) {
    if ( this._ready == undefined || this._ready == false ) return;
    
    if ( newValue ) {
      this.capturedFiles = [];
    this.$.recorder.start();    
    } else {
      this.$.recorder.stop();
    }
  }
  
  _recordingChanged(rec) {
    if ( rec != null ) {
      this.push("capturedFiles", rec);
    }
    if ( this.isRecording ) {
      this.$.recorder.start();
    }
  }
  
  _onRecord() {
    this._setIsRecording(!this.isRecording);
  }

  getRecordingText(isRecording) {
  if ( isRecording ) return this.localize('captureRecordButtonStop');
  else return this.localize('captureRecordButtonRecord');
  }
  
  _getRecordingDuration(duration) {
    return 1000 * duration;
  }

}

window.customElements.define('ai-capture', AICapture);
