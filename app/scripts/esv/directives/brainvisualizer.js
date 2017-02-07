(function ()
{
  'use strict';
  /* global BRAIN3D: false */
  angular.module('exdFrontendApp')
    .directive('brainvisualizer', ['simulationConfigService', 'backendInterfaceService', 'RESET_TYPE',
      function (simulationConfigService, backendInterfaceService, RESET_TYPE)
      {
        return {
          templateUrl: 'views/esv/brainvisualizer.html',
          restrict: 'E',
          scope: {
            data: "="
          },
          link: function (scope, element)
          {
            var brain3D;
            var brainContainer = element.find('.esv-brainvisualizer-main');
            var parentScope = scope.$parent;

            scope.initializing = true;
            scope.minMaxClippingSliderValue = 0;
            scope.pointSizeSliderValue = 0;
            scope.populations = [];
            scope.shapes = [BRAIN3D.REP_SHAPE_SPHERICAL, BRAIN3D.REP_SHAPE_CUBIC, BRAIN3D.REP_SHAPE_FLAT, BRAIN3D.REP_SHAPE_CLOUD];
            scope.currentShape = BRAIN3D.REP_SHAPE_SPHERICAL;
            scope.distributions = [BRAIN3D.REP_DISTRIBUTION_OVERLAP, BRAIN3D.REP_DISTRIBUTION_DISTRIBUTE, BRAIN3D.REP_DISTRIBUTION_SPLIT];
            scope.currentDistribution = BRAIN3D.REP_DISTRIBUTION_OVERLAP;

            //------------------------------------------------
            // Init brain 3D visualizer when the panel is open

            scope.initBrainContainer = function (data)
            {
              if (brain3D)
              {
                brain3D.updateData(data);
              }
              else
              {
                brain3D = new BRAIN3D.MainView(brainContainer[0], data, 'img/brainvisualizer/brain3dballsimple256.png');

                // Update UI with default brain 3D visualizer

                scope.minMaxClippingSliderValue = [brain3D.minRenderDist, brain3D.maxRenderDist];
                scope.pointSizeSliderValue = brain3D.ptsize;
              }

              scope.initializing = false;
            };

            scope.initWithPopulations = function ()
            {
              backendInterfaceService.getBrain(function (response)
              {
                if (response.additional_populations)
                {
                  var popNames = Object.keys(response.additional_populations);
                  var data = { populations: {} };

                  scope.populations = [];

                  for (var i in popNames)
                  {
                    if (popNames.hasOwnProperty(i))
                    {
                      var newPop = {};
                      var pop = response.additional_populations[popNames[i]];
                      if (Object.prototype.toString.call(pop) === '[object Array]')
                      {
                        newPop.list = pop;
                      }
                      else
                      {
                        newPop.from = pop.from;
                        newPop.step = pop.step;
                        newPop.to = pop.to;
                      }

                      newPop.color = 'hsl(' + (i / (popNames.length + 1) * 360.0) + ',70%,80%)';
                      newPop.name = popNames[i];
                      newPop.visible = true;

                      scope.populations.push(newPop);
                      data.populations[popNames[i]] = newPop;
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

            scope.togglePopulationVisibility = function (pop)
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

            scope.update = function ()
            {
              if (brain3D)
              {
                scope.initializing = true;
                scope.initWithFile();
              }
            };

            scope.setShape = function (shape)
            {
              if (brain3D)
              {
                scope.currentShape = shape;
                brain3D.setShape(shape);
              }
            };

            scope.setDistribution = function (distribution)
            {
              if (brain3D)
              {
                scope.currentDistribution = distribution;
                brain3D.setDistribution(distribution);
              }
            };

            scope.$on('RESET', function (event, resetType)
            {
              if (resetType === RESET_TYPE.RESET_FULL || resetType === RESET_TYPE.RESET_BRAIN)
              {
                scope.update();
              }
            });

            // Population changed update
            scope.$on("pynn.populationsChanged", function ()
            {
              scope.update();
            });

            // Clean up on leaving
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
