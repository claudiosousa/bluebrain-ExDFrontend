'use strict';

describe('Directive: spiketrain', function() {

  beforeEach(module('spikeTrainModule'));
  beforeEach(module('exd.templates')); // import html template

  var simulationInfoMock = {
    serverConfig: {
      rosbridge: {
        websocket: ''
      }
    }
  };

  var spikeListenerServiceMock = {
    startListening: jasmine.createSpy('startListening'),
    stopListening: jasmine.createSpy('stopListening')
  };

  beforeEach(module(function($provide) {
    $provide.value('simulationInfo', simulationInfoMock);
  }));

  var spikeController, canvas,
    SPIKE_TIMELABEL_SPACE = 0;
  beforeEach(inject(function(_$rootScope_, $controller, $filter) {
    spikeController = $controller('SpikeTrainController', {
      $filter: $filter,
      spikeListenerService: spikeListenerServiceMock,
      SPIKE_TIMELABEL_SPACE: SPIKE_TIMELABEL_SPACE
    });
    var parent = document.createElement('div');
    canvas = document.createElement('canvas');
    parent.appendChild(canvas);
    spikeController.drawingCanvas = canvas;
  }));

  beforeEach(function() {
    spyOn(spikeController, 'drawSeparator').and.callThrough();
    spyOn(spikeController, 'plotMessage').and.callThrough();
  });

  it('should call startListening when startSpikeDisplay ', function() {
    spikeController.startSpikeDisplay();
    expect(spikeListenerServiceMock.startListening).toHaveBeenCalled();
  });

  it('should call stopListening when stopSpikeDisplay ', function() {
    spikeController.stopSpikeDisplay();
    expect(spikeListenerServiceMock.stopListening).toHaveBeenCalled();
  });

  it('should empty message on clear plot ', function() {
    spikeController.messages.push({});
    spikeController.clearPlot();
    expect(spikeController.messages.length).toBe(0);
  });

  it('should add separator the nth time it is open', function() {
    spikeController.startSpikeDisplay();
    expect(spikeController.messages.length).toBe(0);

    spikeController.startSpikeDisplay();
    expect(spikeController.messages.length).toBe(1);
    expect(spikeController.messages[0]).toBe(spikeController.SEPARATOR_MSG);
  });

  it('should add plot new message and queue it', function() {
    spikeController.startSpikeDisplay();
    var msg = {};
    spikeListenerServiceMock.startListening.calls.mostRecent().args[0](msg);
    expect(spikeController.messages.length).toBe(1);
    expect(spikeController.messages[0]).toBe(msg);
    expect(spikeController.plotMessage).toHaveBeenCalled();
  });

  // canvas size is 300x150 as default
  var getCanvasData = function(x, width) {
    return spikeController.canvasCtx.getImageData(x, 0, width, canvas.height).data;
  };

  var verifyAllLineColor = function(canvasData, color) {
    for (var i = SPIKE_TIMELABEL_SPACE * 4; i < canvasData.length - 4 * (SPIKE_TIMELABEL_SPACE + 1); i = i + 4) {
      // rgba values
      expect(canvasData[i]).toBe(color[0]);
      expect(canvasData[i + 1]).toBe(color[1]);
      expect(canvasData[i + 2]).toBe(color[2]);
      expect(canvasData[i + 3]).toBe(255);
    }
  };

  it('should display spike message properly', function() {
    spyOn(spikeController, 'calculateCanvasSize');
    spikeController.visibleWidth = 300;

    var fakeMessage = { neuronCount: 1, simulationTime: 0.01, spikes: [{ neuron: 0, time: 9 }] };
    spikeController.newSpikesMessage(fakeMessage);

    var black = [0, 0, 0];
    // The last column is black
    verifyAllLineColor(getCanvasData(canvas.width - 1, 1), black);

    // The rest of the canvas is black-transparent (0,0,0,0)
    var canvasData = getCanvasData(0, canvas.width - 1);
    for (var i = 0; i < canvasData.length; i = i + 1) {
      expect(canvasData[i]).toBe(0);
    }
  });

  it('should display red bar at multiples of 100 * dt properly. (dt is 20ms, specified in the experiment template)', function() {
    spyOn(spikeController, 'calculateCanvasSize');
    spikeController.visibleWidth = 300;

    var fakeMessage = { neuronCount: 1, simulationTime: 2, spikes: [] };
    spikeController.newSpikesMessage(fakeMessage);

    // canvas size is 300x150 as default
    // The first column is red except for the last 15 pixel
    verifyAllLineColor(getCanvasData(canvas.width - 1, 1), [255, 0, 0]);
  });

  it('should plot separator', function() {
    spyOn(spikeController, 'calculateCanvasSize');
    spikeController.visibleWidth = 300;

    spikeController.startSpikeDisplay(); //first time visible
    expect(spikeController.messages.length).toBe(0);

    spikeController.startSpikeDisplay();  //second  time visible
    expect(spikeController.messages.length).toBe(1);
    spikeController.redraw();

    expect(spikeController.drawSeparator).toHaveBeenCalled();
  });

  it('should change size on calculateCanvasSize if canvas too small', function() {
    spikeController.canvas = {
      width: 200,
      parentNode: {
        clientWidth: 300
      },
      setAttribute: jasmine.createSpy('setAttribute')
    };

    var res = spikeController.calculateCanvasSize();
    expect(res).toBe(true);
    expect(spikeController.canvas.setAttribute).toHaveBeenCalled();
  });

  it('should not change size on calculateCanvasSize if canvas big enough', function() {
    spikeController.canvas = {
      width: 300,
      height: 200,
      parentNode: {
        clientWidth: 200
      },
      setAttribute: jasmine.createSpy('setAttribute')
    };

    var res = spikeController.calculateCanvasSize();
    expect(res).toBe(false);
    expect(spikeController.canvas.setAttribute).not.toHaveBeenCalled();
  });

});