/* global console: false */
/* global GZ3D: false */
/* global Detector: false */
/* global Stats: false */

(function () {
  'use strict';

  var gz3dServices = angular.module('gz3dServices', []);

  // TODO(Luc): make sure connect is called when the websocket is itself connected
  gz3dServices.factory('gzCommunication', ['$rootScope', function ($rootScope) {
    return {
      topic: undefined,
      connect: function (topic, messageType) {
        this.topic = new ROSLIB.Topic({ // jshint ignore:line
          ros: $rootScope.iface.webSocket, // jshint ignore:line
          name: topic,
          messageType: messageType
        });
        return this;
      },
      subscribe: function (callback) {
        if (this.topic) {
          this.topic.subscribe(callback);
        }
      }
    };
  }]);

  gz3dServices.factory('simulationStatistics', [ 'gzInitialization', 'gzCommunication', function (gzInitialization, gzCommunication) {
    var simulationTimeCallback;
    var realTimeCallback;

    // we now create the callback function which we will register below
    var worldStatsUpdate = function (stats) {
      try {
        realTimeCallback(stats.real_time.sec);
        simulationTimeCallback(stats.sim_time.sec);
      } catch (err) {
        if (typeof(realTimeCallback) !== 'function' || typeof(simulationTimeCallback) !== 'function') {
          console.error('Tried to call an undefined callback function! Did you forget to set it?');
        }
        console.error(err.message);
      }
    };

    gzCommunication
      .connect('~/world_stats', 'worldstatistics')
      .subscribe(worldStatsUpdate);

    // now expose our public functions
    return {
      setSimulationTimeCallback: function (callback) {
        simulationTimeCallback = callback;
      },
      setRealTimeCallback: function (callback) {
        realTimeCallback = callback;
      }
    };

  }]);

  gz3dServices.factory('gzInitialization', [ '$rootScope', '$window', '$stateParams', 'bbpConfig', function ($rootScope, $window, $stateParams, bbpConfig) {
    /* moved from the gz3d-view.html*/
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage();
    }

    if (!$stateParams.serverID || !$stateParams.simulationID){
      throw "No serverID or simulationID given.";
    }
    var serverID = $stateParams.serverID;
    var simulationID = $stateParams.simulationID;
    var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];

    GZ3D.assetsPath = serverConfig.gzweb.assets;
    GZ3D.webSocketUrl = serverConfig.gzweb.websocket;

    $rootScope.scene = new GZ3D.Scene();
    $rootScope.gui = new GZ3D.Gui($rootScope.scene);
    $rootScope.iface = new GZ3D.GZIface($rootScope.scene, $rootScope.gui);
    $rootScope.sdfparser = new GZ3D.SdfParser($rootScope.scene, $rootScope.gui, $rootScope.iface);

    $rootScope.container = document.getElementById( 'container' );
    $rootScope.container.appendChild($rootScope.scene.getDomElement());

    // FPS indicator
    $rootScope.stats = new Stats();
    $rootScope.stats.domElement.style.position = 'absolute';
    $rootScope.stats.domElement.style.top = '0px';
    $rootScope.stats.domElement.style.zIndex = 100;
    //container.appendChild( stats.domElement );

    $rootScope.animate = function() {
      requestAnimationFrame($rootScope.animate);
      $rootScope.render();
    };

    $rootScope.render = function() {
      $rootScope.scene.render();
      //$rootScope.stats.update();
    };

    $rootScope.animate();
    $window.addEventListener( 'resize', function(){
      $rootScope.scene.setWindowSize($rootScope.container.offsetWidth, $rootScope.container.offsetHeight);
    }, false);

    $rootScope.$watch(function() {
      return $rootScope.container.offsetHeight;
    }, function(newValue, oldValue) {
      if (newValue !== oldValue) {
        $rootScope.scene.setWindowSize($rootScope.container.offsetWidth, $rootScope.container.offsetHeight);
      }
    }, true);
  }]);
}());
