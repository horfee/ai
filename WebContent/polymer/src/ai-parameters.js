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
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import { AILocalizable } from './ai-localizable.js';
import './shared-styles.js';

class AIParameters extends AILocalizable {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;

          padding: 10px;
        }
      </style>

      <div class="card">
        <h1>{{localize('parametersTitle')}}</h1>
        <paper-input id="url" label="{{localize('parametersUrlLabel')}}" value="{{_url}}"></paper-input>
        <paper-input id="cell" label="{{localize('parametersCellLabel')}}" value="{{_cell}}"></paper-input>
        <paper-input id="product" label="{{localize('parametersProductLabel')}}" value="{{_product}}"></paper-input>
        <paper-input id="user" label="{{localize('parametersUserLabel')}}" value="{{_user}}"></paper-input>
        <paper-input id="apiKey" label="{{localize('parametersApiKeyLabel')}}" value="{{_apiKey}}"></paper-input>
        <paper-button raised on-tap="_submit">{{localize('parametersSaveButtonLabel')}}</paper-button>
      </div>
    `;
  }

  static get properties() {
    return {
      url: {
      type: String,
      value: "https://ai.predictivesolutionsapps.ibmcloud.com/ibm/iotm/",
      notify: true,
      observer: "_urlChanged"
    },
    cell: {
      type: String,
      notify: true,
      observer: "_cellChanged"
    },
    product: {
      type: String,
      notify: true,
      observer: "_productChanged"
    },
    user: {
      type: String,
      notify: true,
      observer: "_userChanged"
    },

    apiKey: {
      type: String,
      notify: true,
      observer: "_apiKeyChanged"
    }
    };
  }
  ready() {
    super.ready();
    this._url = this.url;
    this._cell = this.cell;
    this._product = this.product;
    this._user = this.user;
    this._apiKey = this.apiKey;
  }
  _urlChanged(newValue, oldValue) {
    this._url = newValue;
  }

  _cellChanged(newValue, oldValue) {
    this._cell = newValue;
  }

  _productChanged(newValue, oldValue) {
    this._product = newValue;
  }

  _userChanged(newValue, oldValue) {
    this._user = newValue;
  }

  _apiKeyChanged(newValue, oldValue) {
    this._apiKey = newValue;
  }

  _submit(evt){
    this.url = this._url;
    this.cell = this._cell;
    this.product = this._product;
    this.user = this._user;
    this.apiKey = this._apiKey;
  }
}

window.customElements.define('ai-parameters', AIParameters);
