/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END**/

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
        var keepAspectRatio = element[0].getAttribute('keep-aspect-ratio');

        // This amount of pixels is used in order to avoid scrollbars to appear on the right / on the bottom.
        var SAFETY_PAD = 10;
        // just to get from e.g. 0.41 to 41 for css percentage values
        var FRACTION_TO_PERCENTAGE = 100;

        // The little handle that the user drags around for resizing. It will be appended to the element that
        // should be resizeable and is only visible through a small image that visually indicates its resizeability.
        var resizeDiv = angular.element('<div class="resizeable"></div>');
        element.append(resizeDiv);
        resizeDiv.on('mousedown', mousedown);
        scope.$watch(
          function() { return element.attr('resizeable') === 'true'; },
          (newValue) => {
            if (newValue === true) {
              resizeDiv[0].style.visibility = 'visible';
            } else {
              resizeDiv[0].style.visibility = 'hidden';
            }
          },
          true
        );

        var mouseDownPosX, mouseDownPosY, mouseDownHeight, mouseDownWidth, aspectRatio = null;

        function calculateNewSize(size) {
          var maxWidth = $window.innerWidth - element.offset().left - SAFETY_PAD;
          var maxHeight = $window.innerHeight - element.offset().top - SAFETY_PAD;

          var newWidth, newHeight;
          if (keepAspectRatio === null) {
            // no attribute 'keep-aspect-ratio'
            newWidth = Math.min(size.initWidth + size.mouseOffsetX, maxWidth);
            newHeight = Math.min(size.initHeight + size.mouseOffsetY, maxHeight);
          } else {
            let aspectRatio = parseFloat(keepAspectRatio);
            // don't grow bigger than maxWidth
            newWidth = Math.min(size.initWidth + size.mouseOffsetX, maxWidth);
            newHeight = newWidth / aspectRatio;
            // check for maxHeight and adjust if necessary
            if (newHeight > maxHeight) {
              newHeight = maxHeight;
              newWidth = newHeight * aspectRatio;
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

          keepAspectRatio = element[0].getAttribute('keep-aspect-ratio');

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
          if (angular.isDefined(attrs.keepAspectRatio)) {
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
      }
    };
  }]);
}());
