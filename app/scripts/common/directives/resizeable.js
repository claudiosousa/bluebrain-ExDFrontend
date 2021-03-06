
(function () {
  'use strict';

  // Code inspirations from:
  // http://jsfiddle.net/zzxz3my9/5/
  // http://jsfiddle.net/julian_weinert/xUAZ5/30/
  // http://stackoverflow.com/questions/14611736/javascript-div-resizing-with-aspect-ratio
  angular.module('exdFrontendApp').directive('resizeable', ['$window', '$document', function ($window, $document) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {

        // We check whether an attribute is present in this HTML element, i.e. if it looks like this for instance:
        // <div moveable resizeable keep-aspect-ratio>...</div>
        var keepAspectRatio = angular.isDefined(attrs.keepAspectRatio);

        // This amount of pixels is used in order to avoid scrollbars to appear on the right / on the bottom.
        var SAFETY_PAD = 10;
        // just to get from e.g. 0.41 to 41 for css percentage values
        var FRACTION_TO_PERCENTAGE = 100;

        // The little handle that the user drags around for resizing. It will be appended to the element that
        // should be resizeable and is only visible through a small image that visually indicates its resizeability.
        var resizeDiv = angular.element('<div class="resizeable"></div>');
        element.append(resizeDiv);

        var mouseDownPosX, mouseDownPosY, mouseDownHeight, mouseDownWidth, aspectRatio = null;

        function calculateNewSize(size) {
          var maxWidth = $window.innerWidth - element.offset().left - SAFETY_PAD;
          var maxHeight = $window.innerHeight - element.offset().top - SAFETY_PAD;

          var newWidth, newHeight;
          if (!keepAspectRatio) {
            newWidth = Math.min(size.initWidth + size.mouseOffsetX, maxWidth);
            newHeight = Math.min(size.initHeight + size.mouseOffsetY, maxHeight);
          } else {
            // don't grow bigger than maxWidth
            newWidth = Math.min(size.initWidth + size.mouseOffsetX, maxWidth);
            newHeight = newWidth * (size.initHeight / size.initWidth);
            // check for maxHeight and adjust if necessary
            if (newHeight > maxHeight) {
              newHeight = maxHeight;
              newWidth = newHeight * (size.initWidth / size.initHeight);
            }
          }

          return {
            "height": newHeight,
            "width": newWidth
          };
        }

        function mousedown(event) {
          event.stopPropagation();
          event.preventDefault();

          if (angular.isFunction(scope.onResizeBegin)) {
            scope.onResizeBegin();
          }

          mouseDownPosX = event.pageX;
          mouseDownPosY = event.pageY;

          mouseDownWidth = element.width();
          mouseDownHeight = element.height();
          if (aspectRatio === null) {
            aspectRatio = mouseDownWidth / mouseDownHeight;
          }

          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        }

        function mousemove(event) {
          var newSize = calculateNewSize({
            initWidth: mouseDownWidth,
            initHeight: mouseDownHeight,
            mouseOffsetX: event.pageX - mouseDownPosX,
            mouseOffsetY: event.pageY - mouseDownPosY
          });

          element.css("height", (newSize.height / window.innerHeight) * FRACTION_TO_PERCENTAGE + '%');
          element.css("width", (newSize.width / window.innerWidth) * FRACTION_TO_PERCENTAGE + '%');

          // guarantee aspect ratio in case of min-width / -height
          if (keepAspectRatio) {
            var currentWidth = element.width();
            var currentHeight = element.height();
            if ((currentWidth / currentHeight) < aspectRatio) {
              var correctedWidth = currentHeight * aspectRatio;
              element.css("width", correctedWidth + "px");
            } else if ((currentWidth / currentHeight) > aspectRatio) {
              var correctedHeight = currentWidth * (1 / aspectRatio);
              element.css("height", correctedHeight + "px");
            }
          }
        }

        function mouseup() {
          if (angular.isFunction(scope.onResizeEnd)) {
            scope.onResizeEnd();
          }

          $document.off('mousemove', mousemove);
          $document.off('mouseup', mouseup);
        }

        resizeDiv.on('mousedown', mousedown);
      }
    };
  }]);
}());
