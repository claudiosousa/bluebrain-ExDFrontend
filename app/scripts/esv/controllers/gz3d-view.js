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
    });

  angular.module('exdFrontendApp')
    .controller('Gz3dViewCtrl',
    ['$rootScope', '$scope', '$timeout',
      '$location', '$window', '$document', '$log', 'bbpConfig',
      'simulationControl', 'colorableObjectService',
      'STATE', 'nrpBackendVersions',
      'nrpFrontendVersion',
      'gz3d', 'stateService', 'contextMenuState', 'objectInspectorService',
      'simulationInfo',
      'RESET_TYPE',
      'experimentsFactory',
      'userContextService', 'editorsPanelService',
      'environmentRenderingService',
      function ($rootScope, $scope, $timeout,
        $location, $window, $document, $log, bbpConfig,
        simulationControl, colorableObjectService,
        STATE, nrpBackendVersions,
        nrpFrontendVersion,
        gz3d, stateService, contextMenuState, objectInspectorService,
        simulationInfo,
        RESET_TYPE,
        experimentsFactory,
        userContextService, editorsPanelService,
        environmentRenderingService) {

        $scope.simulationInfo = simulationInfo;
        $scope.isMultipleBrains = function() {
          return simulationInfo.experimentDetails.brainProcesses > 1;
        };

        stateService.Initialize();

        $scope.rosTopics = bbpConfig.get('ros-topics');
        $scope.rosbridgeWebsocketUrl = simulationInfo.serverConfig.rosbridge.websocket;

        $scope.STATE = STATE;
        $scope.RESET_TYPE = RESET_TYPE;
        $scope.sceneLoading = true;

        $scope.gz3d = gz3d;
        $scope.stateService = stateService;
        $scope.contextMenuState = contextMenuState;
        $scope.objectInspectorService = objectInspectorService;
        $scope.userContextService = userContextService;
        $scope.editorsPanelService = editorsPanelService;
        $scope.environmentRenderingService = environmentRenderingService;

        var setExperimentDetails = function(){
          $scope.ExperimentDescription = simulationInfo.experimentDetails.description;
          $scope.ExperimentName = simulationInfo.experimentDetails.name;
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

        // Query the state of the simulation
        stateService.getCurrentState().then(function () {
          if (stateService.currentState !== STATE.STOPPED) {
            return;
            //TODO: touch event handling for context menu should happen somewhere else?
            // Handle touch clicks to toggle the context menu
            // This is used to save the position of a touch start event used for content menu toggling
            /*
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
           */
          }
        });


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
      }]);
} ());
