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

  gz3dServices.factory('gz3d', ['$rootScope', '$window', '$stateParams', '$compile', 'bbpConfig',
    function ($rootScope, $window, $stateParams, $compile, bbpConfig) {
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

    returnValue.Initialize = function(serverID, simulationID) {
      if(isInitialized) {
        return;
      }
      isInitialized = true;
      if (!serverID || !simulationID){
        throw "No serverID or simulationID given.";
      }
      var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];

      GZ3D.assetsPath = serverConfig.gzweb.assets;
      GZ3D.webSocketUrl = serverConfig.gzweb.websocket;

      returnValue.container = document.getElementById('container');

      returnValue.scene = new GZ3D.Scene(returnValue.container, $rootScope, $compile);
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
    };

    return returnValue;
  }]);
}());
