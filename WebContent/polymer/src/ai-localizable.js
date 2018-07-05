import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import {AppLocalizeBehavior} from '@polymer/app-localize-behavior/app-localize-behavior.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';

export class AILocalizable extends mixinBehaviors([AppLocalizeBehavior], PolymerElement) {

	__resolveApp() {
		var tmp = this;
		while ( tmp != null && tmp.tagName != 'AI-APP' ) {
			if ( tmp instanceof ShadowRoot ) tmp = tmp.host;
			else tmp = tmp.parentNode;
		}
		return tmp;
	}

	localize(key, args, format) {
		if ( this.tagName == "AI-APP" ) {
			if ( this.language == undefined ) {
				this.language = window.navigator.userLanguage || window.navigator.language;	
				this.loadResources(this.resolveUrl('locales.json'));
			}
			return super.localize(key, args, format);
		}
		var app = this.__resolveApp();
		if ( app != null ) return app.localize(key, args, format);
		return document.querySelector("ai-app").localize(key, args, format);
	}
}