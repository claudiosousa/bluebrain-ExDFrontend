/* global console: false */
/* global GZ3D: false */
/* global Detector: false */
/* global Stats: false */

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
    var retval = {};

    var resizeGZ3D = function() {
      retval.scene.setWindowSize(retval.container.offsetWidth, retval.container.offsetHeight);
    };

    retval.Initialize = function(serverID, simulationID) {
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

      retval.container = document.getElementById('container');

      retval.scene = new GZ3D.Scene(retval.container, $rootScope, $compile);
      retval.gui = new GZ3D.Gui(retval.scene);
      retval.iface = new GZ3D.GZIface(retval.scene, retval.gui);
      retval.sdfParser = new GZ3D.SdfParser(retval.scene, retval.gui, retval.iface);

      // FPS indicator
      retval.stats = new Stats();
      retval.stats.domElement.style.position = 'absolute';
      retval.stats.domElement.style.top = '0px';
      retval.stats.domElement.style.zIndex = 100;

      retval.animate = function() {
        requestId = requestAnimationFrame(retval.animate);
        retval.render();
      };

      retval.render = function() {
        retval.scene.render();
      };

      retval.animate();
      $window.addEventListener('resize', resizeGZ3D, false);

      offsetHeightListenerUnregister = $rootScope.$watch(function() {
        return retval.container.offsetHeight;
      }, function(newValue, oldValue) {
        if ((newValue !== oldValue) && angular.isDefined(retval.scene)) {
          resizeGZ3D();
        }
      }, true);
    };

    retval.deInitialize = function() {
      if (angular.isFunction(offsetHeightListenerUnregister)) {
        offsetHeightListenerUnregister();
      }
      $window.removeEventListener('resize', resizeGZ3D);
      $window.cancelAnimationFrame(requestId);

      isInitialized = false;

      delete retval.sdfParser;
      delete retval.iface;
      delete retval.gui;
      delete retval.scene;

      delete retval.container;
      delete retval.stats;
      delete retval.animate;
      delete retval.render;
    };

    return retval;
  }]);
}());
