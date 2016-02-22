(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('editorPanel', [
      'simulationInfo',
      'gz3d',
      function (simulationInfo, gz3d) {
        return {
          templateUrl: 'views/esv/editor-panel.html',
          restrict: 'E',
          scope: true  // create a child scope for the directive and inherits the parent scope properties
        };
      }
    ]);
}());
