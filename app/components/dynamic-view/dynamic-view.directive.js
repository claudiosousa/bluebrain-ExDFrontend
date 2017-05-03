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

/* global console: false */

(function () {
  'use strict';

  angular.module('dynamicViewModule', [])

    .directive('dynamicView', [
      '$compile',
      '$timeout',
      function($compile,
               $timeout) {
        return {

          templateUrl: 'components/dynamic-view/dynamic-view.template.html',
          restrict: 'E',
          scope: {},
          link: function(scope, element, attrs) {

            let getViewContainerElement = function(parentElement) {
              var childElements = parentElement.getElementsByTagName('*');
              for (var i = 0; i < childElements.length; i++) {
                if (childElements[i].hasAttribute('dynamic-view-container')) {
                  return childElements[i];
                }
              }
            };

            scope.setViewContent = function(content) {
              // trigger $destroy event before replacing and recompiling content
              // elements/directives set as content of this dynamic-view directive can de-initialize via
              // $scope.$on('$destroy', ...)
              if (angular.isDefined(scope.contentScope)) {
                scope.contentScope.$destroy();
              }

              // content container should exist
              if (!angular.isDefined(scope.viewContainer)) {
                console.warn('dynamicView.setViewContent() - viewContainer element not defined!');
                return;
              }

              // set and compile new content
              scope.viewContent = content;
              scope.viewContainer.innerHTML = scope.viewContent;
              scope.contentScope = scope.$new();
              $compile(scope.viewContainer)(scope.contentScope);
            };

            scope.setViewContentViaDirective = function(directiveName) {
              scope.setViewContent('<' + directiveName + '></' + directiveName + '>');
            };

            /* initialization */
            scope.viewContainer = getViewContainerElement(element[0]);

            if (angular.isDefined(attrs.dynamicViewDefaultDirective)) {
              // html example: <dynamic-view dynamic-view-default-directive="some-directive-name">
              scope.setViewContentViaDirective(attrs.dynamicViewDefaultDirective);
            }
          }
        };
      }
    ]);
}());
