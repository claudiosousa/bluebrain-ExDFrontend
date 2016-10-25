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
      LIGHT_SLIDER: 5,
      CAMERA_TRANSLATION: 6,
      CAMERA_ROTATION: 7,
      SPIKETRAIN: 8,
      OWNER_DISPLAY: 9,
      EXIT_BUTTON: 10,
      ROBOT_VIEW: 11,
      CODE_EDITOR: 12,
      JOINT_PLOT: 13,
      ENVIRONMENT_SETTINGS: 14,
      BRAIN_VISUALIZER: 15,
      USER_NAVIGATION: 16,
      LOG_CONSOLE: 17
    })
    .constant('INITIAL_LIGHT_DIFFUSE', 1)
    .constant('MINIMAL_LIGHT_DEFUSE', 0.2);

  angular.module('exdFrontendApp')
    .controller('Gz3dViewCtrl',
    ['$rootScope', '$scope', '$stateParams', '$timeout',
      '$location', '$window', '$document', '$log', 'bbpConfig',
      'hbpIdentityUserDirectory',
      'simulationControl', 'colorableObjectService', 'experimentList',
      'timeDDHHMMSSFilter', 'splash',
      'assetLoadingSplash', 'STATE', 'nrpBackendVersions',
      'nrpFrontendVersion', 'UI',
      'gz3d', 'EDIT_MODE', 'stateService', 'contextMenuState', 'objectInspectorService',
      'simulationInfo', 'INITIAL_LIGHT_DIFFUSE', 'MINIMAL_LIGHT_DEFUSE', 'hbpDialogFactory',
      'backendInterfaceService', 'RESET_TYPE', 'nrpAnalytics', 'collabExperimentLockService',
      'userNavigationService', 'NAVIGATION_MODES', 'experimentsFactory', 'isNotARobotPredicate', 'collab3DSettingsService', '$q',
      'simulationConfigService', 'experimentProxyService',
      function ($rootScope, $scope, $stateParams, $timeout,
        $location, $window, $document, $log, bbpConfig,
        hbpIdentityUserDirectory,
        simulationControl, colorableObjectService, experimentList,
        timeDDHHMMSSFilter, splash,
        assetLoadingSplash, STATE, nrpBackendVersions,
        nrpFrontendVersion, UI,
        gz3d, EDIT_MODE, stateService, contextMenuState, objectInspectorService,
        simulationInfo, INITIAL_LIGHT_DIFFUSE, MINIMAL_LIGHT_DEFUSE, hbpDialogFactory,
        backendInterfaceService, RESET_TYPE, nrpAnalytics, collabExperimentLockService,
        userNavigationService, NAVIGATION_MODES, experimentsFactory, isNotARobotPredicate, collab3DSettingsService, $q,
        simulationConfigService, experimentProxyService) {

        $scope.simulationInfo = simulationInfo;

        stateService.Initialize();
        var serverConfig = simulationInfo.serverConfig;
        $scope.helpModeActivated = false;
        $scope.helpDescription = '';
        $scope.helpText = {};
        $scope.currentSelectedUIElement = UI.UNDEFINED;

        $scope.userEditingID = "";
        $scope.userEditing = "";
        $scope.timeEditStarted = "";

        if ($stateParams.ctx) {
          // only use locks if we are in a collab
          var lockService = collabExperimentLockService.createLockServiceForContext($stateParams.ctx);
          var cancelLockSubscription = lockService.onLockChanged(
            function (result) {
              if (result.locked && result.lockInfo.user.id === $scope.viewState.userID) {
                // don't lock edit button if the current user is the owner of the lock.
                setEditDisabled(false);
              }
              else if (!result.locked && $scope.userEditingID === $scope.viewState.userID) {
                if ($scope.showEditorPanel) {
                  // we are the current user editing, but our lock has been released...
                  // (this can happen if two users want to edit at the same time)
                  $window.alert("You no longer have the lock to edit anymore. Please try again.");
                  $scope.toggleEditors();
                }
              }
              else {
                if (result.locked) {
                  setLockDateAndUser(result.lockInfo);
                }
                setEditDisabled(result.locked);
              }
            }
          );
        }

        $scope.rosTopics = bbpConfig.get('ros-topics');
        $scope.rosbridgeWebsocketUrl = serverConfig.rosbridge.websocket;

        $scope.STATE = STATE;
        $scope.UI = UI;
        $scope.RESET_TYPE = RESET_TYPE;
        $scope.sceneLoading = true;

        //Collab info used by reset
        $scope.isCollabExperiment = simulationInfo.isCollabExperiment;

        function ViewState() {
          this.isInitialized = false;
          this.isJoiningStoppedSimulation = false;
          this.isOwner = false;
          var _userID, _ownerID;
          var viewState = this;
          this.hasEditRights = function () {
            return viewState.isOwner;
          };

          Object.defineProperty(this, 'userID',
            {
              get: function () {
                return _userID;
              },
              set: function (val) {
                _userID = val;
                this.isOwner = (_ownerID === _userID);
              },
              enumerable: true
            });
          Object.defineProperty(this, 'ownerID',
            {
              get: function () {
                return _ownerID;
              },
              set: function (val) {
                _ownerID = val;
                this.isOwner = (_ownerID === _userID);
              },
              enumerable: true
            });
        }

        $scope.viewState = new ViewState();
        $scope.gz3d = gz3d;
        $scope.stateService = stateService;
        $scope.EDIT_MODE = EDIT_MODE;
        $scope.contextMenuState = contextMenuState;
        $scope.objectInspectorService = objectInspectorService;

        $scope.lightDiffuse = INITIAL_LIGHT_DIFFUSE;

        simulationInfo.experimentID = 'experiment-not-found';
        if (!bbpConfig.get('localmode.forceuser', false)) {
          hbpIdentityUserDirectory.getCurrentUser().then(function (profile) {
            $scope.viewState.userID = profile.id;
          });
        } else {
          $scope.viewState.userID = bbpConfig.get('localmode.ownerID');
        }
        var setExperimentDetails = function(experimentID, experimentDetails){
          $scope.ExperimentDescription = experimentDetails.description;
          $scope.ExperimentName = experimentDetails.name;
          $scope.updateInitialCameraPose(experimentDetails.cameraPose);
          $scope.setAnimatedRobotModel(experimentDetails.visualModel, experimentDetails.visualModelParams);
          simulationInfo.experimentID = experimentID;
          sceneInitialized.promise.then(function(){
            $scope.initComposerSettings();
            $scope.initBrainvisualizerData();
          });
        };
        simulationControl(simulationInfo.serverBaseUrl).simulation({ sim_id: simulationInfo.simulationID }, function (data) {
          $scope.viewState.ownerID = data.owner;
          $scope.experimentConfiguration = data.experimentConfiguration;
          $scope.environmentConfiguration = data.environmentConfiguration;
          $scope.creationDate = data.creationDate;
          if ($scope.isCollabExperiment){
            experimentList(simulationInfo.serverBaseUrl).experiments({context_id: simulationInfo.contextID},
              function(data){
                var experimentID = Object.keys(data.data)[0];
                setExperimentDetails(experimentID, data.data[experimentID]);
              }
            );
          }
          else {
            experimentProxyService.getExperiments().then(function (data){
              angular.forEach(data, function (experimentTemplate, experimentID) {
                if (experimentTemplate.configuration.experimentConfiguration === $scope.experimentConfiguration) {
                  setExperimentDetails(experimentID, experimentTemplate.configuration);
                }
              });
            });
          }
          if (!bbpConfig.get('localmode.forceuser', false)) {
            experimentsFactory.getOwnerDisplayName(data.owner).then(function (owner) {
              $scope.owner = owner;
            });

          } else {
            $scope.owner = bbpConfig.get('localmode.ownerID');
            $scope.viewState.isOwner = true;
          }
        });

        $scope.versions = {};
        nrpFrontendVersion.get(function (data) {
          $scope.versions.hbp_nrp_esv = data.hbp_nrp_esv;
        });
        nrpBackendVersions(simulationInfo.serverBaseUrl).get(function (data) {
          $scope.versions = angular.extend($scope.versions, data);
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
              }
              else {
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
            $scope.viewState.isJoiningStoppedSimulation = true;
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
            gz3d.iface.addCanDeletePredicate($scope.viewState.hasEditRights);


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
          nrpAnalytics.durationEventTrack('Browser-initialization', {
            category: 'Simulation'
          });
          nrpAnalytics.tickDurationEvent('Simulate');

          // make light's helper geometry visible
          gz3d.scene.showLightHelpers = true;
          sceneInitialized.resolve();
          $scope.setLightHelperVisibility();
          userNavigationService.init();
          $scope.sceneLoading = false;
        };

        // Lights management
        $scope.modifyLight = function (direction) {
          $scope.lightDiffuse += MINIMAL_LIGHT_DEFUSE * direction;
          if ($scope.lightDiffuse < MINIMAL_LIGHT_DEFUSE) {
            $scope.lightDiffuse = MINIMAL_LIGHT_DEFUSE;
          }
          gz3d.scene.emitter.emit('lightChanged', $scope.lightDiffuse);
        };

        $scope.updateSimulation = function (newState) {
          stateService.setCurrentState(newState);
        };

        // play/pause/stop button handler
        $scope.simControlButtonHandler = function (newState) {
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

          $scope.notifyResetToWidgets(resetType);

          if (resetType >= 256) { // Frontend-bound reset
            if (resetType === RESET_TYPE.RESET_CAMERA_VIEW) {
              gz3d.scene.resetView();
            }
          }
          else { // Backend-bound reset

            if ($scope.isCollabExperiment && simulationInfo.contextID) { //reset from collab
              //open splash screen, blocking ui (i.e. no ok button) and no closing callback
              $scope.splashScreen = $scope.splashScreen || splash.open(false, undefined);

              var resetWhat = '', downloadWhat = '';

              (function (resetType) { //customize user message depending on the reset type
                if (resetType === RESET_TYPE.RESET_WORLD) {
                  resetWhat = 'Environment';
                  downloadWhat = 'World SDF ';
                }
                else if (resetType === RESET_TYPE.RESET_BRAIN) {
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
                  hbpDialogFactory.alert(
                    {
                      title: 'Error.',
                      template: 'Error while resetting from Collab storage.'
                    });
                  //close the splash
                  if (angular.isDefined($scope.splashScreen)) {
                    splash.close();
                    delete $scope.splashScreen;
                  }
                }
              );
            }
            else {
              //other kinds of reset
              backendInterfaceService.reset(
                $scope.request,
                function () { // Success callback
                  //do not close the splash if successful
                  //it will be closed by messageCallback

                  gz3d.scene.applyComposerSettings(true,true);
                },
                function () { // Failure callback
                  hbpDialogFactory.alert(
                    {
                      title: 'Error.',
                      template: 'Error while resetting.'
                    });
                  if (angular.isDefined($scope.splashScreen)) {
                    splash.close();
                    delete $scope.splashScreen;
                  }
                }
              );
            }
          }
        };

        $scope.resetGUI = function () {
          gz3d.scene.controls.onMouseDownManipulator('initPosition');
          gz3d.scene.controls.onMouseDownManipulator('initRotation');
          gz3d.scene.controls.update();
          gz3d.scene.controls.onMouseUpManipulator('initPosition');
          gz3d.scene.controls.onMouseUpManipulator('initRotation');
          $scope.lightDiffuse = INITIAL_LIGHT_DIFFUSE;
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

        $scope.setLightHelperVisibility = function () {
          gz3d.scene.scene.traverse(function (node) {
            if (node.name.indexOf('_lightHelper') > -1) {
              node.visible = gz3d.scene.showLightHelpers;
            }
          });
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
          items: [
            {
              html: '<materials-chooser on-select="setMaterialOnEntity(material)"/>',
              callback: function (event) {
                event.stopPropagation();
              },
              visible: false
            }
          ],

          hide: function () {
            this.visible = this.items[0].visible = false;
          },

          show: function (model) {
            var isInViewMode = (gz3d.scene.manipulationMode === EDIT_MODE.VIEW);

            var isColorableEntity = colorableObjectService.isColorableEntity(model);
            var show = isInViewMode && isColorableEntity;

            return (this.visible = this.items[0].visible = show);
          }
        };

        contextMenuState.pushItemGroup(colorableMenuItemGroup);

        //main context menu handler
        $scope.onContainerMouseDown = function (event) {
          if ($scope.viewState.isOwner) {
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
        var hasNavigationAlreadyBeenClicked = false;
        $scope.showKeyboardControlInfoDiv = false;

        // This should be integrated to the tutorial story when
        // it will be implemented !
        $scope.showKeyboardControlInfo = function () {
          if (!hasNavigationAlreadyBeenClicked) {
            hasNavigationAlreadyBeenClicked = true;
            $scope.showKeyboardControlInfoDiv = true;
            $timeout(function () {
              $scope.showKeyboardControlInfoDiv = false;
            }, 20000);
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
          if (pose !== null && angular.isDefined(gz3d.scene)) {
            gz3d.scene.setDefaultCameraPose.apply(gz3d.scene, pose);
          }

          userNavigationService.setDefaultPose.apply(userNavigationService, pose);
        };

        $scope.setAnimatedRobotModel = function (model, params) {
          if (model !== null && params !== null && angular.isDefined(gz3d.scene)) {
            params.unshift(model); // argument to apply must be a single list
            gz3d.scene.setAnimatedRobotModel.apply(gz3d.scene, params);
          }
        };

        // Spiketrain
        $scope.showSpikeTrain = false;
        $scope.toggleSpikeTrain = function () {
          $scope.showSpikeTrain = !$scope.showSpikeTrain;
          nrpAnalytics.eventTrack('Toggle-spike-train', {
            category: 'Simulation-GUI',
            value: $scope.showSpikeTrain
          });
        };

        // JointPlot
        $scope.showJointPlot = false;
        $scope.toggleJointPlot = function () {
          $scope.showJointPlot = !$scope.showJointPlot;
          nrpAnalytics.eventTrack('Toggle-joint-plot', {
            category: 'Simulation-GUI',
            value: $scope.showJointPlot
          });
        };

        // robot view
        $scope.toggleRobotView = function () {
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
          .finally(function ()
          {
            $scope.loadingEnvironmentSettingsPanel = false;
          });
        };

        // navigation mode
        $scope.NAVIGATION_MODES = NAVIGATION_MODES;
        $scope.showNavigationModeMenu = false;

        $scope.toggleNavigationModeMenu = function () {
          $scope.showNavigationModeMenu = !$scope.showNavigationModeMenu;
        };

        $scope.setNavigationMode = function (mode) {
          switch (mode) {
            case NAVIGATION_MODES.FREE_CAMERA:
              userNavigationService.setModeFreeCamera();
              break;

            case NAVIGATION_MODES.GHOST:
              userNavigationService.setModeGhost();
              break;

            case NAVIGATION_MODES.HUMAN_BODY:
              userNavigationService.setModeHumanBody();
              break;
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
        $scope.$on("$destroy", function () {
          // unbind resetListener callback
          $scope.resetListenerUnbindHandler();

          nrpAnalytics.durationEventTrack('Simulate', {
            category: 'Simulation'
          });

          userNavigationService.deinit();

          if ($stateParams.ctx) {
            cancelLockSubscription();
            removeEditLock();
          }
          // Close the splash screens
          if (angular.isDefined($scope.splashScreen)) {
            if (angular.isDefined(splash)) {
              splash.close();
            }
            delete $scope.splashScreen;
            $scope.splashScreen = null;  // do not reopen splashscreen if further messages happen
          }
          if (angular.isDefined($scope.assetLoadingSplashScreen)) {
            if (angular.isDefined(assetLoadingSplash)) {
              assetLoadingSplash.close();
            }
            delete $scope.assetLoadingSplashScreen;
          }

          closeSimulationConnections();
          gz3d.deInitialize();
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
          }
          else {
            $scope.helpDescription = $scope.helpText[uiElement];
            $scope.currentSelectedUIElement = uiElement;
            nrpAnalytics.eventTrack('Help', {
              category: 'Simulation',
              value: uiElement
            });
          }
        };

        // set edit mode
        function setEditDisabled(state) {
          $scope.editIsDisabled = state;
        }

        function removeEditLock() {
          lockService.releaseLock()
            .catch(function () {
              $window.alert("I could not release the edit lock. Please remove it manually from the Storage area.");
            });
        }

        function setLockDateAndUser(lockInfo) {
          $scope.userEditing = lockInfo.user.displayName;
          $scope.userEditingID = lockInfo.user.id;
          $scope.timeEditStarted = moment(new Date(lockInfo.date)).fromNow();
        }

        $scope.showEditorPanel = false;
        $scope.toggleEditors = function () {
          if (!$stateParams.ctx) {
            showEditPanel();
          }
          else {
            // only use locks if we are in a collab i.e. ctx is set
            if (!$scope.showEditorPanel) {
              $scope.loadingEditPanel = true;
              // try and add a lock for editing
              lockService.tryAddLock()
                .then(function (result) {
                  if (!result.success && result.lock && result.lock.lockInfo.user.id !== $scope.viewState.userID) {

                    setLockDateAndUser(result.lock.lockInfo);
                    $window.alert("Sorry you cannot edit at this time. Only one user can edit at a time and " + $scope.userEditing + " started editing " + $scope.timeEditStarted + ". Please try again later.");
                    setEditDisabled(true);
                  }
                  else {
                    $scope.userEditingID = $scope.viewState.userID;
                    showEditPanel();
                  }
                })
                .catch(function () {
                  $window.alert("There was an error when opening the edit panel, please try again later.");
                })
                .finally(function () {
                  $scope.loadingEditPanel = false;
                });
            }
            else {
              showEditPanel();
              removeEditLock();
            }
          }
        };

        function showEditPanel() {
          $scope.showEditorPanel = !$scope.showEditorPanel;
          nrpAnalytics.eventTrack('Toggle-editor-panel', {
            category: 'Simulation-GUI',
            value: $scope.showEditorPanel
          });
        }

        $scope.editClick = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.CODE_EDITOR);
          }
          else if ($scope.editIsDisabled || $scope.loadingEditPanel) {
            return;
          }
          else {
            return $scope.toggleEditors();
          }
        };

        $scope.exit = function () {
          $scope.splashScreen = null;  // do not reopen splashscreen if further messages happen
          $location.path('esv-web');
          $timeout(function ()
          {
            $window.location.reload();
          });
        };

        // Brain visualizer

        $scope.brainvisualizerIsDisabled = true;

      // Init brainvisualizer data

        $scope.initBrainvisualizerData = function ()
        {
          var brainVisualizationDataExists = simulationConfigService.doesConfigFileExist('brainvisualizer');
          brainVisualizationDataExists.then(function (exists)
          {
            if (exists)
            {
              $scope.brainvisualizerIsDisabled = false;
              $scope.loadingBrainvisualizerPanel = true;

              simulationConfigService.loadConfigFile('brainvisualizer')
                .then(function (file)
                {
                  $scope.loadingBrainvisualizerPanel = false;

                  $scope.brainVisualizerData = JSON.parse(file);
                  $scope.brainvisualizerIsDisabled = ($scope.brainVisualizerData === undefined);
                })
                .catch(function ()
                {
                  $scope.loadingBrainvisualizerPanel = false;
                  $scope.brainvisualizerIsDisabled = true;
                });
            }
          });
        };

        $scope.showBrainvisualizerPanel = false;
        $scope.toggleBrainvisualizer = function () {
          $scope.showBrainvisualizerPanel = !$scope.showBrainvisualizerPanel;
          nrpAnalytics.eventTrack('Toggle-brainvisualizer-panel', {
            category: 'Simulation-GUI',
            value: $scope.showBrainvisualizerPanel
          });
        };

        $scope.brainvisualizerClick = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.BRAIN_VISUALIZER);
          }
          else if ($scope.brainvisualizerIsDisabled || $scope.loadingBrainvisualizerPanel) {
            return;
          }
          else {
            return $scope.toggleBrainvisualizer();
          }
        };

        // log console
        $scope.showLogConsole = false;
        $scope.toggleLogConsole = function () {
          $scope.showLogConsole = !$scope.showLogConsole;
          nrpAnalytics.eventTrack('Toggle-log-console', {
            category: 'Simulation-GUI',
            value: $scope.showLogConsole
          });
        };


        $scope.logConsoleClick = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.LOG_CONSOLE);
          }
          else {
            return $scope.toggleLogConsole();
          }
        };


        // Environment settings panel

        $scope.showEnvironmentSettingsPanel = false;
        $scope.toggleEnvironmentSettings = function () {
          $scope.showEnvironmentSettingsPanel = !$scope.showEnvironmentSettingsPanel;
          nrpAnalytics.eventTrack('Toggle-environment-settings-panel', {
            category: 'Simulation-GUI',
            value: $scope.showEnvironmentSettingsPanel
          });
        };

        $scope.environmentSettingsClick = function () {
          if ($scope.helpModeActivated) {
            return $scope.help($scope.UI.ENVIRONMENT_SETTINGS);
          }
          else if ($scope.environmentSettingsIsDisabled || $scope.loadingEnvironmentSettingsPanel) {
            return;
          }
          else {
            return $scope.toggleEnvironmentSettings();
          }
        };

      }]);
} ());
