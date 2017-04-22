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
(function () {
  'use strict';
  angular.module('exdFrontendApp')
    .constant('MAX_PANEL_ZINDEX', 400)//panels z-index start at this value and go
    .directive('showOnTop', ['MAX_PANEL_ZINDEX',
      function (MAX_PANEL_ZINDEX) {
        var panels = []; //panels beeing managed by the 'showOnTop' directive

        function registerPanel(panel) {
          panels.push(panel);
        }

        function removePanel(panel) {
          panels.splice(panels.indexOf(panel), 1);
        }

        function putPanelOnTop(panel) {
          //panel is already on top
          if (panel.is(panels[panels.length - 1]))
            return;


          //move that panel to the top of the panel stack
          var previousIndex = panels.indexOf(panel);
          panels.splice(previousIndex, 1);
          panels.push(panel);

          //refresh panels z-index so they match the order on the stack
          for (var i = panels.length - 1; i >= previousIndex; i--)
            panels[i].css('z-index', MAX_PANEL_ZINDEX - panels.length + 1 + i);

        }

        return {
          restrict: 'A',
          link: function (scope, element, attrs) {
            if (!attrs.ngShow)
              throw 'Directive \'show-on-top\' requires a ng-show to exist in the same element';

            registerPanel(element);

            scope.$watch(attrs.ngShow, function (visible) {
              visible && putPanelOnTop(element);
            });

            var putCurrentElementOnTop = function () { putPanelOnTop(element); };

            element.click(putCurrentElementOnTop);
            element[0].addEventListener('mousedown', putCurrentElementOnTop, true);

            scope.$on('$destroy', function () {
              element[0].removeEventListener('mousedown', putCurrentElementOnTop, true);
              removePanel(element);
            });
          }
        };
      }
    ]);
} ());
