(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
  .constant('EDIT_MODE', {
    VIEW: 'view',
    TRANSLATE: 'translate',
    ROTATE: 'rotate'
  });

  angular.module('exdFrontendApp')
  .directive('environmentDesigner', ['$log', 'EDIT_MODE', 'panels', 'simulationSDFWorld', 'STATE',
                                     'bbpConfig', '$rootScope', 'gz3d', 'stateService', 'simulationInfo',
                                     '$document', 'OPERATION_MODE','contextMenuState',
  function ($log, EDIT_MODE, panels, simulationSDFWorld, STATE,
            bbpConfig, $rootScope, gz3d, stateService, simulationInfo,
            $document, OPERATION_MODE, contextMenuState) {
    return {
      templateUrl: 'views/esv/environment-designer.html',
      restrict: 'E',
      link: function(scope, element, attrs) {
        scope.stateService = stateService;
        scope.STATE = STATE;

        var serverConfig = simulationInfo.serverConfig;
        scope.assetsPath = serverConfig.gzweb.assets;//used by the view

        scope.EDIT_MODE = EDIT_MODE;
        scope.gz3d = gz3d;

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
                var show =
                  (simulationInfo.mode === OPERATION_MODE.EDIT) &&
                   (stateService.currentState === STATE.INITIALIZED || stateService.currentState === STATE.PAUSED) &&
                  model.name.indexOf('robot') === -1;//don't delete the robot

                this.items[0].text = model.name;

                return (this.visible =
                          this.items[0].visible = show);
            }
          }
        );


        scope.exportSDFWorld = function () {
          $log.debug('ED: Querying server for SDF world export.');
          simulationSDFWorld(scope.serverBaseUrl).export({}, function (data) {
            angular.element('<a ' +
              'href="data:text/xml;charset=utf-8,' + encodeURIComponent(data.sdf) + '" ' +
              'download="world.sdf" />')[0]
            .click();
          });
        };
      }
    };
  }]);
}());
