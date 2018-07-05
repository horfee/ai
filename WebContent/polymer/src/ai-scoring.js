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
import './shared-styles.js';
import './ai-sound.js';
import {AILocalizable} from './ai-localizable.js';

class AIScoring extends AILocalizable {
  static get template() {
    return html`
      <style include="shared-styles iron-flex iron-flex-alignment">
        :host {
          display: block;

          padding: 10px;
        }

        paper-progress {
          margin-top: 25px;
          width: 100%;
        }
        
        file-drop-zone {
          width: 100%;
          overflow-y: auto;
          color: #aaa;
          background-color: #efefef;
          border-radius: 10px;
          border: 2px dashed #afbdca;
          transition: all .3s;
          margin-bottom: 10px;
        }

        file-drop-zone.dragover {
          border: 1px dashed #E91E63;
          transition: all .3s;
        }
        file-drop-zone:hover > [slot='drop-zone'],
        file-drop-zone.dragover > [slot='drop-zone'] {
          color: #E91E63;
          transition: all .3s;
        }
        file-drop-zone.errored {
          background-color: #FFEBEE;
          transition: all .3s;
        }
        file-drop-zone[has-files] {
          color: #2196F3;
          transition: all .3s;
        }
        [slot='drop-zone'] {
          text-align: center;
          font-size: 1.1em;
          --iron-icon-height: 64px;
          --iron-icon-width: 64px;
        }
        [slot='drop-zone'] > .title {
          font-size: 1.2em;
        }
        [slot='drop-zone'] > .small{
          font-size: 0.6em;
        }
      </style>

      <div class="card">
        <a name="scoring"><h1>{{localize('scoreTitle')}}</h1></a>
        <file-drop-zone id="fileDropZone" multiple accept="sound/*" files="{{files}}" fullbleed>
          <div slot="drop-zone" style="margin:5px; width:100%;">
            <iron-icon icon="description"></iron-icon>
            <h3>{{localize('scoreDropSoundDescription')}}</h3>
            <div class="layout vertical">
              <dom-repeat items="[[files]]">
                  <template>
                     <ai-sound duration="{{duration}}" item="{{item}}" url="{{url}}" user="{{user}}" product="{{product}}" cell="{{cell}}" api-key="{{apiKey}}"></ai-sound>
                  </template>
              </dom-repeat>
            </div>
            
          </div>
        </file-drop-zone>
      
        <div class="layout horizontal center-center">
            <paper-button disabled="{{!canStartScoring(files)}}" id="ScoringButton" toggles raised class="green" on-tap="_onScore">[[getScoringText(scoring)]]</paper-button>
        </div>
        <paper-progress id="ScoringSpinner" hidden$="{{!scoring}}" indeterminate="{{scoring}}" class="blue"></paper-progress>
      </div>
    `;
  }

  static get properties() {
    return {
      scoring: {
        type: Boolean,
        readOnly: true,
        value: false,
        notify: true,
        observer: "_onScoringChanged"
      },
      url: {
        type: String,
        notify: true,
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
        value: false
      },
      lastScoringResult: {
        type: Object,
        value: null,
        notify: true
      },
      files: {
        type: Array,
        notify: true,
        value: []
      }
    };
  }

  cannotStartScoring(files) {
    return !this.canStartScoring(files);
  }

  canStartScoring(files) {
    return files && files.length && files.length > 0;
  }

  _onScore(ev) {
    ev.stopPropagation();
    this._setScoring(!this.scoring);
  }

  _onScoringChanged(newValue, oldValue) {
    if ( newValue ) {

      var fs = Array.prototype.slice.call(this.$.fileDropZone.querySelectorAll("ai-sound"));
      var _scoreFn = function(array) {
        if ( array && array.length > 0 ) {
          array[0].score().then(function(){
            array.splice(0,1);
            _scoreFn(array);
          }.bind(this));
        } else {
          this._setScoring(false);
        }
      }.bind(this);
      
      _scoreFn(fs);
    }
    
  }

  getScoringText(simulating) {
    if ( simulating ) return this.localize("scoreStopScoring");
    return this.localize("scoreStartScoring");
  }


}

window.customElements.define('ai-scoring', AIScoring);
