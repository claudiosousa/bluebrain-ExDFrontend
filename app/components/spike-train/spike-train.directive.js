/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
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
 * ---LICENSE-END **/
(function() {
  'use strict';

  angular.module('spikeTrainModule')
    .directive('spikeTrain', ['$timeout', 'RESET_TYPE', ($timeout, RESET_TYPE) => {

      return {
        templateUrl: 'components/spike-train/spike-train.template.html',
        restrict: 'E',
        scope: {
          visible: '=ngShow',
          close: '&closeFn'
        },
        controller: 'SpikeTrainController',
        controllerAs: 'vm',
        link: function(scope, element, attrs) {

          const canvas = scope.vm.drawingCanvas = element.find('canvas')[0];

          let calculateCanvas = () => {
            const parent = canvas.parentNode;
            canvas.setAttribute('height', parent.clientHeight - 6);//margin to avoid parasite scrollbar
            canvas.setAttribute('width', parent.clientWidth);

            scope.vm.calculateCanvasSize();
            scope.vm.redraw();
          };

          scope.onResizeEnd = calculateCanvas;

          //ensures that redraw only happens after window resizing stoped for some time
          angular.element(window).on('resize.spiketrain', _.debounce(scope.onResizeEnd, 300));

          scope.$watch('visible', visible => {
            if (visible)
              $timeout(() => {
                scope.vm.startSpikeDisplay();
                calculateCanvas();
              }, 30);//wait for the container to be visible
            else
              scope.vm.stopSpikeDisplay();
          });

          scope.$on('RESET', (event, resetType) => {
            if (resetType !== RESET_TYPE.RESET_CAMERA_VIEW)
              scope.vm.clearPlot();
          });

          scope.$on('$destroy', () => {
            scope.vm.stopSpikeDisplay();
            angular.element(window).off('resize.spiketrain');
          });
        }
      };
    }]);
}());
