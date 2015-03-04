(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name exdFrontendApp.controller:Gz3dViewCtrl
   * @description
   * # Gz3dViewCtrl
   * Controller of the exdFrontendApp
   */

  /* global GZ3D: false */

  /* global THREE: false */
  /* global console: false */

  angular.module('exdFrontendApp.Constants', [])
    // constants for the server side status
    .constant('STATE', {
      CREATED: 'created',
      STARTED: 'started',
      PAUSED: 'paused',
      INITIALIZED: 'initialized',
      STOPPED: 'stopped',
      UNDEFINED: 'undefined'
    })
    .constant('ERROR', {
      UNDEFINED_STATE: 'The latest active simulation is corrupted: undefined state.',
      UNDEFINED_ID: 'The latest active simulation is corrupted: undefined id.'
    });

  angular.module('exdFrontendApp')
    .controller('Gz3dViewCtrl', ['$rootScope', '$scope', '$stateParams', 'bbpConfig', 'gzInitialization',
      'simulationGenerator', 'simulationService', 'simulationControl', 'simulationState', 'simulationStatistics',
      'lightControl', 'screenControl', 'cameraManipulation', 'splash', 'roslib', 'STATE', 'ERROR',
        function ($rootScope, $scope, $stateParams, bbpConfig, gzInitialization,
          simulationGenerator, simulationService, simulationControl, simulationState, simulationStatistics,
          lightControl, screenControl, cameraManipulation, splash, roslib, STATE, ERROR) {

      if (!$stateParams.serverID || !$stateParams.simulationID){
        throw "No serverID or simulationID given.";
      }
      var serverID = $stateParams.serverID;
      var simulationID = $stateParams.simulationID;
      var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];
      var serverBaseUrl = serverConfig.gzweb['nrp-services'];
      $scope.state = STATE.UNDEFINED;
      $scope.STATE = STATE;

      $scope.isInitialized = false;

      simulationState(serverBaseUrl).state({sim_id: simulationID}, function(data){
        $scope.state = data.state;
        $scope.registerForStatusInformation();
      });

      $scope.registerForStatusInformation = function() {
          var rosbridgeWebsocketUrl = serverConfig.rosbridge.websocket;
          var statusTopic = serverConfig.rosbridge.topics.status;

          $scope.rosConnection = $scope.rosConnection || roslib.createConnectionTo(rosbridgeWebsocketUrl);
          $scope.statusListener = $scope.statusListener || roslib.createStringTopic($scope.rosConnection, statusTopic);

          $scope.statusListener.unsubscribe(); // clear old subscriptions
          $scope.statusListener.subscribe(function (data) {
            var message = JSON.parse(data.data);
            if (message !== undefined && message.progress !== undefined) {
              $scope.splashScreen = $scope.splashScreen || splash.open();
              if (message.progress.done !== undefined && message.progress.done) {
                splash.setHeadline('Finished!');
                splash.setSubHeadline('');
                $scope.splashScreen.close();
                $scope.splashScreen = undefined;
              } else {
                splash.setHeadline(message.progress.task);
                splash.setSubHeadline(message.progress.subtask);
              }
            }
          });
      };

      $scope.updateSimulation = function (newState) {
        simulationState(serverBaseUrl).update({sim_id: simulationID}, {state: newState}, function(data) {
          $scope.state = data.state;
        });
      };

      simulationStatistics.setRealTimeCallback(function (realTimeValue) {
        $scope.$apply(function() {
          $scope.realTimeText = realTimeValue;
        });
      });

      simulationStatistics.setSimulationTimeCallback(function (simulationTimeValue) {
        $scope.$apply(function() {
          $scope.simulationTimeText = simulationTimeValue;
        });
      });

      // stores, whether the context menu should be displayed
      $scope.isContextMenuShown = false;

      // the position of the context menu
      $scope.contextMenuTop = 0;
      $scope.contextMenuLeft = 0;

      $scope.hoveredObject = '';

      $scope.getModelUnderMouse = function(event) {
        var pos = new THREE.Vector2(event.clientX, event.clientY);
        var intersect = new THREE.Vector3();
        var model = $rootScope.scene.getRayCastModel(pos, intersect);
        return model;
      };

      $scope.updateHoverInfo = function (event) {
        var model = $scope.getModelUnderMouse(event);
        if (model !== null && model !== undefined) {
          $scope.hoveredObject = model.name;
        } else {
          $scope.hoveredObject = '';
        }
      };

      // for convenience we pass just a string as "red" or "blue" currently, this will be replaced later on
      $scope.setColorOnEntity = function (value) {
        if(!$scope.selectedEntity) {
          console.error('Could not change screen color since there was no object selected');
          return;
        }
        var colors = {red: 0xff0000, blue: 0x0000ff};

        // the following line would change the color for a simple box
        //var entityToChange = scene.getByName(scene.selectedEntity.name + "::link::visual");

        // since we currently want restrict ourselves to screens we go with:
        var entityToChange = $rootScope.scene.getByName($scope.selectedEntity.name + '::body::screen_glass');
        var child = entityToChange.children[0];
        var material = child ? child.material : undefined;

        if (entityToChange && child && material && colors[value]) {
          // currently we use .setHex(), because for some reason regRGB() does not respect the
          // brightness, i.e. when turning the lights down the objects do not get darker
          material.color.setHex(colors[value]);
          material.ambient.setHex(colors[value]);
          material.specular.setHex(colors[value]);

          // send RESTful commands to server
          var screenParams = {};

          if (($scope.selectedEntity.name === 'right_vr_screen') && (value === 'red'))
          {
            screenParams.name = 'RightScreenToRed';
          }
          else if (($scope.selectedEntity.name === 'left_vr_screen') && (value === 'red'))
          {
            screenParams.name = 'LeftScreenToRed';
          }
          else if (($scope.selectedEntity.name === 'right_vr_screen') && (value === 'blue'))
          {
            screenParams.name = 'RightScreenToBlue';
          }
          else if (($scope.selectedEntity.name === 'left_vr_screen') && (value === 'blue'))
          {
            screenParams.name = 'LeftScreenToBlue';
          }

          screenControl(serverBaseUrl).updateScreenColor({sim_id: simulationID}, screenParams);
        }

        // deactivate the context menu after a color was assigned
        $scope.toggleScreenChangeMenu(false);
      };

      // this menu is currently only displayed if the model name contains "screen"
      $scope.toggleScreenChangeMenu = function (show, event) {
        if (show) {
          if (!$scope.isContextMenuShown) {
            var model = $scope.getModelUnderMouse(event);
            // scene.radialMenu.showing is a property of GZ3D that was originally used to display a radial menu, We are
            // reusing it for our context menu. The reason is that this variables disables or enables the controls of
            // scene in the render loop.
            $rootScope.scene.radialMenu.showing = $scope.isContextMenuShown =
              (model &&
               model.name !== '' &&
               model.name !== 'plane' &&
               model.name.indexOf('screen') !== -1 &&
              $rootScope.scene.modelManipulator.pickerNames.indexOf(model.name) === -1);

            $scope.contextMenuTop = event.clientY;
            $scope.contextMenuLeft = event.clientX;
            $scope.selectedEntity = $rootScope.scene.selectedEntity;
          }
        }
        else
        {
          $scope.isContextMenuShown = false;
          $rootScope.scene.radialMenu.showing = false;
        }
      };

      // Lights management
      $scope.sliderPosition = 50;
      $scope.updateLightIntensities = function(sliderPosition) {
        var ratio = (sliderPosition - 50.0) / 50.25; // turns the slider position (in [0,100]) into an increase/decrease ratio (in [-1, 1])
        // we avoid purposedly -1.0 when dividing by 50 + epsilon -- for zero intensity cannot scale to a positive value!
        $rootScope.scene.emitter.emit('lightChanged', ratio);
      };

      $scope.cameraTranslate = function (right, up, forward) {
        cameraManipulation.firstPersonTranslate(right, up, forward);
      };

      $scope.cameraRotate = function (degreeRight, degreeUp) {
        cameraManipulation.firstPersonRotate(degreeRight, degreeUp);
      };

      $scope.cameraLookAtOrigin = function () {
        cameraManipulation.lookAtOrigin();
      };

      $scope.cameraResetToInitPose = function () {
        cameraManipulation.resetToInitialPose();
      };

  }]);
}());
