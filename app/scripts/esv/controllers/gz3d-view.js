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
      CODE_EDITOR: 12,
      JOINT_PLOT: 13
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
    .controller('Gz3dViewCtrl',
      ['$rootScope', '$scope', '$timeout',
      '$location', '$http', '$window', '$document', 'bbpConfig',
      'hbpUserDirectory', 'simulationGenerator', 'simulationService',
      'simulationControl', 'simulationState', 'serverError',
      'screenControl', 'experimentList', 'experimentSimulationService',
      'timeDDHHMMSSFilter', 'splash', 'assetLoadingSplash',
      'STATE', 'ERROR', 'nrpBackendVersions',
      'nrpFrontendVersion', 'panels', 'UI', 'OPERATION_MODE',
      'gz3d', 'EDIT_MODE', 'stateService','contextMenuState',
      'simulationInfo',
        function ($rootScope, $scope, $timeout,
          $location, $http, $window, $document, bbpConfig,
          hbpUserDirectory, simulationGenerator, simulationService,
          simulationControl, simulationState, serverError,
          screenControl, experimentList, experimentSimulationService,
          timeDDHHMMSSFilter, splash, assetLoadingSplash,
          STATE, ERROR, nrpBackendVersions,
          nrpFrontendVersion, panels, UI, OPERATION_MODE,
          gz3d, EDIT_MODE, stateService, contextMenuState,
          simulationInfo) {

      // This is the only place where simulation info are, and should be, initialized
      simulationInfo.Initialize();

      stateService.Initialize();
      var serverID = simulationInfo.serverID;
      var simulationID = simulationInfo.simulationID;
      var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];
      var serverBaseUrl = serverConfig.gzweb['nrp-services'];

      $scope.operationMode = simulationInfo.mode;
      $scope.helpModeActivated = false;
      $scope.helpDescription = '';
      $scope.helpText = {};
      $scope.currentSelectedUIElement = UI.UNDEFINED;

      $scope.rosbridgeWebsocketUrl = serverConfig.rosbridge.websocket;
      $scope.spikeTopic = serverConfig.rosbridge.topics.spikes;
      $scope.jointTopic = serverConfig.rosbridge.topics.joint;

      $scope.STATE = STATE;
      $scope.OPERATION_MODE = OPERATION_MODE;
      $scope.UI = UI;
      $scope.viewState = {
        isOwner: false,
        isInitialized : false,
        isJoiningStoppedSimulation : false,
      };
      $scope.gz3d = gz3d;
      $scope.stateService = stateService;
      $scope.EDIT_MODE = EDIT_MODE;
      $scope.contextMenuState = contextMenuState;

      if (!bbpConfig.get('localmode.forceuser', false)) {
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
            $scope.viewState.isOwner = ($scope.ownerID === $scope.userID);
          });
        });
      } else {
        $scope.userName = bbpConfig.get('localmode.ownerID');
        $scope.userID = bbpConfig.get('localmode.ownerID');
        $scope.ownerID = bbpConfig.get('localmode.ownerID');
        $scope.owner = bbpConfig.get('localmode.ownerID');
        $scope.viewState.isOwner = true;
      }
 
      $scope.versions = {};
      nrpFrontendVersion.get(function(data) { $scope.versions.hbp_nrp_esv = data.hbp_nrp_esv; });
      nrpBackendVersions(serverBaseUrl).get(function(data) {
        $scope.versions = angular.extend($scope.versions, data);
      });

      /* status messages are listened to here. A splash screen is opened to display progress messages. */
      /* This is the case when closing an simulation for example. Loading is taken take of */
      /* by a progressbar somewhere else. */
      /* Timeout messages are displayed in the toolbar. */
      var messageCallback = function(message) {
        var callbackOnClose = function() {
          $scope.splashScreen = undefined;
          $location.path("esv-web");
        };

        /* Progress messages (apart start state progress messages which are handled by another progress bar) */
        if (angular.isDefined(message.progress) && message.state !== STATE.STARTED ) {
          $scope.splashScreen = $scope.splashScreen || splash.open(
              !message.progress.block_ui,
              ((stateService.currentState === STATE.STOPPED) ? callbackOnClose : undefined));
          if (angular.isDefined(message.progress.done) && message.progress.done) {
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
        if (angular.isDefined(message.timeout)) { $scope.simTimeoutText = message.timeout; }
        if (angular.isDefined(message.simulationTime)) { $scope.simulationTimeText = message.simulationTime; }
        if (angular.isDefined(message.realTime)) { $scope.realTimeText = message.realTime; }
      };

      // Query the state of the simulation
      stateService.getCurrentState().then(function () {
        if (stateService.currentState === STATE.STOPPED) {
          // The Simulation is already Stopped, so do nothing more but show the alert popup
          $scope.viewState.isJoiningStoppedSimulation = true;
        } else {
          // Initialize GZ3D and so on...
          gz3d.Initialize();

          // Register for the status updates as well as the timing stats
          // Note that we have two different connections here, hence we only put one as a callback for
          // $rootScope.iface and the other one not!
          /* Listen for status infromations */
          stateService.startListeningForStatusInformation();
          stateService.addMessageCallback(messageCallback);

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

      // play/pause/stop/initialize button handler
      $scope.simControlButtonHandler = function(newState) {

       $scope.updateSimulation(newState);
       $scope.setEditMode(EDIT_MODE.VIEW);

      };

      $scope.setEditMode = function (newMode) {

        //oldMode !== newMode
        if(gz3d.scene.manipulationMode !== newMode) {
            gz3d.scene.setManipulationMode(newMode);
        }
      };

      $scope.updateSimulation = function (newState) {
        stateService.setCurrentState(newState).then(
          function () {
            // Temporary fix for screen color update on reset event, see comments above
            /* istanbul ignore next */
            if (newState === STATE.INITIALIZED) {
              resetScreenColors();
              gz3d.scene.controls.onMouseDownManipulator('initPosition');
              gz3d.scene.controls.onMouseDownManipulator('initRotation');
              gz3d.scene.controls.update();
              gz3d.scene.controls.onMouseUpManipulator('initPosition');
              gz3d.scene.controls.onMouseUpManipulator('initRotation');
            }
          }
        );
      };

      // for convenience we pass just a string as 'red' or 'blue' currently, this will be replaced later on
      $scope.setColorOnEntity = function (value) {

        var selectedEntity = gz3d.scene.selectedEntity;

        if(!selectedEntity) {
          console.error('Could not change screen color since there was no object selected');
          return;
        }
        // send RESTful commands to server
        var screenParams = {};
        var name = selectedEntity.name;

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

        // hide context menu after a color was assigned
        contextMenuState.toggleContextMenu(false);
      };

      //ScreenChange context Menu setup
      var screenChangeMenuItemGroup = {
        label: 'Change Color',
        visible: false,
        items: [
             { text: 'Red',
               callback: function (event){ $scope.setColorOnEntity("red"); event.stopPropagation();},
               visible: false
             },
             { text: 'Blue',
               callback: function (event){ $scope.setColorOnEntity("blue"); event.stopPropagation();},
               visible: false
             }
        ],

        hide: function() {
            this.visible = this.items[0].visible = this.items[1].visible = false;
        },

        show: function(model) {
            var show =
              gz3d.scene.manipulationMode === EDIT_MODE.VIEW &&
              model.name.indexOf('screen') !== -1;

            return (this.visible =
                      this.items[0].visible =
                        this.items[1].visible = show);
          }
      };

      $window.oncontextmenu = function(event) {
          event.preventDefault();
          event.stopPropagation();
          return false;
      };
      contextMenuState.pushItemGroup(screenChangeMenuItemGroup);


      //main context menu handler
      $scope.toggleContextMenu = function (show, event) {

        if($scope.viewState.isOwner) {
           switch (event.button) {
            case 2:
              //right click -> show menu
              contextMenuState.toggleContextMenu(show, event);
              break;

            //other buttons -> hide menu
            case 0:
            case 1:
              contextMenuState.toggleContextMenu(false);
              break;
           }
        }
      };


      // Lights management
      $scope.sliderPosition = 50;
      $scope.updateLightIntensities = function(sliderPosition) {
        var ratio = (sliderPosition - 75.0) / 50.25; // turns the slider position (in [0,100]) into an increase/decrease ratio (in [-1.5, 0.5])
        // we avoid purposely -1.0 when dividing by 50 + epsilon -- for zero intensity cannot scale to a positive value!
        gz3d.scene.emitter.emit('lightChanged', ratio);
      };

      $scope.focus = function(id) {
        // timeout makes sure that it is invoked after any other event has been triggered.
        // e.g. click events that need to run before the focus or
        // inputs elements that are in a disabled state but are enabled when those events
        // are triggered.
        $timeout(function() {
          var element = $window.document.getElementById(id);
          if (element) {
            element.focus();
          }
        });
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

      // JointPlot
      $scope.showJointPlot = false;
      $scope.toggleJointPlot = function() {
        $scope.showJointPlot = !$scope.showJointPlot;
      };

      // robot view
      $scope.toggleRobotView = function() {
        gz3d.scene.views.forEach(function(view) {
          if (angular.isDefined(view.type) && view.type === 'camera' /* view will be named the same as the corresponding camera sensor from the gazebo .sdf */) {
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

        // Stop listening for status messages
        stateService.stopListeningForStatusInformation();

        // unregister the message callback
        stateService.removeMessageCallback(messageCallback);

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
    }])
    ;
}());
