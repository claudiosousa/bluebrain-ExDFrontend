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
        var SAFETY_PAD = 4;

        // The little handle that the user drags around for resizing. It will be appended to the element that
        // should be resizeable and is only visible through a small image that visually indicates its resizeability.
        var resizeDiv = angular.element('<div class="resizeable"></div>');
        element.append(resizeDiv);

        var currentX, currentY, currentHeight, currentWidth;

        function calculateNewSize(size) {
          var newWidth = size.currWidth;
          var newHeight = size.currHeight;

          // We already calculate the new sizes, but we do not yet apply them since in case we have to preserve
          // the aspect ratio we have to check first if we are still within the viewport. If we are outside the
          // viewport we will get scrollbars – which we want to avoid.
          var preliminaryNewWidth = size.currWidth + size.offsetX;
          var preliminaryNewHeight = size.currHeight + size.offsetY;

          if (!keepAspectRatio) {
            newWidth = preliminaryNewWidth;
            newHeight = preliminaryNewHeight;
          } else {
            // In case we want to keep the aspect ratio, we adapt either the height or the width
            if (Math.abs(size.offsetX) > Math.abs(size.offsetY)) {
              preliminaryNewHeight = preliminaryNewWidth * (size.currHeight / size.currWidth);
            } else {
              preliminaryNewWidth = preliminaryNewHeight * (size.currWidth / size.currHeight);
            }

            // Only apply changes if we are inside the viewport after applying the keep-aspect-ratio-scaling
            var isTooHigh = element.offset().top + preliminaryNewHeight > ($window.innerHeight - SAFETY_PAD);
            var isTooWide = element.offset().left + preliminaryNewWidth > ($window.innerWidth - SAFETY_PAD);

            if (!isTooHigh && !isTooWide) {
              newWidth = preliminaryNewWidth;
              newHeight = preliminaryNewHeight;
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

          currentX = event.pageX;
          currentY = event.pageY;

          currentHeight = element.height();
          currentWidth = element.width();

          function mouseup() {
            if (angular.isFunction(scope.onResizeEnd)) {
              scope.onResizeEnd();
            }
            $document.off('mousemove', mousemove);
            $document.off('mouseup', mouseup);
          }

          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        }

        function mousemove(event) {
          // Don't let the resizing happen outside the viewport.
          // We also introduce a small "safety pad" in order to prevent the scrollbars from appearing.
          var adjustedPageX = (event.pageX >= ($window.innerWidth - SAFETY_PAD)) ? ($window.innerWidth - SAFETY_PAD) : event.pageX;
          var adjustedPageY = (event.pageY >= ($window.innerHeight - SAFETY_PAD)) ? ($window.innerHeight - SAFETY_PAD) : event.pageY;

          var newSize = calculateNewSize({
            "currHeight": currentHeight,
            "currWidth": currentWidth,
            "offsetX": adjustedPageX - currentX,
            "offsetY": adjustedPageY - currentY
          });

          element.css("height", newSize.height + "px");
          element.css("width", newSize.width + "px");

          // Adjust all non local variables.
          currentHeight = newSize.height;
          currentWidth = newSize.width;
          currentX = adjustedPageX;
          currentY = adjustedPageY;
        }

        resizeDiv.on('mousedown', mousedown);
      }
    };
  }]);
}());
