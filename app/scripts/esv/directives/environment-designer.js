(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
  .constant('EDIT_MODE', {
    VIEW: 'view',
    TRANSLATE: 'translate',
    ROTATE: 'rotate'
  });

  angular.module('exdFrontendApp')
  .directive('environmentDesigner', [
    '$document',
    'STATE',
    'EDIT_MODE',
    'OPERATION_MODE',
    'panels',
    'simulationSDFWorld',
    'bbpConfig',
    'gz3d',
    'stateService',
    'simulationInfo',
    'contextMenuState',
    'backendInterfaceService',
    'hbpDialogFactory',
  function (
    $document,
    STATE,
    EDIT_MODE,
    OPERATION_MODE,
    panels,
    simulationSDFWorld,
    bbpConfig,
    gz3d,
    stateService,
    simulationInfo,
    contextMenuState,
    backendInterfaceService,
    hbpDialogFactory
  ) {
    return {
      templateUrl: 'views/esv/environment-designer.html',
      restrict: 'E',
      link: function(scope, element, attrs) {
        scope.stateService = stateService;
        scope.STATE = STATE;

        var serverConfig = simulationInfo.serverConfig;
        // Used by the view
        scope.assetsPath = serverConfig.gzweb.assets;
        scope.EDIT_MODE = EDIT_MODE;
        scope.gz3d = gz3d;
        scope.isCollabExperiment = simulationInfo.isCollabExperiment;
        scope.isSavingToCollab = false;

        scope.setEditMode = function (mode) {
          var setMode = function(m) {
            gz3d.scene.setManipulationMode(m);
            panels.close();
          };

          if (gz3d.scene.manipulationMode === mode) {
            panels.close();
            return;
          } else {
            switch (mode) {
              case EDIT_MODE.VIEW:
                setMode(mode);
                break;
              case EDIT_MODE.TRANSLATE:
              case EDIT_MODE.ROTATE:
                stateService.ensureStateBeforeExecuting(
                  STATE.PAUSED,
                  function() { setMode(mode); }
                );
                break;
            }
          }
        };

        scope.addModel = function (modelName) {
          if (stateService.currentState !== STATE.INITIALIZED) {
            window.guiEvents.emit('spawn_entity_start', modelName);
            scope.setEditMode(EDIT_MODE.TRANSLATE);
            panels.close();
          }
        };

        scope.deleteModel = function() {
         var entity = gz3d.scene.selectedEntity;
         gz3d.gui.emitter.emit('deleteEntity', entity);
         contextMenuState.toggleContextMenu(false);
        };

        //Delete object context Menu item
        contextMenuState.pushItemGroup(
          {
            label: 'Delete',
            visible: false,
            items: [
                 { text: '',//model name
                   callback: function (event) { scope.deleteModel(); event.stopPropagation();},
                   visible: false
                 }
            ],

            hide: function() {
                this.visible = this.items[0].visible = false;
            },

            show: function(model) {
                var shouldShowOnlyInEditMode =
                  (simulationInfo.mode === OPERATION_MODE.EDIT);

                var shouldShowOnlyWhenSimIsPaused =
                  (stateService.currentState === STATE.PAUSED);

                var shouldNotShowOnRobots =
                  model.name.indexOf('robot') === -1;

                var show =
                   shouldShowOnlyInEditMode &&
                   shouldShowOnlyWhenSimIsPaused &&
                   shouldNotShowOnRobots; //don't delete the robot

                this.items[0].text = model.name;

                return (this.visible =
                          this.items[0].visible = show);
            }
          }
        );


        scope.exportSDFWorld = function () {
          simulationSDFWorld(simulationInfo.serverBaseUrl).export({}, function (data) {
            angular.element('<a ' +
              'href="data:text/xml;charset=utf-8,' + encodeURIComponent(data.sdf) + '" ' +
              'download="world.sdf" />')[0]
            .click();
          });
        };

        scope.saveSDFIntoCollabStorage = function () {
          scope.isSavingToCollab = true;
          backendInterfaceService.saveSDF(
            simulationInfo.contextID,
            function() { // Success callback
              scope.isSavingToCollab = false;
            },function() { // Failure callback
              hbpDialogFactory.alert(
                {title: "Error.",
                template: "Error while saving SDF to Collab storage."
              });
              scope.isSavingToCollab = false;
            }
          );
        };
      }
    };
  }]);
}());
