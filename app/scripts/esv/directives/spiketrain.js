(function () {
  'use strict';

  function configureSpiketrain(roslib, scope, canvas) {
    scope.canvas = canvas;
    scope.ctx = canvas.getContext("2d");
    scope.canvasData = scope.ctx.getImageData(0, 0, canvas.width, canvas.height);
    scope.neuronDictionary = {};
    scope.neuronYSize = 1;

    scope.drawSpike = function (x, y, ysize, color) {
      for (var i = y; i < y + ysize; i = i + 1) {
        scope.drawPixel(x, i, color.r, color.g, color.b, color.a);
      }
    };

    scope.drawPixel = function(x, y, r, g, b, a) {
      var index = (x + y * scope.canvas.width) * 4;
      scope.canvasData.data[index + 0] = r;
      scope.canvasData.data[index + 1] = g;
      scope.canvasData.data[index + 2] = b;
      scope.canvasData.data[index + 3] = a;
    };

    scope.getNeuronYIndexAndSize = function(neuronName){
      var y = 0;
      if (neuronName in scope.neuronDictionary) {
        y = (scope.neuronDictionary[neuronName] * scope.neuronYSize);
        // Add one pixel between each neuron
        if (y !== 0) {
          y += (scope.neuronDictionary[neuronName] - 1);
        }
      }
      else {
        var numberOfNeurons = Object.keys(scope.neuronDictionary).length;
        scope.neuronDictionary[neuronName] = numberOfNeurons;
        numberOfNeurons = numberOfNeurons + 1;
        scope.neuronYSize = Math.floor(scope.canvas.height / numberOfNeurons);
        // remove one pixel per (nb neuron - 1). The goal is to let space between each neuron
        scope.neuronYSize -= 1;
      }
      return [y, scope.neuronYSize];
    };

    scope.onNewSpikesMessageReceived = function(message){
      if (angular.isDefined(message) && angular.isDefined(message.data)) {
        message = JSON.parse(message.data);
      }
      var PIXEL_TO_SHIFT = 1;
      var spikeColor = { r : 0, g : 0, b : 0, a : 255};
      scope.canvasData = scope.ctx.getImageData(PIXEL_TO_SHIFT, 0, scope.canvas.width, scope.canvas.height);
      if (angular.isDefined(message) && angular.isDefined(message.spikes)) {
        for (var i = 0; i < message.spikes.length; i = i + 1) {
          var yIndexAndSize = scope.getNeuronYIndexAndSize(message.spikes[i].neuron);
          var x = scope.canvas.width - PIXEL_TO_SHIFT;
          scope.drawSpike(x, yIndexAndSize[0], yIndexAndSize[1], spikeColor);
        }
      }
      scope.ctx.putImageData(scope.canvasData, 0, 0);
    };

    scope.startSpikeDisplay = function () {
      var rosConnection = roslib.getOrCreateConnectionTo(scope.server);
      scope.spikeTopicSubscriber = scope.spikeTopicSubscriber || roslib.createStringTopic(rosConnection, scope.topic);
      scope.spikeTopicSubscriber.subscribe(scope.onNewSpikesMessageReceived);
    };

    scope.stopSpikeDisplay = function () {
      if (scope.spikeTopicSubscriber) {
        // One has to be careful here: it is not sufficient to only call unsubscribe but you have to
        // put in the function as an argument, otherwise your function will be called twice!
        scope.spikeTopicSubscriber.unsubscribe(scope.onNewSpikesMessageReceived);
      }
    };

  }

  angular.module('exdFrontendApp').directive('spiketrain', function ($log, roslib) {
    return {
      template: '<div class="spiketrain"><canvas></canvas></div>',
      restrict: 'E',
      replace: true,
      link: function (scope, element, attrs) {
        if(angular.isUndefined(attrs.server)) {
          $log.error('The server URL was not specified!');
        }

        if(angular.isUndefined(attrs.topic)) {
          $log.error('The topic for the spikes was not specified!');
        }

        scope.server = attrs.server;
        scope.topic = attrs.topic;

        configureSpiketrain(roslib, scope, element[0].childNodes[0]);

        scope.$watchCollection(attrs.ngShow, function (visible) {
          if (visible) {
            scope.startSpikeDisplay();
          }
          else {
            scope.stopSpikeDisplay();
          }
        });
      }
    };
  });
}());

