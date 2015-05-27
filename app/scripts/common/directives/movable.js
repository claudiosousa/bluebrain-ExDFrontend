(function() {
  'use strict';

  angular.module('exdFrontendApp').directive('movable', ['$document', function($document) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        var startX = 0, startY = 0, x = 0, y = 0;

        element.css({
          cursor: 'move',
          position: 'absolute'
        });

        element.on('mousedown', function(event) {
          // Prevent default dragging of selected content
          event.preventDefault();
          startX = event.pageX;
          startY = event.pageY;
          x = element.offset().left;
          y = element.offset().top;
          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        });

        function mousemove(event) {
          var dX = event.pageX - startX;
          var dY = event.pageY - startY;

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

        function mouseup() {
          $document.off('mousemove', mousemove);
          $document.off('mouseup', mouseup);
        }
      }
    };
  }]);
}());
