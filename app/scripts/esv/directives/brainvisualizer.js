(function ()
{
  'use strict';
  /* global BRAIN3D: false */
  angular.module('exdFrontendApp')
    .directive('brainvisualizer', ['simulationConfigService', 'backendInterfaceService',
      function (simulationConfigService, backendInterfaceService)
      {
        return {
          templateUrl: 'views/esv/brainvisualizer.html',
          restrict: 'E',
          scope: {
            data: "="
          },
          link: function (scope, element, attrs)
          {
            var brain3D;
            var brainContainer = element.find('.esv-brainvisualizer-main');
            var parentScope = scope.$parent;

            scope.initializing = true;
            scope.minMaxClippingSliderValue = 0;
            scope.pointSizeSliderValue = 0;
            scope.populations = [];

            //------------------------------------------------
            // Init brain 3D visualizer when the panel is open

            scope.initBrainContainer = function (data)
            {
              brain3D = new BRAIN3D.MainView(brainContainer[0], data, 'img/brainvisualizer/brain3dball.png', 'img/brainvisualizer/brain3dballsimple256.png');

              // Update UI with default brain 3D visualizer

              scope.minMaxClippingSliderValue = [brain3D.min_render_dist, brain3D.max_render_dist];
              scope.pointSizeSliderValue = brain3D.ptsize;

              scope.initializing = false;
            };

            scope.initWithPopulations = function ()
            {
              backendInterfaceService.getBrain(function (response)
              {
                if (response.additional_populations)
                {
                  var popNames = Object.keys(response.additional_populations);
                  var data = { xyz: [100,0,0, // TEST VALUES FOR NOW
                                    -100,0,0,
                                    100,0,100,
                                    -100,0,100,
                                    0,0,100,
                                    0,0,-100,
                                    0,100,-100,
                                    0,100,100], populations: {} };

                  scope.populations = [];

                  for(var i in popNames)
                  {
                    if (popNames.hasOwnProperty(i))
                    {
                      var pop = popNames[i];

                      data.populations[pop] = response.additional_populations[pop];
                      data.populations[pop].color = 'hsl('+ (i/(popNames.length+1)*360.0) +',70%,80%)';
                      data.populations[pop].name = pop;
                      data.populations[pop].visible = true;

                      scope.populations.push(data.populations[pop]);
                    }
                  }

                  scope.initBrainContainer(data);
                }
              });
            };

            scope.initWithFile = function ()
            {
              var brainVisualizationDataExists = simulationConfigService.doesConfigFileExist('brainvisualizer');
              brainVisualizationDataExists.then(function (exists)
              {
                if (exists)
                {
                  simulationConfigService.loadConfigFile('brainvisualizer')
                    .then(function (file)
                    {
                      var brainVisualizerData = JSON.parse(file);
                      if (brainVisualizerData)
                      {
                        scope.initBrainContainer(brainVisualizerData);
                      }
                      else
                      {
                        scope.initWithPopulations();
                      }
                    })
                    .catch(function ()
                    {
                      scope.initWithPopulations();
                    });
                }
                else
                {
                  scope.initWithPopulations();
                }
              })
              .catch(function ()
              {
                scope.initWithPopulations();
              });
            };

            scope.togglePopulationVisibility = function(pop)
            {
              pop.visible = !pop.visible;
              brain3D.updatePopulationVisibility();
            };

            parentScope.$watch('showBrainvisualizerPanel', function ()
            {
              var visible = parentScope.showBrainvisualizerPanel;

              if (visible && !brain3D)
              {
                scope.initWithFile();
              }
              else if (brain3D)
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
} ());
