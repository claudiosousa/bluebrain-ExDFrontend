(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('movableAnchorForId', ['$document', function ($document) {
    return {
      restrict: 'A',
      scope: {},
      link: function (scope, element, attrs) {
        scope.startX = 0;
        scope.startY = 0;
        scope.targetX = 0;
        scope.targetY = 0;

        element.css({
          cursor: 'move',
          position: 'absolute'
        });

        scope.targetElement = document.getElementById(attrs.movableAnchorForId);

        scope.getEventCoordinates = function(event) {
          var isTouchEvent = event.originalEvent && event.originalEvent.touches;
          var eventX = isTouchEvent ? event.originalEvent.touches[0].pageX : event.pageX;
          var eventY = isTouchEvent ? event.originalEvent.touches[0].pageY : event.pageY;
          return {x: eventX, y: eventY};
        };

        scope.onPointerDown = function(event) {
          // Prevent default dragging of selected content
          event.preventDefault();
          event.stopPropagation();

          var coordinates = scope.getEventCoordinates(event);
          scope.startX = coordinates.x;
          scope.startY = coordinates.y;

          scope.targetX = scope.targetElement.getBoundingClientRect().left;
          scope.targetY = scope.targetElement.getBoundingClientRect().top;

          $document.on('mousemove touchmove', scope.onPointerMove);
          $document.on('mouseup touchend', scope.onPointerUp);
        };
        element.on('mousedown touchstart', scope.onPointerDown);

        scope.onPointerMove = function(event) {
          event.stopPropagation();

          var coordinates = scope.getEventCoordinates(event);
          var dX = coordinates.x - scope.startX;
          var dY = coordinates.y - scope.startY;

          // "-1" is needed to prevent the scrollbars to appear
          if ((scope.targetX + dX < window.innerWidth - scope.targetElement.getBoundingClientRect().width) && (scope.targetX + dX > 0)) {
            scope.targetElement.style.left = scope.targetX + dX + 'px';
          }
          if ((scope.targetY + dY < window.innerHeight - scope.targetElement.getBoundingClientRect().height - 1) && (scope.targetY + dY > 0)) {
            scope.targetElement.style.top = scope.targetY + dY + 'px';
          }
        };

        scope.onPointerUp = function(event) {
          event.stopPropagation();
          $document.off('mousemove touchmove', scope.onPointerMove);
          $document.off('mouseup touchend', scope.onPointerUp);
        };
      }
    };
  }]);
}());
