(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('objectEditor', [
      'OBJECT_VIEW_MODE',
      'objectEditorService',
      function (OBJECT_VIEW_MODE, objectEditorService) {
        return {
          templateUrl: 'views/esv/object-editor.html',
          restrict: 'E',
          scope: true,
          link: function (scope, element, attrs) {
            scope.$on("$destroy", function() {
              // remove the callback
              objectEditorService.isShown = false;
            });

            scope.OBJECT_VIEW_MODE = OBJECT_VIEW_MODE;
          }
        };
      }]);

  /* directive for the numerical input fields within the object editor */
  angular.module('exdFrontendApp')
    .directive('transformInputNum', [
      function () {
        return {
          restrict: 'A',
          link: function (scope, element, attr) {

            // need to stop propagation to allow correct interaction with input field
            element.on('mousedown touchstart', function mousedown(event) {
              event.stopPropagation();
            });

            element.on('mousemove touchmove', function mousemove(event) {
              event.stopPropagation();
            });

            element.on('mouseup touchend', function mouseup(event) {
              event.stopPropagation();
            });
          }
        };
      }]);
}());