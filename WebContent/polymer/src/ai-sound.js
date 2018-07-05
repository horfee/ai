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
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import './wave-surfer.js';
import './shared-styles.js';
import { AILocalizable } from './ai-localizable.js';

class AISound extends AILocalizable {
  static get template() {
    return html`
      <style include="iron-flex iron-flex-alignment shared-styles">
        :host {
          display: block;
          margin: 2px;
          align-items: center;
        }

        .card {
          margin: 0px;
          padding: 5px;
        }

        .legendColor {
          width: 50px;
          height: 20px;
          margin: auto;
        }

        .legendText {
          flex: 1;
          text-align: left;
          margin-left: 3px;
          font-size: small;
        }
      </style>

      <div class="card layout vertical start-justified" on-click="_stopPropagation">
        <wave-surfer id="audioSource" microphone-enabled="{{microphoneEnabled}}" sound="{{item}}" score-function="[[_scoreFunction]]" regions="{{detectedClasses}}"></wave-surfer>
        <p hidden="{{!scored}}">{{scoredProductType}} ({{round(scoredConfidence,2)}}%)</p>
        <dom-if if="{{errored}}">
          <template>
            <p>{{errorMessage}}</p>
          </template>
        </dom-if>
        <div class="layout vertical start-justified" style="margin-top: 5px;">
          <dom-repeat items="{{detectedClasses}}">
            <template>
              <div class="layout horizontal" style="margin-top: 1px;">
                <div class="legendColor" style$="background-color:{{item.color}}"></div>
                <div class="legendText">{{item.class}} - ({{round(item.confidence, 2)}})%</div>
              </div>
            </template>
          </dom-repeat>
        </div>
      </div>
      <iron-ajax id="scoreRequest"  method="POST" url="{{routePath}}proxy" headers='{"url":"[[url]]ai/service/classify?productType={{product}}&cell={{cell}}&user={{user}}&solution=ai", "apikey": "{{apiKey}}"}' handle-as="json" reject-with-request="true"></iron-ajax>
      <!--
      <iron-ajax id="getScoringResultRequest" method="GET" url="{{routePath}}proxy" headers='{"url":"[[url]]service/inspectResult/{{_inspectionResultId}}?solution=ai&user={{user}}&cell={{cell}}", "apikey": "{{apiKey}}"}' handle-as="json" reject-with-request="true"></iron-ajax>
      -->
    `;
  }

  static get properties() {
    return {
      url: {
        type: String,
        notify: true
      },
      
      analyzer: {
        type: Object
      },
      
      duration: {
        type: Number
      },
      
      microphoneEnabled: {
        type: Boolean,
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
      item: {
        type: Object,
        notify: true,
        observer: "_itemChanged"
      },
      scored: {
        type: Boolean,
        value: false,
        notify: true
      },
      errored: {
        type: Boolean,
        value: false,
        notify: true
      }, 
      errorMessage: {
        type: String,
        value: ""
      },
      
      detectedClasses: {
        type: Array,
        notify: true
      },
      scoring: {
        type: Boolean,
        value: false,
        readOnly: true
      },
      
      scoredProductType: String,
      scoredConfidence: Number,
      
      _inspectionResultId: {
        type: String,
        notify: true
      },
      
      source: {
        type: Object,
        notify: true
      },
      
      autoScore: {
        type: Boolean,
        value: false
      },


      _scoreFunction: {
        type: Object,
        readOnly: true,
        value: function() {
          return this.score.bind(this);
        }
      }
    };
  }

  _stopPropagation(e) {
    e.stopPropagation();
  }
  
  constructor() {
    super();
    this._inspectionResultId = "";
  }
     
  playMe(){
    
  }

  ready() {
    super.ready();
    this.colors = [];
    if ( this.autoScore ) {
      this.score();
    }
  }

  _selectColor(colorNum, colors){
    if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
    return "hsl(" + (colorNum * (360 / colors) % 360) + ",100%,30%)";
  }

  round(value, precision) {
      var multiplier = Math.pow(10, precision || 0);
      return Math.round(value * multiplier) / multiplier;
  }

  score() {
    if ( this.scoring ) return this._promise;
    this._setScoring(true);

    this.scored = false;
    this.errored = false;
    this.detectedClasses = [];
    
    this._promise = new Promise(function(resolve, reject){
    
      var data = new FormData();
      data.append("data", this.item, this.item.name);
      this.$.scoreRequest.contentType = null;
      this.$.scoreRequest.body = data;
      if ( typeof(this.$.scoreRequest.headers) == "string" ) {
        this.$.scoreRequest.headers = JSON.parse(this.$.scoreRequest.headers);
      }
      this.$.scoreRequest.contentType = null;
      this.$.scoreRequest.generateRequest().completes.then(
          function(request){
            var result = request.response;
            var detections = [];
            if ( result.inspectResult && result.inspectResult.length > 0 ) {
              var confidence = 0;
              var clazz;
              var majority = result.inspectResult[0].majority.sort(function(item1, item2){
                return item1.confidence < item2.confidence ? 1 : item1.confidence > item2.confidence ? -1 : 0;
              })[0];
              this.errored = false;
              this.scored = true;
              this.scoredConfidence = majority.confidence;
              this.scoredProductType = majority["class"];
              
              var _processResultArray = function(array) {
                  var res = [];

                  while ( array.length > 0 ) {
                    var tmp = array.splice(0,1)[0];
                    if ( res.length == 0 ) {
                      res.push(tmp);
                    } else {
                      if ( tmp.time != res[res.length - 1].time ) {
                        res.push(tmp);
                      } else {
                        if ( tmp.confidence > res[res.length - 1].confidence ) {
                          res.splice(res.length - 1, 1);
                          res.push(tmp);
                        }
                      }
                    }
                  }

                  return res;
              };
              var array = _processResultArray(result.inspectResult[0].detail);
              var total = this.$.audioSource.getDuration();
              var delta = total / array.length;
              //|| array[array.length - 1].time + delta;
              

              var i;
              for(i = 0; i < array.length; i++) {
                var object = {};
                object["class"] = array[i].class;
                object["start"] = array[i].time;
                object["duration"] = (delta / total) * 100;
                object["color"] = this._selectColor(i, array.length);
                object["confidence"] = array[i].confidence * 100;
                detections.push(object);
                console.log(object);
              } 
            } else {
              this.errorMessage = this.localize("soundNoResult");
              this.errored = true;
              this.scored = false;
            }
              
            this.set("detectedClasses", detections);
            this._setScoring(false);
            resolve();
          }.bind(this), // Success

          function(rejected) {
            this.errored = true;
            this.scored = false;
            this._setScoring(false);
            resolve();
            this.errorMessage = rejected.request.response.error_message;
            

          }.bind(this));
    }.bind(this));
    
    return this._promise;
  }

  _itemChanged(newValue, oldValue) {
    this.detectedClasses = [];
    this.scored = false;
    this.errored = false;
    this._setScoring(false);
    // var regions = [
    //   {start: 0, duration: 5, color: this._selectColor(0, 3), "class": "Hackathon", confidence: 20},
    //   {start: 10, duration: 15, color: this._selectColor(1, 3), "class": "Hackathon", confidence: 20},
    //   {start: 25, duration: 5, color: this._selectColor(2, 3), "class": "Hackathon", confidence: 20}
    // ];
    // this.detectedClasses = regions;

  }

  resolveData(item) {
    return URL.createObjectURL(item);
  }
 
 localize(key, args, format) {
    return document.querySelector("ai-app").localize(key, args, format);
  }
}

window.customElements.define('ai-sound', AISound);
