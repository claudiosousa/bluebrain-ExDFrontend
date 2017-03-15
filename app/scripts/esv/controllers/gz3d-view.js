/* global console: false */
/* global THREE: false */

(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name exdFrontendApp.controller:Gz3dViewCtrl
   * @description
   * # Gz3dViewCtrl
   * Controller of the exdFrontendApp
   */

  angular.module('exdFrontendApp.Constants')
  // constants for the server side status
    .constant('STATE', {
      CREATED: 'created',
      STARTED: 'started',
      PAUSED: 'paused',
      INITIALIZED: 'initialized',
      HALTED: 'halted',
      FAILED: 'failed',
      STOPPED: 'stopped'
    })
    .constant('UI', {
      UNDEFINED: -1,
      PLAY_BUTTON: 0,
      PAUSE_BUTTON: 1,
      STOP_BUTTON: 2,
      RESET_BUTTON: 3,
      TIME_DISPLAY: 4,
      INCREASE_LIGHT: 5,
      DECREASE_LIGHT: 6,
      CAMERA_TRANSLATION: 7,
      CAMERA_ROTATION: 8,
      SPIKE_TRAIN: 9,
      OWNER_DISPLAY: 10,
      EXIT_BUTTON: 11,
      ROBOT_VIEW: 12,
      CODE_EDITOR: 13,
      JOINT_PLOT: 14,
      ENVIRONMENT_SETTINGS: 15,
      BRAIN_VISUALIZER: 16,
      USER_NAVIGATION: 17,
      LOG_CONSOLE: 18
    });

  angular.module('exdFrontendApp')
    .controller('Gz3dViewCtrl',
    ['$rootScope', '$scope', '$timeout',
      '$location', '$window', '$document', '$log', 'bbpConfig',
      'hbpIdentityUserDirectory',
      'simulationControl', 'colorableObjectService',
      'timeDDHHMMSSFilter', 'splash',
      'assetLoadingSplash', 'STATE', 'nrpBackendVersions',
      'nrpFrontendVersion', 'UI',
      'gz3d', 'EDIT_MODE', 'stateService', 'contextMenuState', 'objectInspectorService',
      'simulationInfo','hbpDialogFactory',
      'backendInterfaceService', 'RESET_TYPE', 'nrpAnalytics', 'collabExperimentLockService',
      'userNavigationService', 'NAVIGATION_MODES', 'experimentsFactory', 'isNotARobotPredicate', 'collab3DSettingsService', '$q',
      'simulationConfigService','environmentService', 'userContextService', 'editorsPanelService',
      function ($rootScope, $scope, $timeout,
        $location, $window, $document, $log, bbpConfig,
        hbpIdentityUserDirectory,
        simulationControl, colorableObjectService,
        timeDDHHMMSSFilter, splash,
        assetLoadingSplash, STATE, nrpBackendVersions,
        nrpFrontendVersion, UI,
        gz3d, EDIT_MODE, stateService, contextMenuState, objectInspectorService,
        simulationInfo, hbpDialogFactory,
        backendInterfaceService, RESET_TYPE, nrpAnalytics, collabExperimentLockService,
        userNavigationService, NAVIGATION_MODES, experimentsFactory, isNotARobotPredicate, collab3DSettingsService, $q,
        simulationConfigService, environmentService, userContextService, editorsPanelService) {

        $scope.simulationInfo = simulationInfo;

        stateService.Initialize();
        $scope.helpModeActivated = false;
        $scope.helpDescription = '';
        $scope.helpText = {};
        $scope.currentSelectedUIElement = UI.UNDEFINED;

        $scope.rosTopics = bbpConfig.get('ros-topics');
        $scope.rosbridgeWebsocketUrl = simulationInfo.serverConfig.rosbridge.websocket;

        $scope.STATE = STATE;
        $scope.UI = UI;
        $scope.RESET_TYPE = RESET_TYPE;
        $scope.sceneLoading = true;

        $scope.gz3d = gz3d;
        $scope.stateService = stateService;
        $scope.EDIT_MODE = EDIT_MODE;
        $scope.contextMenuState = contextMenuState;
        $scope.objectInspectorService = objectInspectorService;
        $scope.userContextService = userContextService;
        $scope.editorsPanelService = editorsPanelService;

        var setExperimentDetails = function(){
          $scope.ExperimentDescription = simulationInfo.experimentDetails.description;
          $scope.ExperimentName = simulationInfo.experimentDetails.name;
          var sceneWatch = $scope.$watch(
            function() {
              return typeof gz3d.scene !== 'undefined' && typeof gz3d.scene.scene !== 'undefined';
            }, function(sceneReady) {
              if (sceneReady) {
                $scope.updateInitialCameraPose(simulationInfo.experimentDetails.cameraPose);
                sceneWatch(); // deregister watch
              }
            }
          );
          sceneInitialized.promise.then(function(){
            $scope.initComposerSettings();
          });
        };

        simulationControl(simulationInfo.serverBaseUrl).simulation({ sim_id: simulationInfo.simulationID }, function (data) {
          userContextService.ownerID = data.owner;
          $scope.experimentConfiguration = data.experimentConfiguration;
          $scope.environmentConfiguration = data.environmentConfiguration;
          $scope.creationDate = data.creationDate;
          setExperimentDetails();

          if (!bbpConfig.get('localmode.forceuser', false)) {
            experimentsFactory.getOwnerDisplayName(data.owner).then(function (owner) {
              $scope.owner = owner;
            });
          } else {
            $scope.owner = bbpConfig.get('localmode.ownerID');
            userContextService.ownerID = $scope.owner;
          }
        });

        $scope.versionString = "";
        nrpFrontendVersion.get(function (data) {
          $scope.versionString += data.toString;
        });
        nrpBackendVersions(simulationInfo.serverBaseUrl).get(function (data) {
          $scope.versionString += data.toString;
        });

        // prevent this analytics event from sent multiple time
        var analyticsEventTimeout = _.once(function () {
          nrpAnalytics.eventTrack('Timeout', {
            category: 'Simulation'
          });
        });

        /* status messages are listened to here. A splash screen is opened to display progress messages. */
        /* This is the case when closing or resetting a simulation/environment for example.
        /* Loading is taken take of by a progressbar somewhere else. */
        /* Timeout messages are displayed in the toolbar. */
        var messageCallback = function (message) {
          /* Progress messages (except start state progress messages which are handled by another progress bar) */
          if (angular.isDefined(message.progress)) {

            var stateStopFailed = stateService.currentState === STATE.STOPPED || stateService.currentState === STATE.FAILED;

            /* splashScreen == null means it has been already closed and should not be reopened */
            if ($scope.splashScreen !== null &&
                !$scope.sceneLoading &&
               (angular.isDefined(message.state) ||
               (stateStopFailed || (angular.isDefined(message.progress.subtask) && message.progress.subtask.length>0 ))))
            {
              $scope.splashScreen = $scope.splashScreen || splash.open(
                !message.progress.block_ui,
                (stateStopFailed ? $scope.exit : undefined));
            }
            if (angular.isDefined(message.progress.done) && message.progress.done) {
              splash.spin = false;
              splash.setMessage({ headline: 'Finished' });
              /* if splash is a blocking modal (no button), then close it*/
              /* (else it is closed by the user on button click) */
              if (!splash.showButton) {
                // blocking modal -> we using the splash for some in-simulation action (e.g. resetting),
                // so we don't have to close the websocket, just the splash screen.
                splash.close();
                $scope.splashScreen = undefined;
              } else {
                // the modal is non blocking (i.e. w/ button) ->
                // we are closing the simulation thus we have to
                // cleanly close ros websocket and stop window
                $scope.onSimulationDone();
              }
            } else {
              splash.setMessage({ headline: message.progress.task, subHeadline: message.progress.subtask });
            }
          }
          /* Time messages */
          if (angular.isDefined(message.timeout)) {
            if (parseInt(message.timeout, 10) < 1.0) {
              analyticsEventTimeout();
            }
            $scope.simTimeoutText = message.timeout;
          }
          if (angular.isDefined(message.simulationTime)) {
            $scope.simulationTimeText = message.simulationTime;
          }
          if (angular.isDefined(message.realTime)) {
            $scope.realTimeText = message.realTime;
          }
        };

        // Query the state of the simulation
        var sceneInitialized = $q.defer();
        stateService.getCurrentState().then(function () {
          if (stateService.currentState === STATE.STOPPED) {
            // The Simulation is already Stopped, so do nothing more but show the alert popup
            userContextService.isJoiningStoppedSimulation = true;
            nrpAnalytics.eventTrack('Join-stopped', {
              category: 'Simulation'
            });
          } else {
            // Initialize GZ3D and so on...
            nrpAnalytics.durationEventTrack('Server-initialization', {
              category: 'Experiment'
            });
            nrpAnalytics.tickDurationEvent('Browser-initialization');

            gz3d.Initialize();
            gz3d.iface.addCanDeletePredicate(isNotARobotPredicate);
            gz3d.iface.addCanDeletePredicate(userContextService.hasEditRights);

            // Handle touch clicks to toggle the context menu
            // This is used to save the position of a touch start event used for content menu toggling
            var touchStart = { clientX: 0, clientY: 0 };
            var touchMove = { clientX: 0, clientY: 0 };

            gz3d.scene.container.addEventListener('touchstart', function (event) {
              touchStart.clientX = event.touches[0].clientX;
              touchStart.clientY = event.touches[0].clientY;
              touchMove.clientX = touchStart.clientX;
              touchMove.clientY = touchStart.clientY;
            }, false);

            gz3d.scene.container.addEventListener('touchmove', function (event) {
              touchMove.clientX = event.touches[0].clientX;
              touchMove.clientY = event.touches[0].clientY;
            }, false);

            gz3d.scene.container.addEventListener('touchend', function (event) {
              var deltaX = touchMove.clientX - touchStart.clientX;
              var deltaY = touchMove.clientY - touchStart.clientY;
              var touchDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
              // if the touch distance was small
              // Also test on clientX/clientY greater 0 (Because 'touchend' can sometimes be called without 'touchstart')
              // ...and so clientX and clientY are in their initial state '0'
              if ((touchDistance <= 20) && (touchStart.clientX > 0) && (touchStart.clientY > 0)) {
                event.clientX = touchMove.clientX;
                event.clientY = touchMove.clientY;
                contextMenuState.toggleContextMenu(true, event);
              }
              touchStart = { clientX: 0, clientY: 0 };
              touchMove = { clientX: 0, clientY: 0 };
            }, false);

            // Register for the status updates as well as the timing stats
            // Note that we have two different connections here, hence we only put one as a callback for
            // $rootScope.iface and the other one not!
            /* Listen for status informations */
            stateService.startListeningForStatusInformation();
            stateService.addMessageCallback(messageCallback);
            stateService.addStateCallback(stateCallback);

            // Show the splash screen for the progress of the asset loading
            $scope.assetLoadingSplashScreen = $scope.assetLoadingSplashScreen || assetLoadingSplash.open($scope.onSceneLoaded);
            gz3d.iface.setAssetProgressCallback(function (data) {
              assetLoadingSplash.setProgress(data);
            });
          }
        });

        $scope.onSceneLoaded = function () {
          delete $scope.assetLoadingSplashScreen;

          nrpAnalytics.durationEventTrack('Browser-initialization', {
            category: 'Simulation'
          });
          nrpAnalytics.tickDurationEvent('Simulate');

          // make light's helper geometry visible
          gz3d.scene.showLightHelpers = true;
          sceneInitialized.resolve();
          gz3d.setLightHelperVisibility();
          userNavigationService.init();
          $scope.sceneLoading = false;
        };

        // Lights management
        $scope.modifyLightClickHandler = function (direction, button) {
          if ($scope.helpModeActivated) {
            return $scope.help(button);
          }

          if ((direction < 0 && gz3d.isGlobalLightMinReached()) || (direction > 0 && gz3d.isGlobalLightMaxReached()))
          {
            return;
          }

          gz3d.scene.emitter.emit('lightChanged', direction * 0.1);
        };


        $scope.updateSimulation = function (newState) {
          stateService.setCurrentState(newState);
        };

        // play/pause/stop button handler
        $scope.simControlButtonHandler = function (newState, button) {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI[button]);
          }
          $scope.updateSimulation(newState);
          $scope.setEditMode(EDIT_MODE.VIEW);
          if (objectInspectorService !== null) {
            objectInspectorService.removeEventListeners();
          }
        };

        //When resetting do something
        $scope.resetListenerUnbindHandler = $scope.$on('RESET', function (event, resetType) {
          if(resetType === RESET_TYPE.RESET_FULL || resetType === RESET_TYPE.RESET_WORLD) {
            $scope.resetGUI();
          }
        });

        $scope.resetButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.RESET_BUTTON);
          }
          $scope.request = {
            resetType: RESET_TYPE.NO_RESET
          };
          hbpDialogFactory.confirm({
            'title': 'Reset Menu',
            'templateUrl': 'views/esv/reset-checklist-template.html',
            'scope': $scope
          }).then(function () {
            stateService.ensureStateBeforeExecuting(
              STATE.PAUSED,
              $scope.__resetButtonClickHandler
            );
          });
        };

        $scope.__resetButtonClickHandler = function () {
          var resetType = $scope.request.resetType;
          if (resetType === RESET_TYPE.NO_RESET) { return; }

          stateService.setCurrentState(STATE.PAUSED);

          if ($scope.showEditorPanel)
          {
            $scope.toggleEditors();
          }

          $timeout(function(){

          $scope.notifyResetToWidgets(resetType);

          if (resetType >= 256) { // Frontend-bound reset
            if (resetType === RESET_TYPE.RESET_CAMERA_VIEW) {
              gz3d.scene.resetView();
            }
          } else { // Backend-bound reset
            if (environmentService.isPrivateExperiment()) { //reset from collab
              //open splash screen, blocking ui (i.e. no ok button) and no closing callback
              $scope.splashScreen = $scope.splashScreen || splash.open(false, undefined);

              var resetWhat = '', downloadWhat = '';

              (function (resetType) { //customize user message depending on the reset type
                if (resetType === RESET_TYPE.RESET_WORLD) {
                  resetWhat = 'Environment';
                  downloadWhat = 'World SDF ';
                } else if (resetType === RESET_TYPE.RESET_BRAIN) {
                  resetWhat = 'Brain';
                  downloadWhat = 'brain configuration file ';
                }
              })(resetType);

              var messageHeadline = 'Resetting ' + resetWhat;
              var messageSubHeadline = 'Downloading ' + downloadWhat + 'from the Collab';

              _.defer(function () {
                splash.spin = true;
                splash.setMessage({ headline: messageHeadline, subHeadline: messageSubHeadline });
              });

              backendInterfaceService.resetCollab(
                simulationInfo.contextID,
                $scope.request,
                function () { // Success callback
                  //close the splash
                  if (angular.isDefined($scope.splashScreen)) {
                    splash.close();
                    delete $scope.splashScreen;
                  }
                },
                function () { // Failure callback
                  //close the splash
                  if (angular.isDefined($scope.splashScreen)) {
                    splash.close();
                    delete $scope.splashScreen;
                  }
                }
              );
            } else {
              //other kinds of reset
              backendInterfaceService.reset(
                $scope.request,
                function () { // Success callback
                  //do not close the splash if successful
                  //it will be closed by messageCallback

                  gz3d.scene.applyComposerSettings(true,false);

                  if (resetType === RESET_TYPE.RESET_BRAIN)
                  {
                    $scope.$broadcast('UPDATE_PANEL_UI');
                  }
                },
                function () { // Failure callback
                  if (angular.isDefined($scope.splashScreen)) {
                    splash.close();
                    delete $scope.splashScreen;
                  }
                }
              );
            }
          }
          }, 100);
        };

        $scope.timeDisplayClickHandler = function () {
          if ($scope.helpModeActivated) {
            $scope.help($scope.UI.TIME_DISPLAY);
          }
        };

        $scope.resetGUI = function () {
          gz3d.scene.controls.onMouseDownManipulator('initPosition');
          gz3d.scene.controls.onMouseDownManipulator('initRotation');
          gz3d.scene.controls.update();
          gz3d.scene.controls.onMouseUpManipulator('initPosition');
          gz3d.scene.controls.onMouseUpManipulator('initRotation');
          gz3d.scene.resetView(); //update the default camera position, if defined
          if (objectInspectorService !== null) {
            gz3d.scene.selectEntity(null);
            objectInspectorService.toggleView(false);
          }
        };

        $scope.notifyResetToWidgets = function (resetType) {
          $scope.$broadcast('RESET', resetType);
        };

        $scope.setEditMode = function (newMode) {
          //currentMode !== newMode
          if (gz3d.scene.manipulationMode !== newMode) {
            gz3d.scene.setManipulationMode(newMode);
          }
        };

        // We restrict material changes to simple objects and screen glasses found in screen models of the 3D scene,
        // i.e., only visuals bearing the name screen_glass or COLORABLE_VISUAL can be modified by this function.
        $scope.setMaterialOnEntity = function (material) {
          var selectedEntity = gz3d.scene.selectedEntity;
          if (!selectedEntity) {
            $log.error('Could not change color since there was no object selected');
            return;
          }
          colorableObjectService.setEntityMaterial(simulationInfo, selectedEntity, material);
          // Hide context menu after a color was assigned
          contextMenuState.toggleContextMenu(false);
        };

        // colorable object context Menu setup
        var colorableMenuItemGroup = {
          id: 'changeColor',
          visible: false,
          items: [{
            html: '<materials-chooser on-select="setMaterialOnEntity(material)"/>',
            callback: function (event) {
              event.stopPropagation();
            },
            visible: false
          }],
          hide: function () {
            this.visible = this.items[0].visible = false;
          },
          show: function (model) {
            var isColorableEntity = colorableObjectService.isColorableEntity(model);
            var show = isColorableEntity;
            return (this.visible = this.items[0].visible = show);
          }
        };

        contextMenuState.pushItemGroup(colorableMenuItemGroup);

        //main context menu handler
        $scope.onContainerMouseDown = function (event) {
          if (userContextService.isOwner()) {
            switch (event.button) {
              case 2:
                //right click -> show menu
                contextMenuState.toggleContextMenu(true, event);
                break;

              //other buttons -> hide menu
              case 0:
              case 1:
                contextMenuState.toggleContextMenu(false);
                break;
            }
          }
        };

        $scope.focus = function (id) {
          // timeout makes sure that it is invoked after any other event has been triggered.
          // e.g. click events that need to run before the focus or
          // inputs elements that are in a disabled state but are enabled when those events
          // are triggered.
          $timeout(function () {
            var element = $window.document.getElementById(id);
            if (element) {
              element.focus();
            }
          });
        };

        // Camera manipulation

        // This should be integrated to the tutorial story when
        // it will be implemented !
        $scope.cameraTranslationButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.CAMERA_TRANSLATION);
          }
        };

        $scope.requestMove = function (event, action) {
          if (!$scope.helpModeActivated && event.which === 1) { // camera control uses left button only
            gz3d.scene.controls.onMouseDownManipulator(action);
          }
        };

        $scope.releaseMove = function (event, action) {
          if (!$scope.helpModeActivated && event.which === 1) { // camera control uses left button only
            gz3d.scene.controls.onMouseUpManipulator(action);
          }
        };

        $scope.updateInitialCameraPose = function (pose) {
          if (pose !== null) {
            gz3d.scene.setDefaultCameraPose.apply(gz3d.scene, pose);
          }
          userNavigationService.setDefaultPose.apply(userNavigationService, pose);
        };

        $scope.cameraRotationButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.CAMERA_ROTATION);
          }
        };

        // Spiketrain
        $scope.showSpikeTrain = false;
        $scope.spikeTrainButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.SPIKE_TRAIN);
          }
          $scope.showSpikeTrain = !$scope.showSpikeTrain;
          nrpAnalytics.eventTrack('Toggle-spike-train', {
            category: 'Simulation-GUI',
            value: $scope.showSpikeTrain
          });
        };

        // JointPlot
        $scope.showJointPlot = false;
        $scope.jointPlotButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.JOINT_PLOT);
          }
          $scope.showJointPlot = !$scope.showJointPlot;
          nrpAnalytics.eventTrack('Toggle-joint-plot', {
            category: 'Simulation-GUI',
            value: $scope.showJointPlot
          });
        };

        // robot view
        sceneInitialized.promise.then(function(){
            $scope.hasCameraView = gz3d.scene && gz3d.scene.viewManager && gz3d.scene.viewManager.views.some(function(v){return v.type && v.type === 'camera';});
        });

        $scope.robotViewButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.ROBOT_VIEW);
          }
          if (!$scope.hasCameraView)
            return;
          $scope.showRobotView = !$scope.showRobotView;
          nrpAnalytics.eventTrack('Toggle-robot-view', {
            category: 'Simulation-GUI',
            value: $scope.showRobotView
          });
          gz3d.scene.viewManager.views.forEach(function (view) {
            if (angular.isDefined(view.type) && view.type === 'camera' /* view will be named the same as the corresponding camera sensor from the gazebo .sdf */) {
              view.active = !view.active;
              view.container.style.visibility = view.active ? 'visible' : 'hidden';
            }
          });
        };

        // Init composer settings
        $scope.initComposerSettings = function ()
        {
          $scope.loadingEnvironmentSettingsPanel = true;
          collab3DSettingsService.loadSettings()
          .finally(function () {
            $scope.loadingEnvironmentSettingsPanel = false;
          });
        };

        // navigation mode
        $scope.NAVIGATION_MODES = NAVIGATION_MODES;
        $scope.showNavigationModeMenu = false;

        $scope.navigationModeMenuClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.USER_NAVIGATION);
          }
          $scope.showNavigationModeMenu = !$scope.showNavigationModeMenu;
        };

        $scope.setNavigationMode = function (mode) {
          switch (mode) {
            case NAVIGATION_MODES.FREE_CAMERA:
              document.removeEventListener('keydown', $scope.displayHumanNavInfo);
              userNavigationService.setModeFreeCamera();
              break;

            case NAVIGATION_MODES.GHOST:
              document.removeEventListener('keydown', $scope.displayHumanNavInfo);
              userNavigationService.setModeGhost();
              break;

            case NAVIGATION_MODES.HUMAN_BODY:
              if (stateService.currentState !== STATE.PAUSED) {
                document.addEventListener('keydown', $scope.displayHumanNavInfo);
                userNavigationService.setModeHumanBody();
              }
              break;
          }
        };

        $scope.showHumanNavInfoDiv = false;
        $scope.displayHumanNavInfo = function (event) {
          if (stateService.currentState === STATE.PAUSED) {
            $scope.showHumanNavInfoDiv = true;
            $timeout(function () {
              $scope.showHumanNavInfoDiv = false;
            }, 5000);
          }
        };

        $scope.isActiveNavigationMode = function (mode) {
          return (userNavigationService.navigationMode === mode);
        };

        // help mode
        $scope.toggleHelpMode = function () {
          $scope.helpModeActivated = !$scope.helpModeActivated;
          nrpAnalytics.eventTrack('Toggle-help-mode', {
            category: 'Simulation-GUI',
            value: $scope.helpModeActivated
          });
          $scope.helpDescription = "";
          $scope.currentSelectedUIElement = UI.UNDEFINED;
        };

        // clean up on leaving
        $scope.$on('$destroy', function () {
          /* NOT CALLED AUTOMATICALLY ON EXITING AN EXPERIMENT */
          /* possible cause of memory leaks */

          $scope.cleanUp();
        });

        function closeSimulationConnections() {
          // Stop listening for status messages
          if (gz3d.iface && gz3d.iface.webSocket) {
            gz3d.iface.webSocket.close();
          }
          // Stop listening for status messages
          stateService.stopListeningForStatusInformation();
        }

        function stateCallback(newState) {
          if (newState === STATE.STOPPED) {
            if (gz3d.iface && gz3d.iface.webSocket) {
              gz3d.iface.webSocket.disableRebirth();
            }
          }
        }

        $scope.onSimulationDone = function () {
          closeSimulationConnections();
          // unregister the message callback
          stateService.removeMessageCallback(messageCallback);
          stateService.removeStateCallback(stateCallback);
        };

        $scope.help = function (uiElement) {
          if ($scope.currentSelectedUIElement === uiElement) {
            $scope.helpDescription = "";
            $scope.currentSelectedUIElement = UI.UNDEFINED;
          } else {
            $scope.helpDescription = $scope.helpText[uiElement];
            $scope.currentSelectedUIElement = uiElement;
            nrpAnalytics.eventTrack('Help', {
              category: 'Simulation',
              value: uiElement
            });
          }
        };

        $scope.codeEditorButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.CODE_EDITOR);
          } else if (userContextService.editIsDisabled || $scope.loadingEditPanel) {
            return;
          } else {
            return editorsPanelService.toggleEditors();
          }
        };

        $scope.exit = function () {
          exitSimulation();
          return $q.when();
        };

        function exitSimulation() {
          $scope.cleanUp();

          $scope.splashScreen = null;  // do not reopen splashscreen if further messages happen
          if (environmentService.isPrivateExperiment())
            $location.path('esv-private');
          else
            $location.path('esv-web');
          $timeout(function ()
          {
            $window.location.reload();
          });
        }

        $scope.cleanUp = function() {
          userNavigationService.deinit();

          document.removeEventListener('keydown', $scope.displayHumanNavInfo);

          // unbind resetListener callback
          $scope.resetListenerUnbindHandler();
          nrpAnalytics.durationEventTrack('Simulate', {
            category: 'Simulation'
          });

          if (environmentService.isPrivateExperiment()) {
            editorsPanelService.deinit();
            userContextService.deinit();
          }

          // Close the splash screens
          if (angular.isDefined($scope.assetLoadingSplashScreen)) {
            if (angular.isDefined(assetLoadingSplash)) {
              assetLoadingSplash.close();
            }
            delete $scope.assetLoadingSplashScreen;
          }

          closeSimulationConnections();
          gz3d.deInitialize();

        };

        $scope.showBrainvisualizerPanel = false;
        $scope.toggleBrainvisualizer = function () {
          $scope.showBrainvisualizerPanel = !$scope.showBrainvisualizerPanel;
          nrpAnalytics.eventTrack('Toggle-brainvisualizer-panel', {
            category: 'Simulation-GUI',
            value: $scope.showBrainvisualizerPanel
          });
        };

        $scope.brainVisualizerButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.BRAIN_VISUALIZER);
          } else {
            return $scope.toggleBrainvisualizer();
          }
        };

        // log console
        $scope.showLogConsole = false;
        $scope.logConsoleButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.LOG_CONSOLE);
          }
          $scope.showLogConsole = !$scope.showLogConsole;
          if ($scope.showLogConsole)
            $scope.missedConsoleLogs = 0;
          nrpAnalytics.eventTrack('Toggle-log-console', {
            category: 'Simulation-GUI',
            value: $scope.showLogConsole
          });
        };

        $scope.missedConsoleLogs = 0;
        $scope.consoleLogReceived = function () {
          if (!$scope.showLogConsole)
            $scope.missedConsoleLogs++;
        };

        // Owner information
        $scope.ownerInformationClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.OWNER_DISPLAY);
          }
        };

        // Environment settings panel
        $scope.showEnvironmentSettingsPanel = false;

        $scope.environmentSettingsClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.ENVIRONMENT_SETTINGS);
          } else if ($scope.environmentSettingsIsDisabled || $scope.loadingEnvironmentSettingsPanel) {
            return;
          } else {
            $scope.showEnvironmentSettingsPanel = !$scope.showEnvironmentSettingsPanel;
            nrpAnalytics.eventTrack('Toggle-environment-settings-panel', {
              category: 'Simulation-GUI',
              value: $scope.showEnvironmentSettingsPanel
            });
          }
        };

        $scope.exitButtonClickHandler = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.EXIT_BUTTON);
          }
          $scope.exit();
        };

      }]);
} ());
