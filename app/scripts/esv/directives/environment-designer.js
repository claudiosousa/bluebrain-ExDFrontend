(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
  .constant('EDIT_MODE', {
    VIEW: 'view',
    TRANSLATE: 'translate',
    ROTATE: 'rotate'
  });

  angular.module('exdFrontendApp')
  .directive('environmentDesigner', ['$log', 'EDIT_MODE', 'panels', 'simulationSDFWorld',
  function ($log, EDIT_MODE, panels, simulationSDFWorld) {
    return {
      templateUrl: 'views/esv/environment-designer.html',
      restrict: 'E',
      link: function(scope, element, attrs) {
        scope.EDIT_MODE = EDIT_MODE;
        scope.mode = EDIT_MODE.view;

        scope.setEditMode = function (mode) {
          $log.debug('ED: Setting mode to ' + mode + '.');
          scope.mode = mode;
          scope.$root.scene.setManipulationMode(mode);
          panels.close();
        };

        scope.exportSDFWorld = function () {
          $log.debug('ED: Querying server for SDF world export.');
          simulationSDFWorld(scope.serverBaseUrl).export({}, function (data) {
            var $q = data.sdf_dump;
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
