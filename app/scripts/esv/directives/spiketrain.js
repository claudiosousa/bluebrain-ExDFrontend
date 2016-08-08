(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('spiketrain', ['$timeout', '$log', '$window', '$filter', 'roslib', 'stateService', 'STATE', 'RESET_TYPE', function ($timeout, $log, $window, $filter, roslib, stateService, STATE, RESET_TYPE) {

    function configureSpiketrain(scope, canvas1, canvas2, div) {
      scope.canvas = [canvas1, canvas2];
      scope.directiveDiv = div;
      scope.ctx = [scope.canvas[0].getContext("2d"), scope.canvas[1].getContext("2d")];
      scope.neuronYSize = 1;
      scope.currentCanvasIndex = 1;
      scope.xPosition = 0;
      var SECONDS_TO_MS_FACTOR = 1000;
      var MARK_INTERVAL = 2000; // time lapse (ms) between two consecutive time marks
      var TIMELABEL_SPACE = 15; // Vertical space in the canvas reserved for the time label

      scope.clearPlot = function() {
          scope.ctx[0].clearRect(0, 0, scope.canvas[0].width, scope.canvas[0].height);
          scope.ctx[1].clearRect(0, 0, scope.canvas[1].width, scope.canvas[1].height);
      };

      //clear spiketrain when resetting the simulation
      scope.resetListenerUnbindHandler = scope.$on('RESET', function(event, resetType) {
          if(resetType !== RESET_TYPE.RESET_CAMERA_VIEW) {
              scope.clearPlot();
          }
      });

      // clean up on leaving
      scope.$on("$destroy", function() {
        // unbind resetListener callback
        scope.resetListenerUnbindHandler();
      });
      scope.clearPlot();

      // Main functions, get called each time a spike message is received, It redraws the canvas.
      scope.onNewSpikesMessageReceived = function(message){
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

          scope.neuronYSize = Math.floor((currentCanvas.height - TIMELABEL_SPACE) / message.neuronCount) - 1;
          // Draw a time mark, i.e. a vertical red line segment, every MARK_INTERVAL ms
          if (Math.floor(message.simulationTime * SECONDS_TO_MS_FACTOR) % MARK_INTERVAL === 0) {
            currentContext.beginPath();
            currentContext.moveTo(scope.xPosition, 0);
            currentContext.lineTo(scope.xPosition, currentCanvas.height - TIMELABEL_SPACE);
            currentContext.strokeStyle = 'red';
            currentContext.stroke();
            var timeText = $filter('timeDDHHMMSS')(message.simulationTime);

            // Always align the text that it is within the canvas
            var timeTextWidth = currentContext.measureText(timeText).width;
            currentContext.textAlign = 'center';
            otherContext.textAlign = 'center';
            currentContext.fillStyle = 'red';
            otherContext.fillStyle = 'red';
            currentContext.fillText(timeText, scope.xPosition, currentCanvas.height);
            if (scope.xPosition - timeTextWidth / 2 < 0) {
              otherContext.fillText(timeText, otherCanvas.width + scope.xPosition, otherCanvas.height);
            } else if (scope.xPosition + timeTextWidth / 2 > currentCanvas.width){
              otherContext.fillText(timeText, scope.xPosition - otherCanvas.width, otherCanvas.height);
            }
          }

          // Draw the spikes to the current (right) canvas
          currentContext.strokeStyle = 'black';
          for (var i = 0; i < message.spikes.length; i = i + 1) {
            var yPosition = message.spikes[i].neuron * (scope.neuronYSize + 1); // One pixel space in between
            currentContext.beginPath();
            // In order to draw pure black lines, we need to shift the x position by 0.5. See
            // http://mzl.la/1NpjoBh for more info
            currentContext.moveTo(scope.xPosition + 0.5, yPosition);
            currentContext.lineTo(scope.xPosition + 0.5 , yPosition + (scope.neuronYSize - 1));
            currentContext.stroke();
          }

          // Shift the two canvases to the left.
          scope.xPosition += 1;
          otherCanvas.style.left = - scope.xPosition + 'px';
          currentCanvas.style.left = otherCanvas.width - scope.xPosition + 'px';
        }
      };

      // Unfortunately, this is mandatory. The canvas size can't be set to 100% of its container,
      scope.onScreenSizeChanged = function(){
        // Ignore zero width or height in order to prevent errors
        if(scope.directiveDiv.offsetWidth === 0 || scope.directiveDiv.offsetHeight === 0){
          return;
        }

        var canvas = scope.canvas[scope.currentCanvasIndex];

        // Ignore when there are no changes in the dimensions
        if(scope.directiveDiv.offsetWidth === canvas.width && scope.directiveDiv.offsetHeight === canvas.height){
          return;
        }

        // Resize the canvas accordingly
        canvas.width = scope.directiveDiv.offsetWidth;
        canvas.height = scope.directiveDiv.offsetHeight;
        canvas.style.left = canvas.width - scope.xPosition;

        var otherCanvas = 1 - scope.currentCanvasIndex;
        canvas = scope.canvas[otherCanvas];

        canvas.width = scope.directiveDiv.offsetWidth;
        canvas.height = scope.directiveDiv.offsetHeight;
        canvas.style.left = -scope.xPosition;
      };

      scope.onResizeBegin = function() {
        // Hide the canvas while we resize
        scope.canvas[0].style.visibility = 'hidden';
        scope.canvas[1].style.visibility = 'hidden';
      };

      scope.onResizeEnd = function() {
        // Show the canvas again after recalculating
        scope.onScreenSizeChanged();
        scope.canvas[0].style.visibility = 'visible';
        scope.canvas[1].style.visibility = 'visible';
      };

      // Draw a separator line to visualize that there is data missing during the closed state of the visualization
      scope.drawSeparator = function(){
        var otherCanvasIndex = 1 - scope.currentCanvasIndex;
        var currentContext = scope.ctx[scope.currentCanvasIndex];
        var otherContext = scope.ctx[otherCanvasIndex];
        var currentCanvas = scope.canvas[scope.currentCanvasIndex];
        var drawingAreaHeight = currentCanvas.height - TIMELABEL_SPACE;
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
        } else if (scope.xPosition + signWidth / 2 > drawingAreaWidth){
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
        if(angular.isUndefined(scope.server)) {
          $log.error('The server URL was not specified!');
        }

        if(angular.isUndefined(scope.topic)) {
          $log.error('The topic for the spikes was not specified!');
        }

        var firstTimeRun = true;
        var div = element[0].querySelector('#spiketrain-display');
        var canvas1 = element[0].querySelector('#spiketrain-canvas-1');
        var canvas2 = element[0].querySelector('#spiketrain-canvas-2');
        configureSpiketrain(scope, canvas1, canvas2, div);

        // When resizing the window, we have to take care of resizing the canvas
        angular.element($window).bind('resize', function() {
          if(scope.showSpikeTrain === true) {
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
      }
    };
  }]);
}());