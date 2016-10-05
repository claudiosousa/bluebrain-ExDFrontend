(function () {
  'use strict';
  angular.module('exdFrontendApp')
    .constant('MAX_PANEL_ZINDEX', 1020)//panels z-index start at this value and go
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
