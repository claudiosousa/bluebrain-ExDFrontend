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

  angular.module('helpTooltipModule')
    .directive('helpTooltip', ['helpTooltipService', (helpTooltipService) => {
      const SELECTED_STYLE = 'toolbar-help-highlighted';

      return {
        restrict: 'A',
        compile: () => {
          return {
            pre: (scope, element, attrs) => {

              element.on('click', (e) => {
                if (helpTooltipService.visible) {
                  helpTooltipService.display(attrs.helpTooltip);
                  e.stopImmediatePropagation();
                }
              });

              scope.helpTooltipService = helpTooltipService;
              scope.$watch('helpTooltipService.helpCode', (now, previous) => {
                if (now === attrs.helpTooltip)
                  element.addClass(SELECTED_STYLE);
                else if (previous === attrs.helpTooltip)
                  element.removeClass(SELECTED_STYLE);
              });

              scope.$on('$destroy', ()=> element.off('click'));
            }
          };
        }
      };
    }]);
}());
