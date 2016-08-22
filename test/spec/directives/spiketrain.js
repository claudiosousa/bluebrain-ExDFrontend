'use strict';

describe('Directive: spiketrain', function () {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var parentscope, $scope, element, roslib, stateService, STATE, window, timeout, RESET_TYPE, SPIKE_TIMELABEL_SPACE;
  var SERVER_URL = 'ws://localhost:1234';
  var SPIKE_TOPIC = '/cle_sim/spike';

  function setShow(showBool) {
    parentscope.showSpikeTrain = showBool;
    parentscope.$digest();
    $scope.$digest();
    if (showBool) {
      timeout.flush();
    }
  }

  // TODO(Stefan) extract this to a common place, it is used in several places!
  beforeEach(module(function ($provide) {
    var returnedConnectionObject = {
      subscribe: jasmine.createSpy('subscribe'),
      unsubscribe: jasmine.createSpy('unsubscribe')
    };
    var roslibMock = {
      getOrCreateConnectionTo: jasmine.createSpy('getOrCreateConnectionTo').andReturn({}),
      createTopic: jasmine.createSpy('createTopic').andReturn(returnedConnectionObject)
    };
    $provide.value('roslib', roslibMock);
    $provide.value('stateService', {
      addStateCallback: jasmine.createSpy('addStateCallback'),
      removeStateCallback: jasmine.createSpy('removeStateCallback')
    });

  }));

  beforeEach(inject(function (
    $rootScope, $compile, $window,
    _roslib_, _stateService_, _STATE_, $timeout, _RESET_TYPE_, _SPIKE_TIMELABEL_SPACE_) {
    parentscope = $rootScope.$new();
    parentscope.showSpikeTrain = false;
    element = $compile('<spiketrain server="' + SERVER_URL + '" topic="' + SPIKE_TOPIC + '" ng-show="showSpikeTrain"></spiketrain>')(parentscope);
    parentscope.$digest();
    $scope = element.isolateScope();
    roslib = _roslib_;
    window = $window;
    timeout = $timeout;
    stateService = _stateService_;
    STATE = _STATE_;
    RESET_TYPE = _RESET_TYPE_;
    SPIKE_TIMELABEL_SPACE = _SPIKE_TIMELABEL_SPACE_;
  }));

  it('should draw separator if not first time run', function () {
    spyOn($scope, 'drawSeparator');
    setShow(true);
    expect($scope.drawSeparator).not.toHaveBeenCalled();

    setShow(false);
    expect($scope.drawSeparator).not.toHaveBeenCalled();

    setShow(true);
    expect($scope.drawSeparator).toHaveBeenCalled();
  });

  it('replaces the element with the appropriate content', function () {
    // Compile a piece of HTML containing the directive
    expect(element.prop('outerHTML')).toContain('resizeable');
    expect(element.prop('outerHTML')).toContain('spikegraph');
    expect(element.prop('outerHTML')).toContain('ng-isolate-scope');
    expect(element.prop('outerHTML')).toContain('server="' + SERVER_URL + '"');
    expect(element.prop('outerHTML')).toContain('topic="' + SPIKE_TOPIC + '"');
    expect(element.prop('outerHTML')).toContain('ng-show="showSpikeTrain"');
    expect(element.prop('outerHTML')).toContain('leftaxis');
    expect(element.prop('outerHTML')).toContain('spiketrain');
    expect(element.prop('outerHTML')).toContain('<p class="legend">NeuronID</p>');
    expect(element.prop('outerHTML')).toContain('<canvas id="spiketrain-canvas-1"></canvas>');
    expect(element.prop('outerHTML')).toContain('<canvas id="spiketrain-canvas-2"></canvas>');
  });

  it('should clear the plot on RESET event', function () {
      spyOn($scope, 'clearPlot').andCallThrough();

      $scope.$broadcast('RESET', RESET_TYPE.RESET_FULL);
      $scope.$digest();

      expect($scope.clearPlot).toHaveBeenCalled();
  });

    it('should NOT clear the plot on RESET event: RESET_CAMERA_VIEW', function () {
      spyOn($scope, 'clearPlot').andCallThrough();

      $scope.$broadcast('RESET', RESET_TYPE.RESET_CAMERA_VIEW);
      $scope.$digest();

      expect($scope.clearPlot).not.toHaveBeenCalled();
  });

  it('should remove the RESET event callback on $destroy event', function () {
    spyOn($scope, 'resetListenerUnbindHandler').andCallThrough();
    $scope.$broadcast('$destroy');
    $scope.$digest();
    expect($scope.resetListenerUnbindHandler).toHaveBeenCalled();
  });

  it('should display spike message properly', function () {
    var fakeMessage = {'neuronCount': 1, 'simulationTime': 0.01, spikes: [{neuron: 0, time: 9}]};
    $scope.onNewSpikesMessageReceived(fakeMessage);
    expect($scope.xPosition).toBe(1);

    // canvas size is 300x150 as default
    // The first column is black except of the last 16 pixel
    var canvasData = $scope.ctx[1].getImageData(0, 0, 1, $scope.canvas[1].height).data;
    for (var i = SPIKE_TIMELABEL_SPACE * 4; i < canvasData.length - (4 * 17); i = i + 4) {
      // "r" value of our spike
      expect(canvasData[i]).toBe(0);
      // "g" value of our spike
      expect(canvasData[i + 1]).toBe(0);
      // "b" value of our spike
      expect(canvasData[i + 2]).toBe(0);
      // "a" value of our spike
      expect(canvasData[i + 3]).toBe(255);
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
    for (i = SPIKE_TIMELABEL_SPACE * 4; i < canvasData.length - (4 * 17); i = i + 4) {
      // "r" value of our spike
      expect(canvasData[i]).toBe(0);
      // "g" value of our spike
      expect(canvasData[i + 1]).toBe(0);
      // "b" value of our spike
      expect(canvasData[i + 2]).toBe(0);
      // "a" value of our spike
      expect(canvasData[i + 3]).toBe(255);
    }
    // The last pixel is black-transparent (0,0,0,0)
    for (i = 1; i <= (4 * 16); i += 1) {
      expect(canvasData[canvasData.length - i]).toBe(0);
    }
  });

  it('should display red bar at multiples of 100 * dt properly. (dt is 20ms, specified in the experiment template)', function () {
    var fakeMessage = {'neuronCount': 1, 'simulationTime': 2.00, spikes: []};
    $scope.onNewSpikesMessageReceived(fakeMessage);
    expect($scope.xPosition).toBe(1);

    // canvas size is 300x150 as default
    // The first column is red except for the last 15 pixel
    var canvasData = $scope.ctx[1].getImageData(0, 0, 1, $scope.canvas[1].height).data;
    for (var i = SPIKE_TIMELABEL_SPACE * 4; i < canvasData.length - (4 * 16); i = i + 4) {
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
    setShow(true);
    expect($scope.startSpikeDisplay).toHaveBeenCalledWith(true);
    expect($scope.drawSeparator).not.toHaveBeenCalled();

    // canvas size is 300x150 as default
    // no separation bar should have been drawn
    var canvasData = $scope.ctx[1].getImageData(0, 0, 1, $scope.canvas[1].height).data;
    for (var i = 0; i < canvasData.length ; i = i + 1) {
      expect(canvasData[i]).toBe(0);
    }

    setShow(false);
    $scope.startSpikeDisplay.reset();
    $scope.drawSeparator.reset();
    $scope.xPosition = 10;

    setShow(true);
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
    $scope.splikeContainer = $scope.directiveDiv = { style: {} };
    $scope.directiveDiv.offsetWidth = 400;
    $scope.directiveDiv.offsetHeight = 200;

    $scope.onScreenSizeChanged();
    expect($scope.directiveDiv.offsetWidth).toBe(400);
    expect($scope.canvas[0].width).toBe(400);
    expect($scope.canvas[0].height).toBe(200);
    expect($scope.canvas[1].width).toBe(400);
    expect($scope.canvas[1].height).toBe(200);

    $scope.currentCanvasIndex = 0;
    var canvas = $scope.canvas[$scope.currentCanvasIndex];
    $scope.directiveDiv.offsetWidth = canvas.width;
    $scope.directiveDiv.offsetHeight = canvas.height;
    canvas.style.left = '12px';
    expect($scope.xPosition).toBe(0);
    $scope.onScreenSizeChanged();
    expect(canvas.style.left).toBe('12px');
  });

  it('should call the resize function (1)', function () {
    spyOn($scope, 'onScreenSizeChanged');
    setShow(true);
    /*global $: false */
    $(window).resize();
    expect($scope.onScreenSizeChanged).toHaveBeenCalled();
  });

  it('should hide canvas while resizing', function () {
    var canvas = $scope.canvas;
    var styles = [ canvas[0].style, canvas[1].style ];
    expect(styles[0].visibility).toBe('');
    expect(styles[1].visibility).toBe('');
    $scope.onResizeBegin();
    expect(styles[0].visibility).toBe('hidden');
    expect(styles[1].visibility).toBe('hidden');
  });


  it('should show canvas once resizing is done', function () {
    var canvas = $scope.canvas;
    var styles = [ canvas[0].style, canvas[1].style ];
    expect(styles[0].visibility).toBe('');
    expect(styles[1].visibility).toBe('');
    $scope.onResizeEnd();
    expect(styles[0].visibility).toBe('visible');
    expect(styles[1].visibility).toBe('visible');
  });

  it('should call the startSpikeDisplay function', function () {
    spyOn($scope, 'startSpikeDisplay');
    setShow(true);
    expect($scope.startSpikeDisplay).toHaveBeenCalled();
  });

  it('should connect to roslib when calling startSpikeDisplay', function () {
    $scope.spikeTopicSubscriber = undefined;
    $scope.startSpikeDisplay();

    expect(roslib.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslib.createTopic).toHaveBeenCalled();
    expect(roslib.createTopic().subscribe).toHaveBeenCalled();
  });

  it('should unsubscribe when stopSpikeDisplay is called', function () {
    $scope.spikeTopicSubscriber = {unsubscribe: jasmine.createSpy('unsubscribe')};
    $scope.stopSpikeDisplay();
    expect($scope.spikeTopicSubscriber.unsubscribe).toHaveBeenCalled();
  });

});

describe('Directive: spiketrain (missing necessary attributes)', function () {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var element;
  var $log;
  var $scope;

  beforeEach(module(function ($provide) {
    $provide.value('$log', {error: jasmine.createSpy('error')});
  }));

  beforeEach(inject(function ($rootScope, $compile, _$log_) {
    $scope = $rootScope.$new();
    element = $compile('<spiketrain></spiketrain>')($scope);
    $scope.$digest();
    $log = _$log_;
  }));

  it('should log to error in case we have left out necessary attributes', function() {
    expect($log.error).toBeDefined();
    expect($log.error).toHaveBeenCalledWith('The server URL was not specified!');
    expect($log.error).toHaveBeenCalledWith('The topic for the spikes was not specified!');
  });

});