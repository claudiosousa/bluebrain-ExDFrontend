(function() {
  'use strict';

  angular.module('jointPlotModule')
    .directive('jointPlot',
    ['$timeout',
      function($timeout) {
        return {
          templateUrl: 'components/joint-plot/joint-plot.template.html',
          restrict: 'E',
          scope: {
            ngShow: '=',
            close:'&closeFn'
          },
          controller: 'JoinPlotController',
          controllerAs: 'vm',
          link: function(scope, element, attrs) {

            scope.onResizeBegin = () => element.addClass('resizing');

            // the chart needs a bit of time to adjust its size
            scope.onResizeEnd = () => $timeout(() => element.removeClass('resizing'), 200);
          }
        };
      }
    ]);
}());
