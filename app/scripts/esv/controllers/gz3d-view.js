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

  angular.module('exdFrontendApp.Constants')
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
    })
    .constant('OPERATION_MODE', {
      VIEW : 'view',
      EDIT : 'edit'
    })
    .constant('UI', {
      UNDEFINED: -1,
      PLAY_BUTTON: 0,
      PAUSE_BUTTON: 1,
      STOP_BUTTON: 2,
      RESET_BUTTON: 3,
      TIME_DISPLAY: 4,
      LIGHT_SLIDER: 5,
      CAMERA_TRANSLATION: 6,
      CAMERA_ROTATION: 7,
      SPIKETRAIN: 8,
      OWNER_DISPLAY: 9,
      EXIT_BUTTON: 10,
      ROBOT_VIEW: 11,
      CODE_EDITOR: 12
    });

  angular.module('exdFrontendApp')
    // Panels
    .config(['panelsProvider', function (panelsProvider) {
      panelsProvider
        .add({
          id: 'code-editor',
          position: 'left',
          size: '50%',
          templateUrl: 'views/esv/editor-panel.html',
          controller: 'editorPanelCtrl',
          openCallbackFunction: 'openCallback',
          closeCallbackFunction: 'closeCallback'
        });
    }])
    .controller('Gz3dViewCtrl', ['$rootScope', '$scope', '$stateParams', '$timeout',
      '$location', '$http', '$window', '$document', 'bbpConfig',
      'hbpUserDirectory', 'simulationGenerator', 'simulationService', 'simulationControl',
      'simulationState', 'serverError', 'screenControl', 'experimentList',
      'timeDDHHMMSSFilter', 'splash', 'assetLoadingSplash', 'roslib', 'STATE', 'ERROR', 'nrpBackendVersions',
      'nrpFrontendVersion', 'panels', 'UI', 'OPERATION_MODE', 'gz3d', 'EDIT_MODE', 'stateService',
        function ($rootScope, $scope, $stateParams, $timeout, $location, $http, $window, $document, bbpConfig,
          hbpUserDirectory, simulationGenerator, simulationService, simulationControl,
          simulationState, serverError, screenControl, experimentList,
          timeDDHHMMSSFilter, splash, assetLoadingSplash, roslib, STATE, ERROR, nrpBackendVersions,
          nrpFrontendVersion, panels, UI, OPERATION_MODE, gz3d, EDIT_MODE, stateService) {

      if (!$stateParams.serverID || !$stateParams.simulationID){
        throw "No serverID or simulationID given.";
      }
      var serverID = $stateParams.serverID;
      var simulationID = $stateParams.simulationID;
      var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];
      var serverBaseUrl = serverConfig.gzweb['nrp-services'];

      $scope.operationMode = $stateParams.mode;
      $scope.helpModeActivated = false;
      $scope.helpDescription="";
      $scope.helpText = {};
      $scope.currentSelectedUIElement = UI.UNDEFINED;

      $scope.rosbridgeWebsocketUrl = serverConfig.rosbridge.websocket;
      $scope.spikeTopic = serverConfig.rosbridge.topics.spikes;

      $scope.STATE = STATE;
      $scope.OPERATION_MODE = OPERATION_MODE;
      $scope.UI = UI;
      $scope.isOwner = false;
      $scope.isInitialized = false;
      $scope.isJoiningStoppedSimulation = false;
      $scope.gz3d = gz3d;
      $scope.stateService = stateService;
      $scope.EDIT_MODE = EDIT_MODE;

      hbpUserDirectory.getCurrentUser().then(function (profile) {
        $scope.userName = profile.displayName;
        $scope.userID = profile.id;
        simulationControl(serverBaseUrl).simulation({sim_id: simulationID}, function(data){
          $scope.ownerID = data.owner;
          var experimentConfiguration = data.experimentConfiguration;
          // get experiment list from current server
          experimentList(serverBaseUrl).experiments(function (data) {
            angular.forEach(data.data, function(experimentTemplate) {
              if (experimentTemplate.experimentConfiguration === experimentConfiguration) {
                $scope.ExperimentDescription = experimentTemplate.description;
              }
            });
          });
          hbpUserDirectory.get([data.owner]).then(function (profile)
          {
            $scope.owner = simulationService().getUserName(profile);
          });
          $scope.isOwner = ($scope.ownerID === $scope.userID);
        });
      });

      $scope.versions = {};
      nrpFrontendVersion.get(function(data) { $scope.versions.hbp_nrp_esv = data.hbp_nrp_esv; });
      nrpBackendVersions(serverBaseUrl).get(function(data) {
        $scope.versions = angular.extend($scope.versions, data);
      });
      /* status messages are listened to here. A splash screen is opened to display progress messages. */
      /* This is the case when closing an simulation for example. Loading is taken take of */
      /* by a progressbar somewhere else. */
      /* Timeout messages are displayed in the toolbar. */
      $scope.registerForStatusInformation = function() {
        var rosbridgeWebsocketUrl = $scope.rosbridgeWebsocketUrl;
        var statusTopic = serverConfig.rosbridge.topics.status;
        var callbackOnClose = function() {
          $scope.splashScreen = undefined;
          /* avoid "$apply already in progress" error */
          _.defer(function() { // jshint ignore:line
            $scope.$apply(function() { $location.path("esv-web"); });
          });
        };

        $scope.rosConnection = $scope.rosConnection || roslib.getOrCreateConnectionTo(rosbridgeWebsocketUrl);
        $scope.statusListener = $scope.statusListener || roslib.createStringTopic($scope.rosConnection, statusTopic);

        $scope.statusListener.unsubscribe(); // clear old subscriptions
        $scope.statusListener.subscribe(function (data) {
          var message = JSON.parse(data.data);
          /* State messages */
          /* Manage before other since others may depend on state changes */
          if (message !== undefined && message.state !== undefined) {
            $scope.$apply(function() { stateService.currentState = message.state; });
          }
          /* Progress messages (apart start state progress messages which are handled by another progress bar) */
          if (message !== undefined && message.progress !== undefined && stateService.currentState !== STATE.STARTED ) {
            $scope.splashScreen = $scope.splashScreen || splash.open(
                !message.progress.block_ui,
                ((stateService.currentState === STATE.STOPPED) ? callbackOnClose : undefined));
            if (message.progress.done !== undefined && message.progress.done) {
              splash.spin = false;
              splash.setMessage({ headline: 'Finished' });

              /* if splash is a blocking modal (no button), then close it */
              /* (else it is closed by the user on button click) */
              if (!splash.showButton) {
                splash.close();
                $scope.splashScreen = undefined;
              }
            } else {
              splash.setMessage({ headline: message.progress.task, subHeadline: message.progress.subtask });
            }
          }
          /* Time messages */
          if (angular.isDefined(message)) {
            var to = angular.isDefined(message.timeout);
            var st = angular.isDefined(message.simulationTime);
            var rt = angular.isDefined(message.realTime);
            if (to || st || rt) {
              $scope.$apply(function() {
                if (to) {
                  $scope.simTimeoutText = message.timeout;
                }
                if (st) {
                  $scope.simulationTimeText = message.simulationTime;
                }
                if (rt) {
                  $scope.realTimeText = message.realTime;
                }
              });
            }
          }
        });
      };

      // Query the state of the simulation
      stateService.getCurrentState().then(function () {
        if (stateService.currentState === STATE.STOPPED) {
          // The Simulation is already Stopped, so do nothing more but show the alert popup
          $scope.isJoiningStoppedSimulation = true;
        } else {
          // Initialize GZ3D and so on...
          gz3d.Initialize($stateParams.serverID, $stateParams.simulationID);

          // Register for the status updates as well as the timing stats
          // Note that we have two different connections here, hence we only put one as a callback for
          // $rootScope.iface and the other one not!
          $scope.registerForStatusInformation();

          // Show the splash screen for the progress of the asset loading
          $scope.assetLoadingSplashScreen = $scope.assetLoadingSplashScreen || assetLoadingSplash.open(resetScreenColors);
          gz3d.iface.setAssetProgressCallback(function(data){
            assetLoadingSplash.setProgress(data);
          });
        }
      });

      // The following lines allow the joining client to retrieve the actual screen color stored by the server.
      // The method below gets the 'server' color for each screen since it might have been changed
      // by another client connected earlier to the same simulation.
      // This is a fix for Bug [NRRPLT-1899] that should be addressed properly on Gazebo's side:
      // https://bitbucket.org/osrf/gazebo/issue/1573/scene_info-does-not-reflect-older-changes
      // The lines following the /* istanbul ignore next */ comments will be removed once the Gazebo bug is fixed.
      /* istanbul ignore next */
      $scope.updateScreenColor = function(simulation, screenString) { // screenString must be either 'left' or 'right'
        var colors = {'Gazebo/Red': 0xff0000, 'Gazebo/Blue': 0x0000ff};
        var scene = gz3d.scene;// scene is undefined when closing and destroying the asset-loading splah screen
        var entity = scene ? scene.getByName(screenString + '_vr_screen::body::screen_glass') : undefined;
        if (entity) {
          var child = entity.children ? entity.children[0] : undefined;
          var material = child ? child.material : undefined;
          var value = simulation[screenString + '_screen_color'];
          var color = colors[value];
          if (angular.isDefined(material) && angular.isDefined(color)) {
            material.color.setHex(color);
            material.emissive.setHex(color);
            material.specular.setHex(color);
          }
        }
      };
      /* istanbul ignore next */
      var resetScreenColors = function() {
        simulationControl(serverBaseUrl).simulation({sim_id: simulationID}, function(data){
          $scope.updateScreenColor(data, 'left');
          $scope.updateScreenColor(data, 'right');
        });
      };

      $scope.updateSimulation = function (newState) {
        if (newState === stateService.currentState) {
          return; // avoid duplicated update requests
        }
        stateService.setCurrentState(newState).then(
          function () {
            // Temporary fix for screen color update on reset event, see comments above
            /* istanbul ignore next */
            if (newState === STATE.INITIALIZED) {
              resetScreenColors();
            }
          }
        )
        .catch(function(data) { serverError(data); });
      };

      // stores, whether the context menu should be displayed
      $scope.isContextMenuShown = false;

      // the position of the context menu
      $scope.contextMenuTop = 0;
      $scope.contextMenuLeft = 0;

      $scope.getModelUnderMouse = function(event) {
        var pos = new THREE.Vector2(event.clientX, event.clientY);
        var intersect = new THREE.Vector3();
        var model = gz3d.scene.getRayCastModel(pos, intersect);
        return model;
      };

      // for convenience we pass just a string as 'red' or 'blue' currently, this will be replaced later on
      $scope.setColorOnEntity = function (value) {
        if(!$scope.selectedEntity) {
          console.error('Could not change screen color since there was no object selected');
          return;
        }
        // send RESTful commands to server
        var screenParams = {};
        var name = $scope.selectedEntity.name;

        if ((name === 'right_vr_screen') && (value === 'red'))
        {
          screenParams.name = 'RightScreenToRed';
        }
        else if ((name === 'left_vr_screen') && (value === 'red'))
        {
          screenParams.name = 'LeftScreenToRed';
        }
        else if ((name === 'right_vr_screen') && (value === 'blue'))
        {
          screenParams.name = 'RightScreenToBlue';
        }
        else if ((name === 'left_vr_screen') && (value === 'blue'))
        {
          screenParams.name = 'LeftScreenToBlue';
        }

        screenControl(serverBaseUrl).updateScreenColor({sim_id: simulationID}, screenParams);


        // deactivate the context menu after a color was assigned
        $scope.toggleScreenChangeMenu(false);
      };

      // this menu is currently only displayed if the model name contains "screen"
      $rootScope.toggleScreenChangeMenu = function (show, event) {
        if($scope.isOwner) {
          if (show) {
            if (!$scope.isContextMenuShown) {
              var model = $scope.getModelUnderMouse(event);
              // scene.radialMenu.showing is a property of GZ3D that was originally used to display a radial menu, We are
              // reusing it for our context menu. The reason is that this variables disables or enables the controls of
              // scene in the render loop.
              gz3d.scene.radialMenu.showing = $scope.isContextMenuShown =
                (model &&
                model.name !== '' &&
                model.name !== 'plane' &&
                model.name.indexOf('screen') !== -1 &&
                gz3d.scene.modelManipulator.pickerNames.indexOf(model.name) === -1);


              $scope.contextMenuTop = event.clientY;
              $scope.contextMenuLeft = event.clientX;
              $scope.selectedEntity = gz3d.scene.selectedEntity;
            }
          }
          else {
            $scope.isContextMenuShown = false;
            gz3d.scene.radialMenu.showing = false;
          }
        }

      };

      // Lights management
      $scope.sliderPosition = 50;
      $scope.updateLightIntensities = function(sliderPosition) {
        var ratio = (sliderPosition - 50.0) / 50.25; // turns the slider position (in [0,100]) into an increase/decrease ratio (in [-1, 1])
        // we avoid purposely -1.0 when dividing by 50 + epsilon -- for zero intensity cannot scale to a positive value!
        gz3d.scene.emitter.emit('lightChanged', ratio);
      };

      // Camera manipulation
      var hasNavigationAlreadyBeenClicked = false;
      $scope.showKeyboardControlInfoDiv = false;

      // This should be integrated to the tutorial story when
      // it will be implemented !
      $scope.showKeyboardControlInfo = function() {
        if (!hasNavigationAlreadyBeenClicked)
        {
          hasNavigationAlreadyBeenClicked = true;
          $scope.showKeyboardControlInfoDiv = true;
          $timeout(function () {
            $scope.showKeyboardControlInfoDiv = false;
          }, 20000);
        }
      };

      $scope.requestMove = function(event, action) {
        if (!$scope.helpModeActivated && event.which === 1) { // camera control uses left button only
          gz3d.scene.controls.onMouseDownManipulator(action);
        }
      };

      $scope.releaseMove = function(event, action) {
        if (!$scope.helpModeActivated && event.which === 1) { // camera control uses left button only
          gz3d.scene.controls.onMouseUpManipulator(action);
        }
      };


      // Spiketrain
      $scope.showSpikeTrain = false;
      $scope.toggleSpikeTrain = function() {
        $scope.showSpikeTrain = !$scope.showSpikeTrain;
      };

      // robot view
      $scope.toggleRobotView = function() {
        gz3d.scene.views.forEach(function(view) {
          if (view.name === 'camera' /* view will be named the same as the corresponding camera sensor from the gazebo .sdf */) {
            view.active = !view.active;
            view.container.style.visibility = view.active ? 'visible' : 'hidden';
          }
        });
      };

      // help mode
      $scope.toggleHelpMode = function() {
        $scope.helpModeActivated = !$scope.helpModeActivated;
        $scope.helpDescription = "";
        $scope.currentSelectedUIElement = UI.UNDEFINED;
      };

      // clean up on leaving
      $scope.$on("$destroy", function() {
        // Close the splash screens
        if (angular.isDefined($scope.splashScreen)) {
          splash.close();
          delete $scope.splashScreen;
        }
        if (angular.isDefined($scope.assetLoadingSplashScreen)) {
          assetLoadingSplash.close();
          delete $scope.assetLoadingSplashScreen;
        }
        // unregister to the statustopic
        if (angular.isDefined($scope.statusListener)) {
          $scope.statusListener.unsubscribe();
          $scope.statusListener.removeAllListeners();
        }

        // Close the roslib connections
        if (angular.isDefined($scope.rosConnection)) {
          $scope.rosConnection.close();
        }
        if (angular.isDefined(gz3d.iface) && angular.isDefined(gz3d.iface.webSocket)) {
          gz3d.iface.webSocket.close();
        }
        gz3d.deInitialize();

        // Stop/Cancel loading assets
        // The window.stop() method is not supported by Internet Explorer
        // https://developer.mozilla.org/de/docs/Web/API/Window/stop
        if(angular.isDefined($window.stop)) {
          $window.stop();
        }
        else if(angular.isDefined($document.execCommand)) {
          $document.execCommand("Stop", false);
        }
      });

      $scope.help = function(uiElement){
        if($scope.currentSelectedUIElement === uiElement){
          $scope.helpDescription = "";
          $scope.currentSelectedUIElement = UI.UNDEFINED;
        }
        else {
          $scope.helpDescription = $scope.helpText[uiElement];
          $scope.currentSelectedUIElement = uiElement;
        }
      };

      $scope.edit = function() {
        panels.open('code-editor');
      };

      $scope.exit = function(path) {
        $location.path(path);
      };
    }]);
}());
