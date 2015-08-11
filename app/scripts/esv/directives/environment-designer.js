(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
  .constant('EDIT_MODE', {
    VIEW: 'view',
    TRANSLATE: 'translate',
    ROTATE: 'rotate'
  });

  angular.module('exdFrontendApp')
  .directive('environmentDesigner', ['$log', 'EDIT_MODE', 'panels', 'simulationSDFWorld', 'STATE', 'simulationState',
                                     '$stateParams', 'bbpConfig', '$rootScope', 'gz3d', 'stateService',
  function ($log, EDIT_MODE, panels, simulationSDFWorld, STATE, simulationState,
            $stateParams, bbpConfig, $rootScope, gz3d, stateService) {
    return {
      templateUrl: 'views/esv/environment-designer.html',
      restrict: 'E',
      link: function(scope, element, attrs) {
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

        scope.exportSDFWorld = function () {
          $log.debug('ED: Querying server for SDF world export.');
          simulationSDFWorld(scope.serverBaseUrl).export({}, function (data) {
            var $q = data.sdf;
            var $el = document.createElement('a');
            $el.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent($q));
            $el.setAttribute('download', 'world.sdf');
            $el.style.display = 'none';
            document.body.appendChild($el);
            $el.click();
            document.body.removeChild($el);
          });
        };
      }
    };
  }]);
}());
