/* global console: false */
/* global GZ3D: false */
/* global Detector: false */
/* global Stats: false */

/* global self: false */
/**
 * global requestAnimationFrame() and cancelAnimationFrame()
 *
 * these global functions serve as wrappers of a native $window method (see https://css-tricks.com/using-requestanimationframe/ for detailed explanation)
 * in order to cover different API conventions and browser versions (see vendors)
 *
 * both functions are needed within Initialize() / deInitialize()
 * taken from three.js r62, where it was exposed globally in this fashion
 */
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
// using 'self' instead of 'window' for compatibility with both NodeJS and IE10.
( function () {
  'use strict';

  var lastTime = 0;
  var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

  for ( var x = 0; x < vendors.length && !self.requestAnimationFrame; x = x+1 ) {

    self.requestAnimationFrame = self[ vendors[ x ] + 'RequestAnimationFrame' ];
    self.cancelAnimationFrame = self[ vendors[ x ] + 'CancelAnimationFrame' ] || self[ vendors[ x ] + 'CancelRequestAnimationFrame' ];

  }

  if ( self.requestAnimationFrame === undefined && self.setTimeout !== undefined ) {

    self.requestAnimationFrame = function ( callback ) {

      var currTime = Date.now(), timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
      var id = self.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
      lastTime = currTime + timeToCall;
      return id;

    };

  }

  if( self.cancelAnimationFrame === undefined && self.clearTimeout !== undefined ) {

    self.cancelAnimationFrame = function ( id ) { self.clearTimeout( id ); };

  }

}() );


(function () {
  'use strict';

  var gz3dServices = angular.module('gz3dServices', []);

  gz3dServices.factory('gz3d', ['$rootScope', '$window', '$compile', 'simulationInfo', 'bbpConfig',
    function ($rootScope, $window, $compile, simulationInfo, bbpConfig) {
    /* moved from the gz3d-view.html*/
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage();
    }

    var requestId;
    var isInitialized = false;
    var offsetHeightListenerUnregister;
    var returnValue = {};

    var resizeGZ3D = function() {
      returnValue.scene.setWindowSize(returnValue.container.offsetWidth, returnValue.container.offsetHeight);
    };

    returnValue.Initialize = function() {
      if(isInitialized) {
        return;
      }
      isInitialized = true;

      GZ3D.assetsPath = simulationInfo.serverConfig.gzweb.assets;
      GZ3D.webSocketUrl = simulationInfo.serverConfig.gzweb.websocket;

      if (!bbpConfig.get('localmode.forceuser', false)) {
        var token;
        var clientID = bbpConfig.get('auth.clientId', '');
        var localStorageTokenKey = 'tokens-' + clientID + '@https://services.humanbrainproject.eu/oidc';
        if (localStorage.getItem(localStorageTokenKey)) {
          try {
            token = JSON.parse(localStorage.getItem(localStorageTokenKey))[0].access_token;
          } catch(e) {
            // this token will be rejected by the server and the client will get a proper auth error
            token = 'malformed-token';
          }
        } else {
          // this token will be rejected by the server and the client will get a proper auth error
          token = 'no-token';
        }
        GZ3D.webSocketToken = token;
      }

      returnValue.createRenderContainer = function(adjustable, name) {
        var renderContainer, renderContainerHTML;
        if (adjustable) {
          renderContainerHTML = '<camera-view movable resizeable keep-aspect-ratio class="render-view-container camera-view-window" camera-name=' + name + '></camera-view>';
        }
        else {
          renderContainerHTML = '<camera-view keep-aspect-ratio class="render-view-container camera-view-window" camera-name=' + name + '></camera-view>';
        }

        renderContainer = $compile(renderContainerHTML)($rootScope)[0];

        return renderContainer;
      };

      returnValue.container = document.getElementById('container');

      returnValue.scene = new GZ3D.Scene();
      returnValue.scene.viewManager.setCallbackCreateRenderContainer(returnValue.createRenderContainer);

      returnValue.gui = new GZ3D.Gui(returnValue.scene);
      returnValue.iface = new GZ3D.GZIface(returnValue.scene, returnValue.gui);
      returnValue.sdfParser = new GZ3D.SdfParser(returnValue.scene, returnValue.gui, returnValue.iface);

      // FPS indicator
      returnValue.stats = new Stats();
      returnValue.stats.domElement.style.position = 'absolute';
      returnValue.stats.domElement.style.top = '0px';
      returnValue.stats.domElement.style.zIndex = 100;

      returnValue.animate = function() {
        requestId = requestAnimationFrame(returnValue.animate);
        returnValue.render();
      };

      returnValue.render = function() {
        returnValue.scene.render();
      };

      returnValue.animate();
      $window.addEventListener('resize', resizeGZ3D, false);

      offsetHeightListenerUnregister = $rootScope.$watch(function() {
        return returnValue.container.offsetHeight;
      }, function(newValue, oldValue) {
        if ((newValue !== oldValue) && angular.isDefined(returnValue.scene)) {
          resizeGZ3D();
        }
      }, true);
    };

    returnValue.deInitialize = function() {
      if (angular.isFunction(offsetHeightListenerUnregister)) {
        offsetHeightListenerUnregister();
      }
      $window.removeEventListener('resize', resizeGZ3D);
      $window.cancelAnimationFrame(requestId);

      isInitialized = false;

      delete returnValue.sdfParser;
      delete returnValue.iface;
      delete returnValue.gui;
      delete returnValue.scene;

      delete returnValue.container;
      delete returnValue.stats;
      delete returnValue.animate;
      delete returnValue.render;
      delete returnValue.createRenderContainer;
    };

    return returnValue;
  }]);
}());
