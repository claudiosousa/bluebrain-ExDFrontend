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

  gz3dServices.factory('gz3d', [
    '$rootScope', '$window', '$compile', 'simulationInfo', 'bbpConfig',
    function ($rootScope, $window, $compile, simulationInfo, bbpConfig) {

      /* moved from the gz3d-view.html*/
      if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
      }

      function GZ3DService() {

        var that = this;

        var requestId = null;
        var isInitialized = false;
        var offsetHeightListenerUnregister = null;

        var resizeGZ3D = function() {
          that.scene.setWindowSize(that.container.offsetWidth, that.container.offsetHeight);
        };

        this.createRenderContainer = function(adjustable, name, topic) {
          var renderContainer,
            renderContainerHTML = '<camera-view keep-aspect-ratio class="render-view-container camera-view-window"';

          if (adjustable) {
            renderContainerHTML += ' movable resizeable';
          }
          renderContainerHTML += ' topic="' + topic + '"';
          renderContainerHTML += ' camera-name=' + name + '></camera-view>';

          renderContainer = $compile(renderContainerHTML)($rootScope)[0];

          return renderContainer;
        };

        var animate = function() {
          requestId = requestAnimationFrame(animate);
          render();
        };

        var render = function() {
          if (!angular.isDefined(that.scene)) {
            return;
          }

          that.scene.render();
        };

        this.isGlobalLightMaxReached = function () {
          if (that.scene === undefined) {
            return false;
          }

          var linfo = this.scene.findLightIntensityInfo();

          if (linfo.max >= 1.0) {
            return true;
          }
          else {
            return false;
          }
        };

        this.isGlobalLightMinReached = function () {
          if (that.scene === undefined) {
            return false;
          }

          var linfo = this.scene.findLightIntensityInfo();
          if (linfo.max <= 0.1) {
            return true;
          }
          else {
            return false;
          }
        };

        this.setLightHelperVisibility = function () {
          that.scene.scene.traverse(function (node) {
            if (node.name.indexOf('_lightHelper') > -1) {
              node.visible = that.scene.showLightHelpers;  //TODO: showLightHelpers should be part of this service?
            }
          });
        };

        this.Initialize = function() {
          if (isInitialized) {
            return;
          }

          GZ3D.assetsPath = simulationInfo.serverConfig.gzweb.assets;
          GZ3D.webSocketUrl = simulationInfo.serverConfig.gzweb.websocket;
          GZ3D.animatedModel = simulationInfo.animatedModel;

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

          this.container = document.getElementById('container');

          this.scene = new GZ3D.Scene();
          this.scene.viewManager.setCallbackCreateRenderContainer(this.createRenderContainer);

          this.gui = new GZ3D.Gui(this.scene);
          this.iface = new GZ3D.GZIface(this.scene, this.gui);
          this.sdfParser = new GZ3D.SdfParser(this.scene, this.gui, this.iface);

          // FPS indicator
          this.stats = new Stats();
          this.stats.domElement.style.position = 'absolute';
          this.stats.domElement.style.top = '0px';
          this.stats.domElement.style.zIndex = 100;

          animate();
          $($window).on('resize', resizeGZ3D, false);

          //TODO: is this necessary?
          offsetHeightListenerUnregister = $rootScope.$watch(function() {
            return that.container.offsetHeight;
          }, function(newValue, oldValue) {
            if ((newValue !== oldValue) && angular.isDefined(that.scene)) { resizeGZ3D(); }
          }, true);

          isInitialized = true;
        };

        this.deInitialize = function() {
          if (angular.isFunction(offsetHeightListenerUnregister)) {
            offsetHeightListenerUnregister();
          }
          $($window).off('resize', resizeGZ3D, false);
          $window.cancelAnimationFrame(that.requestId);

          delete that.sdfParser;
          delete that.iface;
          delete that.gui;
          delete that.scene;

          delete that.container;
          delete that.stats;
          delete that.createRenderContainer;

          isInitialized = false;
        };
      }

      return new GZ3DService();
  }]);
}());
