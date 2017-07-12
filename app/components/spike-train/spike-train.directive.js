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
(function() {
  'use strict';

  angular.module('spikeTrainModule')
    .directive('spikeTrain', ['$interval', 'editorToolbarService', 'RESET_TYPE',
    ($interval, editorToolbarService, RESET_TYPE) => {

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

          scope.editorToolbarService = editorToolbarService;
          const canvas = scope.vm.drawingCanvas = element.find('canvas')[0];

          /**
           * Returns whether the size could been calculated
           */
          let calculateCanvas = () => {
            const parent = canvas.parentNode;
            if (!parent.clientHeight)
              return false;

            canvas.setAttribute('height', parent.clientHeight - 6);//margin to avoid parasite scrollbar
            canvas.setAttribute('width', parent.clientWidth);

            scope.vm.calculateCanvasSize();
            scope.vm.redraw();
            return true;
          };

          scope.onResizeEnd = calculateCanvas;

          //ensures that redraw only happens after window resizing stoped for some time
          angular.element(window).on('resize.spiketrain', _.debounce(scope.onResizeEnd, 300));

          scope.$watch('editorToolbarService.showSpikeTrain', visible => {
            if (visible) {
              scope.vm.startSpikeDisplay();
              //will try to render the canvas until it is visible
              let checkForVisibility = $interval(() => calculateCanvas() && $interval.cancel(checkForVisibility), 30);
            } else
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

          scope.close = () =>
          {
            editorToolbarService.showSpikeTrain = false;
          };
        }
      };
    }]);
}());
