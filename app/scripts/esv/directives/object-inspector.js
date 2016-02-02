(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('objectInspector', [
      'OBJECT_VIEW_MODE',
      'objectInspectorService',
      function (OBJECT_VIEW_MODE, objectInspectorService) {
        return {
          templateUrl: 'views/esv/object-inspector.html',
          restrict: 'E',
          scope: true,
          link: function (scope, element, attrs) {
            scope.$on("$destroy", function() {
              // remove the callback
              objectInspectorService.isShown = false;
            });

            scope.OBJECT_VIEW_MODE = OBJECT_VIEW_MODE;
          }
        };
      }]);
}());
