'use strict';

describe('setting up the simulation statistics', function () {

  var simulationStatistics;
  var gzCommunication;

  // we mock the whole gzCommunication service here
  var gzCommunicationMock = {};
  var gzCommunicationMethodChainMock = {};
  gzCommunicationMethodChainMock.subscribe = jasmine.createSpy('subscribe');
  gzCommunicationMock.connect = jasmine.createSpy('connect').andReturn(gzCommunicationMethodChainMock);

  // load the service to test and mock the necessary service
  beforeEach(module('gz3dServices'));
  beforeEach(module(function ($provide) {
    $provide.value('gzCommunication', gzCommunicationMock);
  }));

  beforeEach(inject(function (_simulationStatistics_, _gzCommunication_) {
    simulationStatistics = _simulationStatistics_;
    gzCommunication = _gzCommunication_;
    // create a mock for console
    spyOn(console, 'error');
  }));


  it('establishes a communication channel to gzbridge\'s world_stats topic', function () {
    expect(gzCommunication.connect).toHaveBeenCalledWith('~/world_stats', 'worldstatistics');
  });

  it('checks for the calls of the registered callback functions', function () {
    var message = {
      'pause_time': {
        'sec': 0,
        'nsec': 0
      },
      'sim_time': {
        'sec': 19394,
        'nsec': 618000000
      },
      'real_time': {
        'sec': 19459,
        'nsec': 842937775
      },
      'paused': false,
      'iterations': 19394618
    };

    var pausedCallback = jasmine.createSpy('pausedCallback');
    var simulationTimeCallback = jasmine.createSpy('simulationTimeCallback');
    var realTimeCallback = jasmine.createSpy('realTimeCallback');

    simulationStatistics.setPausedCallback(pausedCallback);
    simulationStatistics.setSimulationTimeCallback(simulationTimeCallback);
    simulationStatistics.setRealTimeCallback(realTimeCallback);

    // now we can access the registered callback function
    var registeredCallbackFunction = gzCommunicationMethodChainMock.subscribe.mostRecentCall.args[0];
    registeredCallbackFunction(message);

    expect(pausedCallback).toHaveBeenCalledWith(message.paused);
    expect(simulationTimeCallback).toHaveBeenCalledWith('00 05:23:14');
    expect(realTimeCallback).toHaveBeenCalledWith('00 05:24:19');
  });

});
