/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/
(function() {
  'use strict';

  // This file contains a service for browser detection
  // The service stores the list of supported browsers and has two public methods:
  // getBrowserVersion, that retrieves the most common browser versions by means of the user agent
  // isSupported, that returns true if the detected browser is supported, false it is unrecognised or unsupported.
  
  var module = angular.module('nrpBrowserDetection', []);
  module.factory('browserSupport', ['$window', function($window) {
    var getBrowserVersion = function() {
      // Adapted from http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
      var userAgent = $window.navigator.userAgent;
      var t;
      var matches = userAgent.match(/(opera|chrome|safari|firefox|msie|trident|phantomjs(?=\/))\/?\s*(\d+)/i);
      if (matches === null) {
        return 'unknown'; // All Nokia and some Opera versions (for version < 9) won't be recognised
      }
      if (/trident/i.test(matches[1])){
          t = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
          return 'IE ' + (t[1] || '');
      }
      if (matches[1] === 'Chrome'){
          t = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
          if (t !== null) { 
            return t.slice(1).join(' ').replace('OPR', 'Opera');
          }
      }
      matches = matches[2] ? [matches[1], matches[2]] : [navigator.appName, navigator.appVersion, '-?'];
      t = userAgent.match(/version\/(\d+)/i);
      if (t !== null) {
        matches.splice(1, 1, t[1]);
      }
      return matches.join(' ');
    };

    var SUPPORTED_BROWSERS = ['Chrome', 'Firefox', 'Safari'];
    var regExpString = SUPPORTED_BROWSERS.join('|').toLowerCase();
    var re = new RegExp(regExpString);
    
    var isSupported = function() {
      var browser = getBrowserVersion();
      if (browser === 'unknown') {
        return false;
      }
      browser = browser.toLowerCase();
      return re.test(browser);
    };

    return { getBrowserVersion: getBrowserVersion, 
             SUPPORTED_BROWSERS: SUPPORTED_BROWSERS, 
             isSupported: isSupported 
           };
  }]);
}());
