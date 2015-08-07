(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
  .constant('EDIT_MODE', {
    VIEW: 'view',
    TRANSLATE: 'translate',
    ROTATE: 'rotate'
  });

  angular.module('exdFrontendApp')
  .directive('environmentDesigner', ['$log', 'EDIT_MODE', 'panels', 'simulationSDFWorld', 'STATE', 'simulationState', 'simulationControl',
                                     '$stateParams', 'bbpConfig', '$rootScope', 'gz3d', 'stateService', 'experimentSimulationService', '$document',
  function ($log, EDIT_MODE, panels, simulationSDFWorld, STATE, simulationState, simulationControl,
            $stateParams, bbpConfig, $rootScope, gz3d, stateService, experimentSimulationService, $document) {
    return {
      templateUrl: 'views/esv/environment-designer.html',
      restrict: 'E',
      link: function(scope, element, attrs) {
        if (!$stateParams.serverID || !$stateParams.simulationID) {
          throw "No serverID or simulationID given.";
        }

        var serverID = $stateParams.serverID;
        var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];
        scope.assetsPath = serverConfig.gzweb.assets;//used by the view

        scope.EDIT_MODE = EDIT_MODE;
        scope.gz3d = gz3d;

        scope.setEditMode = function (mode) {
          var setMode = function(mode) {
            $log.debug('Setting mode ' + mode + '.');
            gz3d.scene.setManipulationMode(mode);
            panels.close();
          };

          if (gz3d.scene.manipulationMode === mode) {
            $log.debug("Mode " + mode + " is already set.");
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
          window.guiEvents.emit('spawn_entity_start', modelName);
          scope.setEditMode(EDIT_MODE.TRANSLATE);
          panels.close();
        };

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
