(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('interactive', [ function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {

        var domElement = element[0];
        domElement.style.cursor = 'auto';

        // need to stop propagation to allow correct interaction with input field (mark parts of string, ...)
        // and avoid interaction with higher level directives (movable, ...)
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
