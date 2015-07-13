(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('movable', ['$document', function ($document) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        var startX = 0, startY = 0, x = 0, y = 0;

        element.css({
          cursor: 'move',
          position: 'absolute'
        });

        element.on('mousedown touchstart', function (event) {
          // Prevent default dragging of selected content
          event.preventDefault();
          event.stopPropagation();

          var coordinates = getEventCoordinates(event);
          startX = coordinates.x;
          startY = coordinates.y;

          x = element.position().left;
          y = element.position().top;

          $document.on('mousemove touchmove', mousemove);
          $document.on('mouseup touchend', mouseup);
        });

        function mousemove(event) {
          event.stopPropagation();

          var coordinates = getEventCoordinates(event);
          var dX = coordinates.x - startX;
          var dY = coordinates.y - startY;

          // "-1" is needed to prevent the scrollbars to appear
          if ((y + dY < window.innerHeight - element.outerHeight() - 1) && (y + dY > 0)) {
            element.css({
              top: y + dY + 'px'
            });
          }
          if ((x + dX < window.innerWidth - element.outerWidth()) && (x + dX > 0)) {
            element.css({
              left: x + dX + 'px'
            });
          }
        }

        function mouseup(event) {
          event.stopPropagation();
          $document.off('mousemove touchmove', mousemove);
          $document.off('mouseup touchend', mouseup);
        }

        function getEventCoordinates(event) {
          var isTouchEvent = event.originalEvent && event.originalEvent.touches;
          var eventX = isTouchEvent ? event.originalEvent.touches[0].pageX : event.pageX;
          var eventY = isTouchEvent ? event.originalEvent.touches[0].pageY : event.pageY;
          return {x: eventX, y: eventY};
        }

      }
    };
  }]);
}());
