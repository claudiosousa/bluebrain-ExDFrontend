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

  angular.module('exdFrontendApp')
    .directive('randomizeInitialPosition', () => ({
      restrict: 'A',
      compile: () => ({
        pre: (scope, element) => element.css('visibility', 'hidden'),
        post: (scope, element, attrs) => _.defer(() => {
          const MARGIN = .05;//margin in respect to the parent's width

          const elementDom = element[0];
          let parentDom;
          const parentElementSelector = scope.$eval(attrs.randomPositionParentSelector);
          if (parentElementSelector) {
            parentDom = element.parents(parentElementSelector)[0];
          } else {
            parentDom = element.parent()[0];
          }

          let getRandomDimension = prop => (MARGIN + Math.random() * (1 - 2 * MARGIN)) * (parentDom[prop] - elementDom[prop]);

          element.css('left', getRandomDimension('clientWidth'));
          element.css('top', getRandomDimension('clientHeight'));
          element.css('visibility', 'initial');
        })
      }),
    }));
}());
