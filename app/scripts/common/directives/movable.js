(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('movable', ['$document', function ($document) {
    var MARGIN = 8;
    var BOTTOM_BAR_HEIGHT = 43;

    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        // just to get from e.g. 0.41 to 41 for css percentage values
        var FRACTION_TO_PERCENTAGE = 100;

        var initialCoordinates, initialBoundingRect,
          dragElement = attrs.movableAnchor ? element.find(attrs.movableAnchor) : $(element[0]);

        dragElement.css({
          cursor: 'move'
        });

        element.css({
          position: 'absolute'
        });
        var getEventCoordinates = function (event) {
          var isTouchEvent = event.originalEvent && event.originalEvent.touches;
          var eventX = isTouchEvent ? event.originalEvent.touches[0].pageX : event.pageX;
          var eventY = isTouchEvent ? event.originalEvent.touches[0].pageY : event.pageY;
          return { x: eventX, y: eventY };
        };

        var onPointerDown = function (event) {
          // Prevent default dragging of selected content
          event.preventDefault();
          event.stopPropagation();

          initialCoordinates = getEventCoordinates(event);
          initialBoundingRect = element[0].getBoundingClientRect();

          $document.on('mousemove touchmove', onPointerMove);
          $document.on('mouseup touchend', onPointerUp);
        };

        dragElement.on('mousedown touchstart', onPointerDown);

        var onPointerMove = function (event) {
          event.stopPropagation();

          var coordinates = getEventCoordinates(event);
          var dX = coordinates.x - initialCoordinates.x;
          var dY = coordinates.y - initialCoordinates.y;

          if (coordinates.x < window.innerWidth - MARGIN && coordinates.x > MARGIN) {
            var relativeLeft = ((initialBoundingRect.left + dX) / window.innerWidth) * FRACTION_TO_PERCENTAGE;
            element.css({left: relativeLeft + '%'});
          }
          if (coordinates.y < window.innerHeight - MARGIN - BOTTOM_BAR_HEIGHT && coordinates.y > MARGIN) {
            var relativeTop = ((initialBoundingRect.top + dY) / window.innerHeight) * FRACTION_TO_PERCENTAGE;
            element.css({top: relativeTop + '%'});
          }
        };

        var onPointerUp = function (event) {
          event.stopPropagation();
          $document.off('mousemove touchmove', onPointerMove);
          $document.off('mouseup touchend', onPointerUp);
        };

        scope.$on('$destroy', function () {
          $document.off('mousemove touchmove', onPointerMove);
        });
      }
    };
  }]);
} ());
