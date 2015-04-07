'use strict';

describe('Directive: spiketrain', function () {

  beforeEach(module('exdFrontendApp'));

  var $scope, element, roslib, window;
  var SERVER_URL = 'ws://localhost:1234';
  var SPIKE_TOPIC = '/cle_sim/spike';

  // TODO(Stefan) extract this to a common place, it is used in several places!
  var roslibMock = {};
  var returnedConnectionObject = {};
  returnedConnectionObject.subscribe = jasmine.createSpy('subscribe');
  returnedConnectionObject.unsubscribe = jasmine.createSpy('unsubscribe');
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn({});
  roslibMock.createTopic = jasmine.createSpy('createTopic').andReturn(returnedConnectionObject);

  beforeEach(module(function ($provide) {
    $provide.value('roslib', roslibMock);
  }));

  beforeEach(inject(function ($rootScope, $compile, $window, _roslib_) {
    $scope = $rootScope.$new();
    element = $compile('<spiketrain server="' + SERVER_URL + '" topic="' + SPIKE_TOPIC + '" ng-show="showSpikeTrain"></spiketrain>')($scope);
    $scope.$digest();
    roslib = _roslib_;
    window = $window;
  }));

  it('replaces the element with the appropriate content', function () {
    // Compile a piece of HTML containing the directive
    expect(element.prop('outerHTML')).toContain('<div class="spikegraph ng-scope ng-hide" server="' + SERVER_URL + '" topic="' + SPIKE_TOPIC + '" ng-show="showSpikeTrain"><div class="leftaxis"><div class="arrow"><p class="legend">NeuronID</p></div></div><div class="spiketrain"><canvas></canvas><canvas></canvas></div></div>');
  });

  it('should display spike message properly', function () {
    var fakeMessage = {'neuronCount': 1, 'simulationTime': 0.01, spikes: [{neuron: 0, time: 9}]};
    $scope.onNewSpikesMessageReceived(fakeMessage);
    expect($scope.xPosition).toBe(1);

    // canvas size is 300x150 as default
    // The first column is black except of the last 16 pixel
    var canvasData = $scope.ctx[1].getImageData(0, 0, 1, $scope.canvas[1].height).data;
    for (var i = 0; i < canvasData.length - (4 * 17); i = i + 4) {
      // "r" value of our spike
      expect(canvasData[i]).toBe(0);
      // "g" value of our spike
      expect(canvasData[i + 1]).toBe(0);
      // "b" value of our spike
      expect(canvasData[i + 2]).toBe(0);
      // "a" value of our spike
      expect(canvasData[i + 3]).toBe(128);
    }
    // The last pixel is black-transparent (0,0,0,0)
    for (i = 1; i <= 4 * 16; i += 1) {
      expect(canvasData[canvasData.length - i]).toBe(0);
    }

    // The rest of the canvas is black-transparent (0,0,0,0)
    canvasData = $scope.ctx[1].getImageData(1, 0, $scope.canvas[1].width - 1, $scope.canvas[1].height).data;
    expect(canvasData.length).toBe(($scope.canvas[1].width - 1) * $scope.canvas[1].height * 4);
    for (i = 0; i < canvasData.length; i = i + 1) {
      expect(canvasData[i]).toBe(0);
    }

    // Simulate canvas switch
    $scope.xPosition = $scope.canvas[1].width;
    $scope.onNewSpikesMessageReceived(fakeMessage);
    expect($scope.xPosition).toBe(1);
    expect($scope.currentCanvasIndex).toBe(0);

    // canvas size is 300x150 as default
    // The first column is black except of the last 16 pixel
    canvasData = $scope.ctx[$scope.currentCanvasIndex].getImageData(0, 0, 1, $scope.canvas[$scope.currentCanvasIndex].height).data;
    for (i = 0; i < canvasData.length - (4 * 17); i = i + 4) {
      // "r" value of our spike
      expect(canvasData[i]).toBe(0);
      // "g" value of our spike
      expect(canvasData[i + 1]).toBe(0);
      // "b" value of our spike
      expect(canvasData[i + 2]).toBe(0);
      // "a" value of our spike
      expect(canvasData[i + 3]).toBe(128);
    }
    // The last pixel is black-transparent (0,0,0,0)
    for (i = 1; i <= (4 * 16); i += 1) {
      expect(canvasData[canvasData.length - i]).toBe(0);
    }
  });

  it('should display red bar at multiples of 100 properly', function () {
    var fakeMessage = {'neuronCount': 1, 'simulationTime': 1.00, spikes: []};
    $scope.onNewSpikesMessageReceived(fakeMessage);
    expect($scope.xPosition).toBe(1);

    // canvas size is 300x150 as default
    // The first column is red except for the last 15 pixel
    var canvasData = $scope.ctx[1].getImageData(0, 0, 1, $scope.canvas[1].height).data;
    for (var i = 0; i < canvasData.length - (4 * 16); i = i + 4) {
      // "r" value
      expect(canvasData[i]).toBe(255);
      // "g" value
      expect(canvasData[i + 1]).toBe(0);
      // "b" value
      expect(canvasData[i + 2]).toBe(0);
      // "a" value
      expect(canvasData[i + 3]).toBe(128);
    }
  });

  it('should display black separation bar on re-showing the monitor (not the first one)', function () {
    spyOn($scope, 'startSpikeDisplay').andCallThrough();
    spyOn($scope, 'drawSeparator').andCallThrough();
    $scope.showSpikeTrain = true;
    $scope.$digest();
    expect($scope.startSpikeDisplay).toHaveBeenCalledWith(true);
    expect($scope.drawSeparator).not.toHaveBeenCalled();

    // canvas size is 300x150 as default
    // no separation bar should have been drawn
    var canvasData = $scope.ctx[1].getImageData(0, 0, 1, $scope.canvas[1].height).data;
    for (var i = 0; i < canvasData.length ; i = i + 1) {
      expect(canvasData[i]).toBe(0);
    }

    $scope.showSpikeTrain = false;
    $scope.$digest();

    $scope.startSpikeDisplay.reset();
    $scope.drawSeparator.reset();
    $scope.xPosition = 10;

    $scope.showSpikeTrain = true;
    $scope.$digest();
    expect($scope.startSpikeDisplay).toHaveBeenCalledWith(false);
    expect($scope.drawSeparator).toHaveBeenCalled();

    // canvas size is 300x150 as default
    // The first column is black except for the last 15 pixel
    canvasData = $scope.ctx[1].getImageData($scope.xPosition, 0, 1, $scope.canvas[1].height).data;
    for (i = 0; i < canvasData.length - (4 * 16); i = i + 4) {
      // "r" value
      expect(canvasData[i]).toBe(0);
      // "g" value
      expect(canvasData[i + 1]).toBe(0);
      // "b" value
      expect(canvasData[i + 2]).toBe(0);
      // "a" value
      // normally half transparent (128) but in between more in the direction to opaque because of the double ~ sign
      expect(canvasData[i + 3]).toBeGreaterThan(0);
    }
  });

  it('should skip message if undefined', function () {
    $scope.xPosition = 1;
    $scope.onNewSpikesMessageReceived(undefined);
    expect($scope.xPosition).toBe(1);
  });

  it('should update the canvas size on resize', function () {
    //Default size of the canvas
    expect($scope.canvas[0].width).toBe(300);
    expect($scope.canvas[0].height).toBe(150);
    expect($scope.canvas[1].width).toBe(300);
    expect($scope.canvas[1].height).toBe(150);


    // Mock this DIV, because offsetWidth is not available in this test
    $scope.directiveDiv = {};
    $scope.directiveDiv.offsetWidth = 400;
    $scope.directiveDiv.offsetHeight = 200;

    $scope.onScreenSizeChanged();
    expect($scope.directiveDiv.offsetWidth).toBe(400);
    expect($scope.canvas[0].width).toBe(400);
    expect($scope.canvas[0].height).toBe(200);
    expect($scope.canvas[1].width).toBe(400);
    expect($scope.canvas[1].height).toBe(200);
  });

  it('should call the resize function (1)', function () {
    spyOn($scope, 'onScreenSizeChanged');
    /*global $: false */
    $(window).resize();
    expect($scope.onScreenSizeChanged).toHaveBeenCalled();
  });

  it('should call the resize function (2)', function () {
    spyOn($scope, 'onScreenSizeChanged');
    element.css('display', 'block');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).toHaveBeenCalled();
  });

  it('should call the startSpikeDisplay function', function () {
    spyOn($scope, 'startSpikeDisplay');
    $scope.showSpikeTrain = true;
    $scope.$digest();
    expect($scope.startSpikeDisplay).toHaveBeenCalled();
  });

  it('should connect to roslib when calling startSpikeDisplay', function () {
    roslibMock.getOrCreateConnectionTo.reset();
    roslibMock.createTopic.reset();
    returnedConnectionObject.subscribe.reset();

    $scope.spikeTopicSubscriber = undefined;
    $scope.startSpikeDisplay();

    expect(roslibMock.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslibMock.createTopic).toHaveBeenCalled();
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
