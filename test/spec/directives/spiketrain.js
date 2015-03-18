'use strict';

describe('Directive: spiketrain', function () {

  beforeEach(module('exdFrontendApp'));

  var $scope, element, roslib;
  var SERVER_URL = 'ws://localhost:1234';
  var SPIKE_TOPIC = '/cle_sim/spike';

  // TODO(Stefan) extract this to a common place, it is used in several places!
  var roslibMock = {};
  var returnedConnectionObject = {};
  returnedConnectionObject.subscribe = jasmine.createSpy('subscribe');
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn({});
  roslibMock.createStringTopic = jasmine.createSpy('createStringTopic').andReturn(returnedConnectionObject);

  beforeEach(module(function ($provide) {
    $provide.value('roslib', roslibMock);
  }));

  beforeEach(inject(function ($rootScope, $compile, _roslib_) {
    $scope = $rootScope.$new();
    element = $compile('<spiketrain server="' + SERVER_URL + '" topic="' + SPIKE_TOPIC + '"></spiketrain>')($scope);
    $scope.$digest();
    roslib = _roslib_;
  }));

  it('replaces the element with the appropriate content', function () {
    // Compile a piece of HTML containing the directive
    expect(element.prop('outerHTML')).toContain('<div class="spiketrain ng-scope" server="' + SERVER_URL + '" topic="' + SPIKE_TOPIC + '"><canvas></canvas></div>');
  });

  it('draw single pixels properly', function () {
    var x = 45;
    var y = 76;
    $scope.drawPixel(x, y, 11, 22, 33, 44);
    var index = (x + y * $scope.canvas.width) * 4;
    expect($scope.canvasData.data[index + 0]).toBe(11);
    expect($scope.canvasData.data[index + 1]).toBe(22);
    expect($scope.canvasData.data[index + 2]).toBe(33);
    expect($scope.canvasData.data[index + 3]).toBe(44);
    for (var i = 0; i < $scope.canvasData.data.length; i = i + 1) {
      if (i < index || i > index + 3) {
        expect($scope.canvasData.data[i]).toBe(0);
      }
    }

    // Make sure that the data is not actually put on the screen
    // (onNewSpikesMessageReceived is actually responsible for that)
    var ctx = $scope.canvas.getContext('2d');
    var canvasData = ctx.getImageData(0, 0, $scope.canvas.width, $scope.canvas.height);
    expect(canvasData.data[index + 0]).toBe(0);
    expect(canvasData.data[index + 1]).toBe(0);
    expect(canvasData.data[index + 2]).toBe(0);
    expect(canvasData.data[index + 3]).toBe(0);
  });

  it('draw spike properly', function () {
    var x = 26;
    var y = 13;
    var ysize = 5;
    var color = { r: 11, g: 22, b: 33, a: 44 };
    $scope.drawSpike(x, y, ysize, color);
    for (var s = 0; s < ysize; s = s + 1) {
      var index = (x + ((y + s) * $scope.canvas.width)) * 4;
      expect($scope.canvasData.data[index + 0]).toBe(color.r);
      expect($scope.canvasData.data[index + 1]).toBe(color.g);
      expect($scope.canvasData.data[index + 2]).toBe(color.b);
      expect($scope.canvasData.data[index + 3]).toBe(color.a);
    }
  });

  it('should register neurons properly', function () {
    var oneNeuronSizeAndIndex = $scope.getNeuronYIndexAndSize('neuron A');
    var twoNeuronsSizeAndIndexB = $scope.getNeuronYIndexAndSize('neuron B');
    var twoNeuronsSizeAndIndexA = $scope.getNeuronYIndexAndSize('neuron A');
    expect(oneNeuronSizeAndIndex[0]).toBe(0);
    expect(twoNeuronsSizeAndIndexA[0]).toBe(0);
    expect(twoNeuronsSizeAndIndexA[1]).toBe(twoNeuronsSizeAndIndexB[1]);
    expect(twoNeuronsSizeAndIndexA[1] - (oneNeuronSizeAndIndex[1] / 2)).toBeLessThan(1);
  });

  it('should display spike message properly', function () {
    var fakeMessage1 = {};
    fakeMessage1.data = JSON.stringify({'simulation_interval': 10, spikes: [{neuron: 'A', time: 9}]});
    $scope.onNewSpikesMessageReceived(fakeMessage1);
    var ctx = $scope.canvas.getContext('2d');
    var canvasData = ctx.getImageData(0, 0, $scope.canvas.width, $scope.canvas.height);
    for (var i = 0; i < $scope.canvasData.data.length; i = i + 1) {
      if (i >= $scope.canvasData.data.length - 4) { // Last pixel is not set (margin)
        expect(canvasData.data[i]).toBe(0);
      }
      else if ((i - 1196) % 1200 === 0) {
        // "r" value of our spike
        expect(canvasData.data[i]).toBe(0);
      }
      else if ((i - 1197) % 1200 === 0) {
        // "g" value of our spike
        expect(canvasData.data[i]).toBe(0);
      }
      else if ((i - 1198) % 1200 === 0) {
        // "b" value of our spike
        expect(canvasData.data[i]).toBe(0);
      }
      else if ((i - 1199) % 1200 === 0) {
        // "a" value of our spike
        expect(canvasData.data[i]).toBe(255);
      }
      else {
        expect(canvasData.data[i]).toBe(0);
      }
    }

    // Send an empty message to shift the whole thing.
    $scope.onNewSpikesMessageReceived();

    canvasData = ctx.getImageData(0, 0, $scope.canvas.width, $scope.canvas.height);
    for (i = 0; i < $scope.canvasData.data.length; i = i + 1) {
      if (i >= $scope.canvasData.data.length - 8) { // Last 2 pixels are not set (margin)
        expect(canvasData.data[i]).toBe(0);
      }
      else if ((i - 1192) % 1200 === 0) {
        // "r" value of our spike
        expect(canvasData.data[i]).toBe(0, ' at index: ' + i);
      }
      else if ((i - 1193) % 1200 === 0) {
        // "g" value of our spike
        expect(canvasData.data[i]).toBe(0, ' at index: ' + i);
      }
      else if ((i - 1194) % 1200 === 0) {
        // "b" value of our spike
        expect(canvasData.data[i]).toBe(0, ' at index: ' + i);
      }
      else if ((i - 1195) % 1200 === 0) {
        // "a" value of our spike
        expect(canvasData.data[i]).toBe(255, ' at index: ' + i);
      }
      else {
        expect(canvasData.data[i]).toBe(0, ' at index: ' + i);
      }
    }

  });

  it('should connect to roslib when calling startSpikeDisplay', function () {
    roslibMock.getOrCreateConnectionTo.reset();
    roslibMock.createStringTopic.reset();
    returnedConnectionObject.subscribe.reset();

    $scope.spikeTopicSubscriber = undefined;
    $scope.startSpikeDisplay();

    expect(roslibMock.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslibMock.createStringTopic).toHaveBeenCalled();
    expect(returnedConnectionObject.subscribe).toHaveBeenCalled();
  });

  it('should unsubscribe when stopSpikeDisplay is called', function () {
    $scope.spikeTopicSubscriber = {unsubscribe: jasmine.createSpy('unsubscribe')};
    $scope.stopSpikeDisplay();
    expect($scope.spikeTopicSubscriber.unsubscribe).toHaveBeenCalled();
  });

});

describe('Directive: spiketrain (missing necessary attributes)', function () {

  beforeEach(module('exdFrontendApp'));

  var element;
  var $log;
  var $scope;

  var logMock = {error: jasmine.createSpy('error')};

  beforeEach(module(function ($provide) {
    $provide.value('$log', logMock);
  }));

  beforeEach(inject(function ($rootScope, $compile,_$log_) {
    $scope = $rootScope.$new();
    element = $compile('<spiketrain></spiketrain>')($scope);
    $scope.$digest();
    $log = _$log_;
  }));

  it('should log to error in case we have left out necessary attributes', function() {
    expect($log.error).toHaveBeenCalledWith('The server URL was not specified!');
    expect($log.error).toHaveBeenCalledWith('The topic for the spikes was not specified!');
  });

});
