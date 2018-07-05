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
import { setPassiveTouchGestures, setRootPath } from '@polymer/polymer/lib/utils/settings.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import {AILocalizable} from './ai-localizable.js';

import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import './ai-icons.js';

// Gesture events like tap and track generated from touch will not be
// preventable, allowing for better scrolling performance.
setPassiveTouchGestures(true);

// Set Polymer's root path to the same value we passed to our service worker
// in `index.html`.
setRootPath(MyAppGlobals.rootPath);

class AIApp extends AILocalizable {
  static get template() {
    return html`
      <style>
        :host {
          --app-primary-color: #4285f4;
          --app-secondary-color: black;

          display: block;
        }

        app-drawer-layout:not([narrow]) [drawer-toggle] {
          display: none;
        }

        app-header {
          color: #fff;
          background-color: var(--app-primary-color);
        }

        app-header paper-icon-button {
          --paper-icon-button-ink-color: white;
        }

        .drawer-list {
          margin: 0 20px;
        }

        .drawer-list a {
          display: block;
          padding: 0 16px;
          text-decoration: none;
          color: var(--app-secondary-color);
          line-height: 40px;
        }

        .drawer-list a.iron-selected {
          color: black;
          font-weight: bold;
        }
      </style>

      <app-location route="{{route}}" url-space-regex="^[[rootPath]]" use-hash-as-path>
      </app-location>

      <app-route route="{{route}}" pattern="/:page" data="{{routeData}}" tail="{{subroute}}">
      </app-route>

      <app-drawer-layout fullbleed="" narrow="{{narrow}}">
        <!-- Drawer content -->
        <app-drawer id="drawer" slot="drawer" swipe-open="[[narrow]]">
          <app-toolbar>{{localize('menuTitle')}}</app-toolbar>
          <iron-selector selected="[[page]]" attr-for-selected="name" class="drawer-list" role="navigation">
            <a name="scoring" href="[[rootPath]]#/scoring">{{localize('scoreMenuItem')}}</a>
            <a name="capture" href="[[rootPath]]#/capture">{{localize('captureMenuItem')}}</a>
            <a name="parameters" href="[[rootPath]]#/parameters">{{localize('parametersMenuItem')}}</a>
          </iron-selector>
        </app-drawer>

        <!-- Main content -->
        <app-header-layout has-scrolling-region="">

          <app-header slot="header" condenses="" reveals="" effects="waterfall">
            <app-toolbar>
              <paper-icon-button icon="my-icons:menu" drawer-toggle=""></paper-icon-button>
              <div main-title="">{{localize('applicationTitle')}}</div>
            </app-toolbar>
          </app-header>

          <iron-pages selected="[[page]]" attr-for-selected="name" role="main">
            <ai-scoring name="scoring" 
              duration="{{simulationInformation.duration}}" 
              request-rate="{{simulationInformation.requestRate}}"
              defect-rate="{{simulationInformation.defectRate}}"
              url="{{credentials.url}}"
              user="{{credentials.user}}"
              api-key="{{credentials.apiKey}}"
              cell="{{scoringInformation.cell}}"
              product="{{scoringInformation.product}}"></ai-scoring>
            <ai-capture name="capture" 
              duration="{{simulationInformation.duration}}" 
              request-rate="{{simulationInformation.requestRate}}"
              defect-rate="{{simulationInformation.defectRate}}"
              url="{{credentials.url}}"
              user="{{credentials.user}}"
              api-key="{{credentials.apiKey}}"
              cell="{{scoringInformation.cell}}"
              product="{{scoringInformation.product}}"></ai-capture>
          <ai-parameters name="parameters" 
              url="{{credentials.url}}"
              user="{{credentials.user}}"
              api-key="{{credentials.apiKey}}"
              cell="{{scoringInformation.cell}}"
              product="{{scoringInformation.product}}"></ai-parameters>
            <ai-view404 name="view404"></ai-view404>
          </iron-pages>
        </app-header-layout>
      </app-drawer-layout>

      <app-localstorage-document key="credentials" data="{{credentials}}"></app-localstorage-document>
      <app-localstorage-document key="simulationInformation" data="{{simulationInformation}}"></app-localstorage-document>
      <app-localstorage-document key="scoringInformation" data="{{scoringInformation}}"></app-localstorage-document>

    `;
  }


  static get properties() {
    return {
      page: {
        type: String,
        reflectToAttribute: true,
        observer: '_pageChanged'
      },
      routeData: Object,
      subroute: Object,
      credentials: {
        type: Object,
        notify: true,
        value: {},
      },
      simulationInformation:  {
        type: Object,
        notify: true,
        value: {},
      },
      scoringInformation:  {
        type: Object,
        notify: true,
        value: {},
      },
    };
  }

  static get observers() {
    return [
      '_routePageChanged(routeData.page)'
    ];
  }

  _routePageChanged(page) {
     // Show the corresponding page according to the route.
     //
     // If no page was found in the route data, page will be an empty string.
     // Show 'view1' in that case. And if the page doesn't exist, show 'view404'.
    if (!page) {
      this.page = 'scoring';
    } else if (['scoring', 'capture', 'parameters'].indexOf(page) !== -1) {
      this.page = page;
    } else {
      this.page = 'view404';
    }

    // Close a non-persistent drawer when the page & route are changed.
    if (!this.$.drawer.persistent) {
      this.$.drawer.close();
    }
  }

  _pageChanged(page) {
    // Import the page component on demand.
    //
    // Note: `polymer build` doesn't like string concatenation in the import
    // statement, so break it up.
    switch (page) {
      case 'scoring':
        import('./ai-scoring.js');
        break;
      case 'capture':
        import('./ai-capture.js');
        break;
      case 'parameters':
        import('./ai-parameters.js');
        break;
      case 'view404':
        import('./ai-404.js');
        break;
    }
  }
}

window.customElements.define('ai-app', AIApp);
