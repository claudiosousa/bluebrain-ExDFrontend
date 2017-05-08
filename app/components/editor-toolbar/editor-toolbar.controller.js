/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/
(function () {
  'use strict';

  angular.module('editorToolbarModule', ['helpTooltipModule'])
  .controller('editorToolbarCntrl',
  ['$rootScope', '$scope', '$timeout', '$location', '$q', '$window',
    'STATE', 'contextMenuState', 'userContextService', 'stateService', 'gz3d', 'editorsPanelService', 'userNavigationService',
    'objectInspectorService', 'nrpAnalytics', 'hbpDialogFactory', 'environmentService', 'backendInterfaceService', 'environmentRenderingService',
    'splash', 'simulationInfo', 'videoStreamService',
    'NAVIGATION_MODES', 'helpTooltipService', 'EDIT_MODE', 'RESET_TYPE',
    function ($rootScope, $scope, $timeout, $location, $q, $window,
              STATE, contextMenuState, userContextService, stateService, gz3d, editorsPanelService, userNavigationService,
              objectInspectorService, nrpAnalytics, hbpDialogFactory, environmentService, backendInterfaceService, environmentRenderingService,
              splash, simulationInfo, videoStreamService,
              NAVIGATION_MODES, helpTooltipService, EDIT_MODE, RESET_TYPE) {
      $scope.contextMenuState = contextMenuState;
      $scope.userContextService = userContextService;
      $scope.stateService = stateService;
      $scope.gz3d = gz3d;
      $scope.editorsPanelService = editorsPanelService;
      $scope.objectInspectorService = objectInspectorService;
      $scope.environmentService = environmentService;
      $scope.backendInterfaceService = backendInterfaceService;
      $scope.environmentRenderingService = environmentRenderingService;
      $scope.userNavigationService = userNavigationService;
      $scope.splash = splash;
      $scope.simulationInfo = simulationInfo;
      $scope.videoStreamService = videoStreamService;

      $scope.EDIT_MODE = EDIT_MODE;
      $scope.RESET_TYPE = RESET_TYPE;
      $scope.NAVIGATION_MODES = NAVIGATION_MODES;
      $scope.STATE = STATE;

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
          !environmentRenderingService.sceneLoading &&
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

      var onStateChanged = function(newState) {
        if (newState === STATE.STOPPED && gz3d.iface && gz3d.iface.webSocket) {
          gz3d.iface.webSocket.disableRebirth();
        }
      };

      // Query the state of the simulation
      stateService.getCurrentState().then(function () {
        if (stateService.currentState === STATE.STOPPED) {
          // The Simulation is already Stopped, so do nothing more but show the alert popup
          userContextService.isJoiningStoppedSimulation = true;
          nrpAnalytics.eventTrack('Join-stopped', {
            category: 'Simulation'
          });
        } else {
          nrpAnalytics.durationEventTrack('Server-initialization', {
            category: 'Experiment'
          });
          nrpAnalytics.tickDurationEvent('Browser-initialization');

          environmentRenderingService.init();
          // Register for the status updates as well as the timing stats
          // Note that we have two different connections here, hence we only put one as a callback for
          // $rootScope.iface and the other one not!
          /* Listen for status informations */
          stateService.startListeningForStatusInformation();
          stateService.addMessageCallback(messageCallback);
          stateService.addStateCallback(onStateChanged);
        }
      });

      // Lights management
      $scope.modifyLightClickHandler = function (direction, button) {
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
      $scope.simControlButtonHandler = function (newState) {
        $scope.updateSimulation(newState);
        $scope.setEditMode(EDIT_MODE.VIEW);
        if (objectInspectorService !== null) {
          objectInspectorService.removeEventListeners();
        }
      };

      $scope.setEditMode = function (newMode) {
        //currentMode !== newMode
        if (gz3d.scene.manipulationMode !== newMode) {
          gz3d.scene.setManipulationMode(newMode);
        }
      };

      $scope.notifyResetToWidgets = function (resetType) {
        $scope.$broadcast('RESET', resetType);
      };

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

        stateService.setCurrentState(STATE.PAUSED);

        if (editorsPanelService.showEditorPanel) {
          editorsPanelService.toggleEditors();
        }

        $timeout(function(){

          $scope.notifyResetToWidgets(resetType);

          if (resetType >= 256) { // Frontend-bound reset
            if (resetType === RESET_TYPE.RESET_CAMERA_VIEW) {
              gz3d.scene.resetView();
            }
          } else { // Backend-bound reset
            $scope.splashScreen = $scope.splashScreen || splash.open(false, undefined);
            if (environmentService.isPrivateExperiment()) { //reset from collab
              //open splash screen, blocking ui (i.e. no ok button) and no closing callback

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

      // Camera manipulation

      // This should be integrated to the tutorial story when
      // it will be implemented !
      $scope.requestMove = function (event, action) {
        if (event.which === 1) { // camera control uses left button only
          gz3d.scene.controls.onMouseDownManipulator(action);
        }
      };

      $scope.releaseMove = function (event, action) {
        if (event.which === 1) { // camera control uses left button only
          gz3d.scene.controls.onMouseUpManipulator(action);
        }
      };

      // Spiketrain
      $scope.showSpikeTrain = false;
      $scope.spikeTrainButtonClickHandler = function () {
        $scope.showSpikeTrain = !$scope.showSpikeTrain;
        nrpAnalytics.eventTrack('Toggle-spike-train', {
          category: 'Simulation-GUI',
          value: $scope.showSpikeTrain
        });
      };

      // JointPlot
      $scope.showJointPlot = false;
      $scope.jointPlotButtonClickHandler = function () {
        $scope.showJointPlot = !$scope.showJointPlot;
        nrpAnalytics.eventTrack('Toggle-joint-plot', {
          category: 'Simulation-GUI',
          value: $scope.showJointPlot
        });
      };

      // robot view
      $scope.robotViewButtonClickHandler = function () {
        if (!environmentRenderingService.hasCameraView())
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

      // navigation mode
      $scope.showNavigationModeMenu = false;

      $scope.isActiveNavigationMode = function (mode) {
        return (userNavigationService.navigationMode === mode);
      };

      $scope.navigationModeMenuClickHandler = function () {
        $scope.showNavigationModeMenu = !$scope.showNavigationModeMenu;
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

         case NAVIGATION_MODES.LOOKAT_ROBOT:
              document.removeEventListener('keydown', $scope.displayHumanNavInfo);
              userNavigationService.setLookatRobotCamera();
              break;
        }
      };

      $scope.helpTooltipService = helpTooltipService;

      $scope.codeEditorButtonClickHandler = function () {
        if (userContextService.editIsDisabled || $scope.loadingEditPanel) {
          return;
        } else {
          return editorsPanelService.toggleEditors();
        }
      };

      $scope.showBrainvisualizerPanel = false;
      $scope.toggleBrainvisualizer = function () {
        $scope.showBrainvisualizerPanel = !$scope.showBrainvisualizerPanel;
        nrpAnalytics.eventTrack('Toggle-brainvisualizer-panel', {
          category: 'Simulation-GUI',
          value: $scope.showBrainvisualizerPanel
        });
      };

      $scope.videoStreamsAvailable = false;

      function checkIfVideoStreamsAvailable() {
        videoStreamService.getStreamUrls()
        .then(function(videoStreams) {
          $scope.videoStreamsAvailable = videoStreams && !!videoStreams.length;
        });
      }

      checkIfVideoStreamsAvailable();

      $scope.$watch('stateService.currentState', function() {
        //starting the experiment might publish new video streams, so we check again
        if (!$scope.videoStreamsAvailable && stateService.currentState === STATE.STARTED)
          $timeout(checkIfVideoStreamsAvailable, 500);
      });

      $scope.showVideoStreams = false;
      // refresh in a moment if the simulation has started with the directive visible
      // in case new topics are published by the TFs
      /**
       * Toogle the video stream widget visibility
       */
      $scope.videoStreamsToggle = function() {
        if (!$scope.videoStreamsAvailable)
          return;

        $scope.showVideoStreams = !$scope.showVideoStreams;
      };

      // log console
      $scope.showLogConsole = false;
      $scope.logConsoleButtonClickHandler = function () {
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

      // Environment settings panel
      $scope.showEnvironmentSettingsPanel = false;

      $scope.environmentSettingsClickHandler = function () {
        if ($scope.environmentSettingsIsDisabled || $scope.loadingEnvironmentSettingsPanel) {
          return;
        } else {
          $scope.showEnvironmentSettingsPanel = !$scope.showEnvironmentSettingsPanel;
          nrpAnalytics.eventTrack('Toggle-environment-settings-panel', {
            category: 'Simulation-GUI',
            value: $scope.showEnvironmentSettingsPanel
          });
        }
      };

      function closeSimulationConnections() {
        // Stop listening for status messages
        if (gz3d.iface && gz3d.iface.webSocket) {
          gz3d.iface.webSocket.close();
        }
        // Stop listening for status messages
        stateService.stopListeningForStatusInformation();
      }

      $scope.onSimulationDone = function () {
        closeSimulationConnections();
        // unregister the message callback
        stateService.removeMessageCallback(messageCallback);
        stateService.removeStateCallback(onStateChanged);
      };

      //When resetting do something
      $scope.resetListenerUnbindHandler = $scope.$on('RESET', function (event, resetType) {
        if(resetType === RESET_TYPE.RESET_FULL || resetType === RESET_TYPE.RESET_WORLD) {
          $scope.resetGUI();
        }
      });

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

      $scope.exit = function () {
        exitSimulation();
      };

      function exitSimulation() {
        $scope.cleanUp();

        $scope.splashScreen = null;  // do not reopen splashscreen if further messages happen
        if (environmentService.isPrivateExperiment())
          $location.path('esv-private');
        else
          $location.path('esv-web');
      }

      const esvPages = new Set(['esv-private', 'esv-web']);

      // force page reload when navigating to esv pages, to discard experiment related context
      // valid for all navigation reasons: explicit $location.path, or browser nav button
      $rootScope.$on('$stateChangeStart', (e, state) => {
        if (esvPages.has(state.name))
          $timeout(() => $window.location.reload());
      });

      $scope.cleanUp = function() {
        environmentRenderingService.deinit();

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

        closeSimulationConnections();
      };

      // clean up on leaving
      $scope.$on('$destroy', function () {
        /* NOT CALLED AUTOMATICALLY ON EXITING AN EXPERIMENT */
        /* possible cause of memory leaks */

        $scope.cleanUp();
      });

    }]);
}());
