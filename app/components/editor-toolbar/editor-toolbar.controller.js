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
(function() {
  'use strict';

  class EditorToolbarController {
    constructor($rootScope,
                $scope,
                $timeout,
                $location,
                $window,
                contextMenuState,
                userContextService,
                stateService,
                gz3d,
                editorsPanelService,
                userNavigationService,
                objectInspectorService,
                nrpAnalytics,
                hbpDialogFactory,
                environmentService,
                backendInterfaceService,
                environmentRenderingService,
                splash,
                simulationInfo,
                videoStreamService,
                dynamicViewOverlayService,
                helpTooltipService,
                editorToolbarService,
                STATE,
                NAVIGATION_MODES,
                EDIT_MODE,
                RESET_TYPE) {

      this.contextMenuState = contextMenuState;
      this.userContextService = userContextService;
      this.editorToolbarService = editorToolbarService;
      this.nrpAnalytics = nrpAnalytics;
      this.stateService = stateService;
      this.gz3d = gz3d;
      this.objectInspectorService = objectInspectorService;
      this.hbpDialogFactory = hbpDialogFactory;
      this.editorsPanelService = editorsPanelService;
      this.environmentService = environmentService;
      this.splash = splash;
      this.backendInterfaceService = backendInterfaceService;
      this.simulationInfo = simulationInfo;
      this.environmentRenderingService = environmentRenderingService;
      this.userNavigationService = userNavigationService;
      this.dynamicViewOverlayService = dynamicViewOverlayService;

      this.EDIT_MODE = EDIT_MODE;
      this.RESET_TYPE = RESET_TYPE;
      this.STATE = STATE;
      this.NAVIGATION_MODES = NAVIGATION_MODES;

      this.$timeout = $timeout;
      // TODO: remove this after refactoring is completed
      this.scope = $scope;

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
      let analyticsEventTimeout = _.once(function() {
        nrpAnalytics.eventTrack('Timeout', {
          category: 'Simulation'
        });
      });

      /* status messages are listened to here. A splash screen is opened to display progress messages. */
      /* This is the case when closing or resetting a simulation/environment for example.
       /* Loading is taken take of by a progressbar somewhere else. */
      /* Timeout messages are displayed in the toolbar. */
      var messageCallback = function(message) {
        /* Progress messages (except start state progress messages which are handled by another progress bar) */
        if (angular.isDefined(message.progress)) {

          var stateStopFailed = stateService.currentState === STATE.STOPPED ||
              stateService.currentState === STATE.FAILED;

          //TODO (Sandro): i think splashscreen stuff should be handled with a message callback inside the splashscreen service itself, not here
          //TODO: but first onSimulationDone() has to be moved to experiment service or replaced
          /* splashScreen == null means it has been already closed and should not be reopened */
          if (splash.splashScreen !== null &&
              !environmentRenderingService.sceneLoading &&
              (angular.isDefined(message.state) ||
              (stateStopFailed ||
              (angular.isDefined(message.progress.subtask) &&
              message.progress.subtask.length > 0 )))) {
            splash.splashScreen = splash.splashScreen || splash.open(
                    !message.progress.block_ui,
                    (stateStopFailed ? $scope.exit : undefined));
          }
          if (angular.isDefined(message.progress.done) &&
              message.progress.done) {
            splash.spin = false;
            splash.setMessage({headline: 'Finished'});
            /* if splash is a blocking modal (no button), then close it*/
            /* (else it is closed by the user on button click) */
            if (!splash.showButton) {
              // blocking modal -> we using the splash for some in-simulation action (e.g. resetting),
              // so we don't have to close the websocket, just the splash screen.
              splash.close();
              splash.splashScreen = undefined;
            } else {
              // the modal is non blocking (i.e. w/ button) ->
              // we are closing the simulation thus we have to
              // cleanly close ros websocket and stop window
              $scope.onSimulationDone();
            }
          } else {
            splash.setMessage({
              headline: message.progress.task,
              subHeadline: message.progress.subtask
            });
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
      stateService.getCurrentState().then(function() {
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

      $scope.notifyResetToWidgets = function(resetType) {
        $scope.$broadcast('RESET', resetType);
      };

      // Spiketrain
      $scope.showSpikeTrain = false;
      $scope.spikeTrainButtonClickHandler = function() {
        $scope.showSpikeTrain = !$scope.showSpikeTrain;
        nrpAnalytics.eventTrack('Toggle-spike-train', {
          category: 'Simulation-GUI',
          value: $scope.showSpikeTrain
        });
      };

      // JointPlot
      $scope.showJointPlot = false;
      $scope.jointPlotButtonClickHandler = function() {
        $scope.showJointPlot = !$scope.showJointPlot;
        nrpAnalytics.eventTrack('Toggle-joint-plot', {
          category: 'Simulation-GUI',
          value: $scope.showJointPlot
        });
      };

      // navigation mode
      this.showNavigationModeMenu = false;

      $scope.helpTooltipService = helpTooltipService;

      $scope.codeEditorButtonClickHandler = function() {
        if (userContextService.editIsDisabled || $scope.loadingEditPanel) {
          return;
        } else {
          return editorsPanelService.toggleEditors();
        }
      };

      $scope.videoStreamsAvailable = false;

      function checkIfVideoStreamsAvailable() {
        videoStreamService.getStreamUrls().then(function(videoStreams) {
          $scope.videoStreamsAvailable = videoStreams && !!videoStreams.length;
        });
      }

      checkIfVideoStreamsAvailable();

      $scope.$watch('stateService.currentState', function() {
        //starting the experiment might publish new video streams, so we check again
        if (!$scope.videoStreamsAvailable &&
            stateService.currentState === STATE.STARTED)
          $timeout(checkIfVideoStreamsAvailable, 500);
      });

      /**
       * Toogle the video stream widget visibility
       */
      $scope.videoStreamsToggle = function() {
        if (!$scope.videoStreamsAvailable)
          return;

        $rootScope.$emit('openVideoStream');
      };

      // log console
      $scope.showLogConsole = false;
      $scope.logConsoleButtonClickHandler = function() {
        $scope.showLogConsole = !$scope.showLogConsole;
        if ($scope.showLogConsole)
          $scope.missedConsoleLogs = 0;
        nrpAnalytics.eventTrack('Toggle-log-console', {
          category: 'Simulation-GUI',
          value: $scope.showLogConsole
        });
      };

      $scope.missedConsoleLogs = 0;
      $scope.consoleLogReceived = function() {
        if (!$scope.showLogConsole)
          $scope.missedConsoleLogs++;
      };

      // Environment settings panel
      $scope.showEnvironmentSettingsPanel = false;

      $scope.environmentSettingsClickHandler = function() {
        if ($scope.environmentSettingsIsDisabled ||
            $scope.loadingEnvironmentSettingsPanel) {
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

      $scope.onSimulationDone = function() {
        closeSimulationConnections();
        // unregister the message callback
        stateService.removeMessageCallback(messageCallback);
        stateService.removeStateCallback(onStateChanged);
      };

      //When resetting do something
      $scope.resetListenerUnbindHandler = $scope.$on('RESET',
          function(event, resetType) {
            if (resetType === RESET_TYPE.RESET_FULL ||
                resetType === RESET_TYPE.RESET_WORLD) {
              $scope.resetGUI();
            }
          });

      $scope.resetGUI = function() {
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

      $scope.exit = function() {
        exitSimulation();
      };

      function exitSimulation() {
        $scope.cleanUp();

        splash.splashScreen = null;  // do not reopen splashscreen if further messages happen
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
      $scope.$on('$destroy', function() {
        /* NOT CALLED AUTOMATICALLY ON EXITING AN EXPERIMENT */
        /* possible cause of memory leaks */

        $scope.cleanUp();
      });
    }

    updateSimulation(newState) {
      this.stateService.setCurrentState(newState);
    };

    // play/pause/stop button handler
    simControlButtonHandler(newState) {
      this.updateSimulation(newState);
      this.setEditMode(this.EDIT_MODE.VIEW);
      if (this.objectInspectorService !== null) {
        this.objectInspectorService.removeEventListeners();
      }
    };

    setEditMode(newMode) {
      //currentMode !== newMode
      if (this.gz3d.scene.manipulationMode !== newMode) {
        this.gz3d.scene.setManipulationMode(newMode);
      }
    };

    resetButtonClickHandler() {
      this.scope.request = {
        resetType: this.RESET_TYPE.NO_RESET
      };
      this.hbpDialogFactory.confirm({
        'title': 'Reset Menu',
        'templateUrl': 'views/esv/reset-checklist-template.html',
        'scope': this.scope
      }).then(() => {
        this.stateService.ensureStateBeforeExecuting(
            this.STATE.PAUSED,
            // TODO: can we pass request as parameter?
            () => this.__resetButtonClickHandler()
        );
      });
    };

    __resetButtonClickHandler() {
      const resetType = this.scope.request.resetType;
      if (resetType === this.RESET_TYPE.NO_RESET) {
        return;
      }

      this.stateService.setCurrentState(this.STATE.PAUSED);

      if (this.editorsPanelService.showEditorPanel) {
        this.editorsPanelService.toggleEditors();
      }

      this.$timeout(() => {
        this.scope.notifyResetToWidgets(resetType);

        if (resetType >= 256) { // Frontend-bound reset
          if (resetType === this.RESET_TYPE.RESET_CAMERA_VIEW) {
            this.gz3d.scene.resetView();
          }
        } else { // Backend-bound reset
          this.splash.splashScreen = this.splash.splashScreen ||
              this.splash.open(false, undefined);
          if (this.environmentService.isPrivateExperiment()) { //reset from collab
            //open splash screen, blocking ui (i.e. no ok button) and no closing callback

            let resetWhat = '', downloadWhat = '';

            ((resetType) => { //customize user message depending on the reset type
              if (resetType === this.RESET_TYPE.RESET_WORLD) {
                resetWhat = 'Environment';
                downloadWhat = 'World SDF ';
              } else if (resetType === this.RESET_TYPE.RESET_BRAIN) {
                resetWhat = 'Brain';
                downloadWhat = 'brain configuration file ';
              }
            })(resetType);

            const messageHeadline = 'Resetting ' + resetWhat;
            const messageSubHeadline = 'Downloading ' + downloadWhat +
                'from the Collab';

            _.defer(() => {
              this.splash.spin = true;
              this.splash.setMessage(
                  {headline: messageHeadline, subHeadline: messageSubHeadline});
            });

            this.backendInterfaceService.resetCollab(
                this.simulationInfo.contextID,
                this.scope.request,
                this.splash.closeSplash,
                this.splash.closeSplash
            );
          } else {
            //other kinds of reset
            this.backendInterfaceService.reset(
                this.scope.request,
                () => { // Success callback
                  // do not close the splash if successful
                  // it will be closed by messageCallback
                  this.gz3d.scene.applyComposerSettings(true, false);
                  this.splash.closeSplash();
                  if (resetType === this.RESET_TYPE.RESET_BRAIN) {
                    this.scope.$broadcast('UPDATE_PANEL_UI');
                  }
                },
                this.splash.closeSplash
            );
          }
        }
      }, 100);
    };

    // Lights management
    modifyLightClickHandler(direction, button) {
      if ((direction < 0 && this.gz3d.isGlobalLightMinReached()) ||
          (direction > 0 && this.gz3d.isGlobalLightMaxReached())) {
        return;
      }

      this.gz3d.scene.emitter.emit('lightChanged', direction * 0.1);
    };

    // Camera manipulation
    // This should be integrated to the tutorial story when
    // it will be implemented !
    requestMove(event, action) {
      if (event.which === 1) { // camera control uses left button only
        this.gz3d.scene.controls.onMouseDownManipulator(action);
      }
    };

    releaseMove(event, action) {
      if (event.which === 1) { // camera control uses left button only
        this.gz3d.scene.controls.onMouseUpManipulator(action);
      }
    };

    toggleBrainvisualizer() {
      this.editorToolbarService.showBrainvisualizerPanel = !this.editorToolbarService.isBrainVisualizerActive;
      this.nrpAnalytics.eventTrack('Toggle-brainvisualizer-panel', {
        category: 'Simulation-GUI',
        value: this.editorToolbarService.isBrainVisualizerActive
      });
    }

    // robot view
    robotViewButtonClickHandler() {
      if (!this.environmentRenderingService.hasCameraView())
        return;
      this.editorToolbarService.showRobotView = !this.editorToolbarService.isRobotCameraViewActive;
      this.nrpAnalytics.eventTrack('Toggle-robot-view', {
        category: 'Simulation-GUI',
        value: this.editorToolbarService.isRobotCameraViewActive
      });
      this.gz3d.scene.viewManager.views.forEach((view) => {
        if (angular.isDefined(view.type) && view.type ===
            'camera' /* view will be named the same as the corresponding camera sensor from the gazebo .sdf */) {
          view.active = !view.active;
          view.container.style.visibility = view.active ?
              'visible' :
              'hidden';
        }
      });
    }

    isActiveNavigationMode(mode) {
      return (this.userNavigationService.navigationMode === mode);
    };

    navigationModeMenuClickHandler() {
      this.showNavigationModeMenu = !this.showNavigationModeMenu;
    };

    setNavigationMode(mode) {
      switch (mode) {
        case this.NAVIGATION_MODES.FREE_CAMERA:
          this.userNavigationService.setModeFreeCamera();
          break;

        case this.NAVIGATION_MODES.GHOST:
          this.userNavigationService.setModeGhost();
          break;

        case this.NAVIGATION_MODES.HUMAN_BODY:
          if (this.stateService.currentState !== this.STATE.PAUSED) {
            this.userNavigationService.setModeHumanBody();
          }
          break;

        case this.NAVIGATION_MODES.LOOKAT_ROBOT:
          this.userNavigationService.setLookatRobotCamera();
          break;
      }
    }

    createDynamicOverlay(componentName) {
      this.dynamicViewOverlayService.createOverlay(
          document.getElementById('experiment-view-widget-overlays'),
          /* parent element to attach overlay to */
          componentName
      );
    };


  }
  angular.module('editorToolbarModule', ['helpTooltipModule']).
      controller('EditorToolbarController',
          [
            '$rootScope',
            '$scope',
            '$timeout',
            '$location',
            '$window',
            'contextMenuState',
            'userContextService',
            'stateService',
            'gz3d',
            'editorsPanelService',
            'userNavigationService',
            'objectInspectorService',
            'nrpAnalytics',
            'hbpDialogFactory',
            'environmentService',
            'backendInterfaceService',
            'environmentRenderingService',
            'splash',
            'simulationInfo',
            'videoStreamService',
            'dynamicViewOverlayService',
            'helpTooltipService',
            'editorToolbarService',
            'STATE',
            'NAVIGATION_MODES',
            'EDIT_MODE',
            'RESET_TYPE',
            (...args) => new EditorToolbarController(...args)]);

})();
