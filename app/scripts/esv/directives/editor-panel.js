(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('editorPanel', [
      function () {
        return {
          templateUrl: 'views/esv/editor-panel.html',
          restrict: 'E',
          scope: true  // create a child scope for the directive and inherits the parent scope properties
        };
      }
    ]);
}());
