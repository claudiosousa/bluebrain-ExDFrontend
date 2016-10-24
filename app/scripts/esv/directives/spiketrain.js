(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .constant('SPIKE_TIMELABEL_SPACE', 15)// Vertical space in the canvas reserved for the time label
    .directive('spiketrain',
    ['$timeout', '$log', '$window', '$filter', '$document', 'roslib', 'stateService', 'STATE', 'RESET_TYPE', 'SPIKE_TIMELABEL_SPACE',
      function ($timeout, $log, $window, $filter, $document, roslib, stateService, STATE, RESET_TYPE, SPIKE_TIMELABEL_SPACE) {
        function configureSpiketrain(scope, canvas1, canvas2, directiveDiv, splikeContainer) {
          scope.canvas = [canvas1, canvas2];
          scope.directiveDiv = directiveDiv;
          scope.splikeContainer = splikeContainer;
          scope.ctx = [scope.canvas[0].getContext("2d"), scope.canvas[1].getContext("2d")];
          scope.neuronYSize = 1;
          scope.currentCanvasIndex = 1;
          scope.xPosition = 0;
          var SECONDS_TO_MS_FACTOR = 1000;
          var MARK_INTERVAL = 2000; // time lapse (ms) between two consecutive time marks
          var MIN_NEURO_HEIGHT = 1; // minimal heuron height (>=1)

          scope.clearPlot = function () {
            scope.ctx[0].clearRect(0, 0, scope.canvas[0].width, scope.canvas[0].height);
            scope.ctx[1].clearRect(0, 0, scope.canvas[1].width, scope.canvas[1].height);
          };

          //clear spiketrain when resetting the simulation
          scope.resetListenerUnbindHandler = scope.$on('RESET', function (event, resetType) {
            if (resetType !== RESET_TYPE.RESET_CAMERA_VIEW) {
              scope.clearPlot();
            }
          });

          // clean up on leaving
          scope.$on("$destroy", function () {
            // unbind resetListener callback
            scope.resetListenerUnbindHandler();
          });
          scope.clearPlot();

          var fontSize = Number(scope.ctx[0].font.split('px')[0]);

          // Keeps messages to redraw spikes when spike monitor is resized
          var messages = [];

          // Called each time a spike message is received
          scope.onNewSpikesMessageReceived = function (message) {
            messages.push(message);
            // How many messages are not needed
            var d = messages.length - $(document).width();
            if (d > 0) {
              // Remove them
              messages.splice(0, d);
            }
            plotSingleMessageSpikes(message);
          };

          // Plots spikes from a message
          function plotSingleMessageSpikes(message) {
            if (angular.isDefined(message) && angular.isDefined(message.spikes) && angular.isDefined(message.neuronCount)) {
              // If the left canvas is out of the parent div, append it to the right of the other canvas
              if (scope.xPosition >= scope.canvas[scope.currentCanvasIndex].width) {
                scope.xPosition = 0;
                // Toggle between the two canvas
                scope.currentCanvasIndex = 1 - scope.currentCanvasIndex;
                // Clear the current canvas
                scope.ctx[scope.currentCanvasIndex].clearRect(0, 0, scope.canvas[scope.currentCanvasIndex].width, scope.canvas[scope.currentCanvasIndex].height);
              }

              var otherCanvasIndex = 1 - scope.currentCanvasIndex;
              var currentContext = scope.ctx[scope.currentCanvasIndex];
              var otherContext = scope.ctx[otherCanvasIndex];
              var currentCanvas = scope.canvas[scope.currentCanvasIndex];
              var otherCanvas = scope.canvas[otherCanvasIndex];
              if (nbNeuronsShown !== message.neuronCount) {
                nbNeuronsShown = message.neuronCount;
                calculateCanvasHeight();
              }

              scope.neuronYSize = Math.floor((currentCanvas.height - SPIKE_TIMELABEL_SPACE * 2) / message.neuronCount) - 1;
              // Draw a time mark, i.e. a vertical red line segment, every MARK_INTERVAL ms
              if (Math.floor(message.simulationTime * SECONDS_TO_MS_FACTOR) % MARK_INTERVAL === 0) {
                currentContext.beginPath();
                currentContext.moveTo(scope.xPosition, SPIKE_TIMELABEL_SPACE);
                currentContext.lineTo(scope.xPosition, currentCanvas.height - SPIKE_TIMELABEL_SPACE);
                currentContext.strokeStyle = 'red';
                currentContext.stroke();
                var timeText = $filter('timeDDHHMMSS')(message.simulationTime);

                // Always align the text that it is within the canvas
                // draw time stamp at top and bottom of the canvas
                [currentCanvas.height, fontSize].forEach(function (y) {
                  var timeTextWidth = currentContext.measureText(timeText).width;
                  currentContext.textAlign = 'center';
                  otherContext.textAlign = 'center';
                  currentContext.fillStyle = 'red';
                  otherContext.fillStyle = 'red';
                  currentContext.fillText(timeText, scope.xPosition, y);
                  if (scope.xPosition - timeTextWidth / 2 < 0) {
                    otherContext.fillText(timeText, otherCanvas.width + scope.xPosition, y);
                  } else if (scope.xPosition + timeTextWidth / 2 > currentCanvas.width) {
                    otherContext.fillText(timeText, scope.xPosition - otherCanvas.width, y);
                  }
                });
              }

              // Draw the spikes to the current (right) canvas
              currentContext.strokeStyle = 'black';
              for (var i = 0; i < message.spikes.length; i = i + 1) {
                var yPosition = message.spikes[i].neuron * (scope.neuronYSize + 1) + SPIKE_TIMELABEL_SPACE; // One pixel space in between
                currentContext.beginPath();
                // In order to draw pure black lines, we need to shift the x position by 0.5. See
                // http://mzl.la/1NpjoBh for more info
                currentContext.moveTo(scope.xPosition + 0.5, yPosition);
                currentContext.lineTo(scope.xPosition + 0.5, yPosition + scope.neuronYSize);
                currentContext.stroke();
              }

              // Shift the two canvases to the left.
              scope.xPosition += 1;
              otherCanvas.style.left = - scope.xPosition + 'px';
              currentCanvas.style.left = otherCanvas.width - scope.xPosition + 'px';
            }
          }

          // Unfortunately, this is mandatory. The canvas size can't be set to 100% of its container,
          var previousSize = { height: 0, width: 0 };
          scope.onScreenSizeChanged = function () {
            if (previousSize.height !== scope.splikeContainer.offsetHeight || previousSize.width !== scope.splikeContainer.offsetWidth) {
              calculateCanvasHeight();
              previousSize.height = scope.splikeContainer.offsetHeight;
              previousSize.width = scope.splikeContainer.offsetWidth;
            }

            // Draw spikes on refreshed canvas
            for (var i = 0; i < messages.length; i = i + 1) {
              plotSingleMessageSpikes(messages[i]);
            }
          };

          var nbNeuronsShown = 0;
          function calculateCanvasHeight() {
            // Ignore zero width or height in order to prevent errors
            if (scope.directiveDiv.offsetWidth === 0 || scope.directiveDiv.offsetHeight === 0) {
              return;
            }

            var currentCanvas = scope.canvas[scope.currentCanvasIndex];

            var requiredHeight = Math.max(scope.directiveDiv.offsetHeight, nbNeuronsShown * (MIN_NEURO_HEIGHT + 1) + 2 * SPIKE_TIMELABEL_SPACE);
            if (scope.splikeContainer.offsetHeight === requiredHeight && scope.splikeContainer.offsetWidth === currentCanvas.width) {
              return;
            }

            scope.splikeContainer.style.height = requiredHeight + 'px';

            scope.canvas.forEach(function (canvas) {
              canvas.height = requiredHeight;
              canvas.width = scope.splikeContainer.offsetWidth;
            });

            // Resize the canvas accordingly
            currentCanvas.style.left = currentCanvas.width - scope.xPosition;

            var otherCanvas = scope.canvas[1 - scope.currentCanvasIndex];
            otherCanvas.style.left = -scope.xPosition;
          }

          scope.onResizeEnd = function () {
            // Redraw spikes on changed canvas
            scope.onScreenSizeChanged();
          };

          // Draw a separator line to visualize that there is data missing during the closed state of the visualization
          scope.drawSeparator = function () {
            var otherCanvasIndex = 1 - scope.currentCanvasIndex;
            var currentContext = scope.ctx[scope.currentCanvasIndex];
            var otherContext = scope.ctx[otherCanvasIndex];
            var currentCanvas = scope.canvas[scope.currentCanvasIndex];
            var drawingAreaHeight = currentCanvas.height - SPIKE_TIMELABEL_SPACE;
            var drawingAreaWidth = currentCanvas.width;

            // Draw vertical separation line
            currentContext.beginPath();
            currentContext.moveTo(scope.xPosition, 0);
            currentContext.lineTo(scope.xPosition, drawingAreaHeight);
            currentContext.strokeStyle = 'black';
            currentContext.stroke();

            // Draw double ~ sign
            var sign = "\u2248";
            var signWidth = currentContext.measureText(sign).width;
            currentContext.textAlign = 'center';
            otherContext.textAlign = 'center';
            var savedFont = currentContext.font;
            currentContext.font = '30px sans-serif';
            otherContext.font = '30px sans-serif';
            currentContext.fillStyle = 'black';
            otherContext.fillStyle = 'black';
            var yPosition = (drawingAreaHeight + 30) / 2; // Take text height of 30px into account
            currentContext.fillText(sign, scope.xPosition, yPosition);
            if (scope.xPosition - signWidth / 2 < 0) {
              otherContext.fillText(sign, drawingAreaWidth + scope.xPosition, yPosition);
            } else if (scope.xPosition + signWidth / 2 > drawingAreaWidth) {
              otherContext.fillText(sign, scope.xPosition - drawingAreaWidth, yPosition);
            }
            currentContext.font = savedFont;
            otherContext.font = savedFont;
          };

          // Subscribe to the ROS topic
          scope.startSpikeDisplay = function (firstTimeRun) {
            var rosConnection = roslib.getOrCreateConnectionTo(scope.server);
            scope.spikeTopicSubscriber = scope.spikeTopicSubscriber || roslib.createTopic(rosConnection, scope.topic, 'cle_ros_msgs/SpikeEvent');
            scope.spikeTopicSubscriber.subscribe(scope.onNewSpikesMessageReceived);
            if (firstTimeRun === false) {
              scope.drawSeparator();
            }
          };

          // Unsubscribe to the ROS topic
          scope.stopSpikeDisplay = function () {
            if (scope.spikeTopicSubscriber) {
              // One has to be careful here: it is not sufficient to only call unsubscribe but you have to
              // put in the function as an argument, otherwise your function will be called twice!
              scope.spikeTopicSubscriber.unsubscribe(scope.onNewSpikesMessageReceived);
            }
          };
        }

        /*
        Prevents mousemove events occuring in the spike chart scrollbar from bubbling up.
        If bubbling is not prevented, then the 'movable' directive on the parent will catch
        the user dragging the scroll handle and will  move the popup around
        thus preventing the intended user scroll
        */
        function preventScrollbarEventsBubbling(display) {
          $(display).on('mousedown.spiketrain touchstart.spiketrain', function (event) {
            if (event.target.clientWidth < event.offsetX) {
              //if the mouse down IN the display occuret OUTSIDE (at the right) of the display
              //then we are in the scrollbar. (technically it belongs to the display, but it is outside of its boundaries)
              // we then capture all the following mousemove events until the mouse is released
              $(display).on('mousemove.spiketrain_down touchmove.spiketrain_down', function (event) {
                event.preventDefault();
                event.stopPropagation();
              });
              $document.on('mouseup.spiketrain_down touchend.spiketrain_down', function () {
                $document.off('.spiketrain_down');
                $(display).off('.spiketrain_down');
              });
            }
          });
        }

        return {
          templateUrl: 'views/esv/spiketrain.html',
          restrict: 'E',
          replace: true,
          scope: {
            server: '@',
            topic: '@',
            // see https://github.com/angular/angular.js/issues/2500
            ngShow: '=',
            closeWidget: '&'
          },
          link: function (scope, element, attrs) {
            if (angular.isUndefined(scope.server)) {
              $log.error('The server URL was not specified!');
            }

            if (angular.isUndefined(scope.topic)) {
              $log.error('The topic for the spikes was not specified!');
            }

            var firstTimeRun = true;
            var display = element[0].querySelector('#spiketrain-display');
            var container = element[0].querySelector('#spiketrain-container');
            var canvas1 = element[0].querySelector('#spiketrain-canvas-1');
            var canvas2 = element[0].querySelector('#spiketrain-canvas-2');

            preventScrollbarEventsBubbling(display);
            configureSpiketrain(scope, canvas1, canvas2, display, container);

            // When resizing the window, we have to take care of resizing the canvas
            angular.element($window).on('resize.spiketrain', function () {
              if (scope.showSpikeTrain === true) {
                // asynchronous recomputation of the size
                $timeout(scope.onScreenSizeChanged, 0);
              }
            });

            // When starting to display (or hide) the canvas, we need to subscribe (or unsubscribe) to the
            // ROS topic.
            if (attrs.hasOwnProperty('ngShow')) {
              scope.$watch("ngShow", function (visible) {
                if (visible) {
                  element.show();
                  scope.startSpikeDisplay(firstTimeRun);
                  firstTimeRun = false;
                  // asynchronous recomputation of the size
                  $timeout(scope.onScreenSizeChanged, 0);
                }
                else {
                  element.hide();
                  scope.stopSpikeDisplay();
                }
              });
            }

            scope.$on('$destroy', function () {
              angular.element($window).off('resize.spiketrain');
              $(display).off('.spiketrain .spiketrain_down');
            });
          }
        };
      }]);
} ());
