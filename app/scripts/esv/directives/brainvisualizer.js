(function () {
  'use strict';
  /* global BRAIN3D: false */
  angular.module('exdFrontendApp')
    .directive('brainvisualizer', [
      function () {
        return {
          templateUrl: 'views/esv/brainvisualizer.html',
          restrict: 'E',
          scope: {
            data: "="
          },
                    link:function(scope, element, attrs)
          {
            var brain3D;
            var brainContainer = element.find('.esv-brainvisualizer-main');

            var parentScope = scope.$parent;
            //----------------------------------------------
            // Init brain 3D visualizer when the panel is open

            parentScope.$watch('showBrainvisualizerPanel', function ()
            {
              var visible = parentScope.showBrainvisualizerPanel;

              if (visible && brain3D === undefined)
              {
                brain3D = new BRAIN3D.MainView(brainContainer[0], scope.data, 'img/brainvisualizer/brain3dball.png', 'img/brainvisualizer/brain3dballsimple.png');

                // Update UI with default brain 3D visualizer

                scope.minMaxClippingSliderValue = [brain3D.min_render_dist, brain3D.max_render_dist];
                scope.pointSizeSliderValue = brain3D.ptsize;

              }

              if (brain3D !== undefined)
              {
                brain3D.setPaused(!visible);
              }

            });

            // clean up on leaving
            scope.$on("$destroy", function ()
            {
              if (brain3D !== undefined)
              {
                brain3D.terminate();
              }
            });
          }
        };
      }
    ]);
}());
