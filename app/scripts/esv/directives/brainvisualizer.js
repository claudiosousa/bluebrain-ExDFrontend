(function () {
  'use strict';
  /* global BRAIN3D: false */
  angular.module('exdFrontendApp')
    .directive('brainvisualizer', [
      function () {
        return {
          templateUrl: 'views/esv/brainvisualizer.html',
          restrict: 'E',
          scope:true,
          link:function(scope, element, attrs)
          {
            var brain3D;
            var brainContainer = element.find('.esv-brainvisualizer-main');

            //----------------------------------------------
            // Init brain 3D visualizer when the panel is open

            scope.$watch('showBrainvisualizerPanel', function ()
            {
              var visible = scope.showBrainvisualizerPanel;

              if (visible && brain3D === undefined)
              {
                brain3D = new BRAIN3D.MainView(brainContainer[0], BRAIN3D.embeddedData, 'img/brainvisualizer/brain3dball.png', 'img/brainvisualizer/brain3dballsimple.png');

                // Update UI with default brain 3D visualizer

                scope.minMaxClippingSliderValue = [brain3D.min_render_dist, brain3D.max_render_dist];
                scope.pointSizeSliderValue = brain3D.ptsize;

              }

              if (brain3D !== undefined)
              {
                brain3D.setPaused(!visible);
              }

            });

          }
        };
      }
    ]);
}());
