(function () {
  'use strict';

  function configureSpiketrain(roslib, scope, canvas1, canvas2, div) {
    scope.canvas = [canvas1, canvas2];
    scope.directiveDiv = div;
    scope.ctx = [scope.canvas[0].getContext("2d"), scope.canvas[1].getContext("2d")];
    scope.neuronYSize = 1;
    scope.currentCanvas = 1;
    scope.xPosition = 0;
    var MARK_INTERVAL = 100; // time lapse (ms) between two consecutive time marks

    scope.ctx[0].clearRect(0, 0, scope.canvas[0].width, scope.canvas[0].height);
    scope.ctx[1].clearRect(0, 0, scope.canvas[1].width, scope.canvas[1].height);

    // Main functions, get called each time a spike message is received, It redraws the canvas.
    scope.onNewSpikesMessageReceived = function(message){
      if (angular.isDefined(message) && angular.isDefined(message.data)) {
        message = JSON.parse(message.data);
      }
      if (angular.isDefined(message) && angular.isDefined(message.spikes) && angular.isDefined(message.neuronCount)) {
        // If the left canvas is out of the parent div, append it to the right of the other canvas
        if (scope.xPosition >= scope.canvas[scope.currentCanvas].width) {
          scope.xPosition = 0;
          // Toggle between the two canvas
          scope.currentCanvas = 1 - scope.currentCanvas;
          // Clear the current canvas
          scope.ctx[scope.currentCanvas].clearRect(0, 0, scope.canvas[scope.currentCanvas].width, scope.canvas[scope.currentCanvas].height);
        }

        scope.neuronYSize = Math.floor(scope.canvas[0].height / message.neuronCount) - 1;
        // Draw a time mark, i.e. a vertical red line segment, every MARK_INTERVAL ms
        var context = scope.ctx[scope.currentCanvas];
        if (message.simulationTime % MARK_INTERVAL === 0) {
          context.beginPath();
          context.moveTo(scope.xPosition, 0);
          context.lineTo(scope.xPosition, scope.canvas[scope.currentCanvas].height);
          context.strokeStyle = 'red';
          context.stroke();
        }

        // Draw the spikes to the current (right) canvas
        context.strokeStyle = 'black';
        for (var i = 0; i < message.spikes.length; i = i + 1) {
          var yIndex = message.spikes[i].neuron;
          context.beginPath();
          context.moveTo(scope.xPosition, yIndex);
          context.lineTo(scope.xPosition, yIndex + scope.neuronYSize);
          context.stroke();
        }

        // Shift the two canvases to the left.
        scope.xPosition += 1;
        var otherCanvas = 1 - scope.currentCanvas;
        scope.canvas[otherCanvas].style.left = - scope.xPosition + 'px';
        scope.canvas[scope.currentCanvas].style.left = scope.canvas[otherCanvas].width - scope.xPosition + 'px';
      }
    };

    // Unfortunately, this is mandatory. The canvas size can't be set to 100% of its container,
    scope.onScreenSizeChanged = function(){
      // In order to have a smooth transition, we take a snapshot of what is currently drawn.
      // A few lines after, we redraw that to the new position (since the size did change)
      var canvas = scope.canvas[scope.currentCanvas];
      var context = scope.ctx[scope.currentCanvas];

      var canvasData = context.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = scope.directiveDiv.offsetWidth;
      canvas.height = scope.directiveDiv.offsetHeight;
      canvas.style.left = canvas.width - scope.xPosition;
      context.putImageData(canvasData, 0, 0);

      var otherCanvas = 1 - scope.currentCanvas;
      canvas = scope.canvas[otherCanvas];
      context = scope.ctx[otherCanvas];
      var oldWidth = scope.canvas[otherCanvas].width;

      canvasData = context.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = scope.directiveDiv.offsetWidth;
      canvas.height = scope.directiveDiv.offsetHeight;
      canvas.style.left = -scope.xPosition;
      context.putImageData(canvasData, canvas.width - oldWidth, 0);
    };

    // Subscribe to the ROS topic
    scope.startSpikeDisplay = function () {
      var rosConnection = roslib.getOrCreateConnectionTo(scope.server);
      scope.spikeTopicSubscriber = scope.spikeTopicSubscriber || roslib.createStringTopic(rosConnection, scope.topic);
      scope.spikeTopicSubscriber.subscribe(scope.onNewSpikesMessageReceived);
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

  angular.module('exdFrontendApp').directive('spiketrain', ['$log', '$window', 'roslib', function ($log, $window, roslib) {
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

        var div = element[0].childNodes[1];
        configureSpiketrain(roslib, scope, div.childNodes[0], div.childNodes[1], div);

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
            scope.startSpikeDisplay();
          }
          else {
            scope.stopSpikeDisplay();
          }
        });
      }
    };
  }]);
}());

