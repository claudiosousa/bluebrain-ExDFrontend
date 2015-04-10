(function () {
  'use strict';

  function configureSpiketrain(roslib, scope, $filter, canvas1, canvas2, div) {
    scope.canvas = [canvas1, canvas2];
    scope.directiveDiv = div;
    scope.ctx = [scope.canvas[0].getContext("2d"), scope.canvas[1].getContext("2d")];
    scope.neuronYSize = 1;
    scope.currentCanvasIndex = 1;
    scope.xPosition = 0;
    var SECONDS_TO_MS_FACTOR = 1000;
    var MARK_INTERVAL = 1000; // time lapse (ms) between two consecutive time marks
    var TIMELABEL_SPACE = 15; // Vertical space in the canvas reserved for the time label

    scope.ctx[0].clearRect(0, 0, scope.canvas[0].width, scope.canvas[0].height);
    scope.ctx[1].clearRect(0, 0, scope.canvas[1].width, scope.canvas[1].height);

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
          currentContext.moveTo(scope.xPosition, yPosition);
          currentContext.lineTo(scope.xPosition, yPosition + (scope.neuronYSize - 1));
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
      // In order to have a smooth transition, we take a snapshot of what is currently drawn.
      // A few lines after, we redraw that to the new position (since the size did change)
      var canvas = scope.canvas[scope.currentCanvasIndex];
      var context = scope.ctx[scope.currentCanvasIndex];

      var canvasData = context.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = scope.directiveDiv.offsetWidth;
      canvas.height = scope.directiveDiv.offsetHeight;
      canvas.style.left = canvas.width - scope.xPosition;
      context.putImageData(canvasData, 0, 0);

      var otherCanvas = 1 - scope.currentCanvasIndex;
      canvas = scope.canvas[otherCanvas];
      context = scope.ctx[otherCanvas];
      var oldWidth = scope.canvas[otherCanvas].width;

      canvasData = context.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = scope.directiveDiv.offsetWidth;
      canvas.height = scope.directiveDiv.offsetHeight;
      canvas.style.left = -scope.xPosition;
      context.putImageData(canvasData, canvas.width - oldWidth, 0);
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

  angular.module('exdFrontendApp').directive('spiketrain', ['$log', '$window', '$filter', 'roslib', function ($log, $window, $filter, roslib) {
    return {
      template: '<div class="spikegraph"><div class="leftaxis"><div class="arrow"><p class="legend">NeuronID</p></div></div><div class="spiketrain"><canvas></canvas><canvas></canvas></div></div>',
      restrict: 'E',
      replace: true,
      //Todo: Should have isolated (own) scope
      link: function (scope, element, attrs) {
        if(angular.isUndefined(attrs.server)) {
          $log.error('The server URL was not specified!');
        }

        if(angular.isUndefined(attrs.topic)) {
          $log.error('The topic for the spikes was not specified!');
        }

        scope.server = attrs.server;
        scope.topic = attrs.topic;

        var firstTimeRun = true;
        var div = element[0].childNodes[1];
        configureSpiketrain(roslib, scope, $filter, div.childNodes[0], div.childNodes[1], div);

        // When resizing the window, we have to take care of resizing the canvas
        angular.element($window).bind('resize', function() {
          scope.onScreenSizeChanged();
        });

        // When displaying the canvas, we need to resize it !
        scope.getDisplayed = function () {
          return element.css('display');
        };
        scope.$watch(scope.getDisplayed, function(display) {
          if (display === 'block')
          {
            scope.onScreenSizeChanged();
          }
        });

        // When starting to display (or hide) the canvas, we need to subscribe (or unsubscribe) to the
        // ROS topic.
        scope.$watch(attrs.ngShow, function (visible) {
          if (visible) {
            scope.startSpikeDisplay(firstTimeRun);
            firstTimeRun = false;
          }
          else {
            scope.stopSpikeDisplay();
          }
        });
      }
    };
  }]);
}());

