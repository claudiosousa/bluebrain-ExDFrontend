/* global console: false */
/* global GZ3D: false */
/* global Detector: false */
/* global Stats: false */

(function () {
  'use strict';

  var gz3dServices = angular.module('gz3dServices', []);

  gz3dServices.factory('gzInitialization', [ '$rootScope', '$window', '$stateParams', '$compile', 'bbpConfig',
    function ($rootScope, $window, $stateParams, $compile, bbpConfig) {
    /* moved from the gz3d-view.html*/
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage();
    }

    var requestId;
    var isInitialized = false;
    var offsetHeightListenerUnregister;

    var resizeGZ3D = function() {
      $rootScope.scene.setWindowSize($rootScope.container.offsetWidth, $rootScope.container.offsetHeight);
    };

    var initialize = function(serverID, simulationID) {
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

      $rootScope.container = document.getElementById( 'container' );

      $rootScope.scene = new GZ3D.Scene($rootScope.container, $rootScope, $compile);
      $rootScope.gui = new GZ3D.Gui($rootScope.scene);
      $rootScope.iface = new GZ3D.GZIface($rootScope.scene, $rootScope.gui);
      $rootScope.sdfparser = new GZ3D.SdfParser($rootScope.scene, $rootScope.gui, $rootScope.iface);

      // FPS indicator
      $rootScope.stats = new Stats();
      $rootScope.stats.domElement.style.position = 'absolute';
      $rootScope.stats.domElement.style.top = '0px';
      $rootScope.stats.domElement.style.zIndex = 100;

      $rootScope.animate = function() {
        requestId = requestAnimationFrame($rootScope.animate);
        $rootScope.render();
      };

      $rootScope.render = function() {
        $rootScope.scene.render();
      };

      $rootScope.animate();
      $window.addEventListener('resize', resizeGZ3D, false);

      offsetHeightListenerUnregister = $rootScope.$watch(function() {
        return $rootScope.container.offsetHeight;
      }, function(newValue, oldValue) {
        if ((newValue !== oldValue) && angular.isDefined($rootScope.scene)) {
          resizeGZ3D();
        }
      }, true);
    };

    var deInitialize = function() {
      if (angular.isFunction(offsetHeightListenerUnregister)) {
        offsetHeightListenerUnregister();
      }
      $window.removeEventListener('resize', resizeGZ3D);
      $window.cancelAnimationFrame(requestId);

      isInitialized = false;

      delete $rootScope.sdfparser;
      delete $rootScope.iface;
      delete $rootScope.gui;
      delete $rootScope.scene;

      delete $rootScope.container;
      delete $rootScope.stats;
      delete $rootScope.animate;
      delete $rootScope.render;
    };

    // now expose our public functions
    return {
      Initialize: initialize,
      deInitialize: deInitialize
    };
  }]);
}());
