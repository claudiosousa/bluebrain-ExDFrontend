'use strict';

describe('Services: server-info-service', function () {
  var simulationInfo, httpBackend, simulationData, serverConfig;


  beforeEach(module('exdFrontendApp'));
  beforeEach(function () {
    simulationData = {
      serverID: 'bbpce016',
      simulationID: 'mocked_simulation_id',
      ctx: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
    };
    serverConfig = {
      gzweb: {
        assets: 'mock_assets',
        'nrp-services': 'http://some-url',
        websocket: 'mock_websocket'
      },
      rosbridge: {
        topics: {
          spikes: '/mock_spike_topic',
          status: '/mock_status_topic'
        },
        websocket: 'wss://mock_ws_url'
      }
    };
  });

  beforeEach(inject(function (
    _simulationInfo_,
    _$httpBackend_) {
    simulationInfo = _simulationInfo_;
    httpBackend = _$httpBackend_;
  }));

  it('should set simulationInfo properties using $stateParams properties', function () {
    simulationInfo.initialize(simulationData.serverID, simulationData.simulationID, simulationData.ctx);
    httpBackend.whenGET('http://proxy/server/'+simulationData.serverID).respond(200, serverConfig);
    httpBackend.whenGET('views/common/home.html').respond(200);
    httpBackend.flush();

    expect(simulationInfo.serverID).toEqual(simulationData.serverID);
    expect(simulationInfo.simulationID).toEqual(simulationData.simulationID);
    expect(simulationInfo.serverConfig).toBeDefined();
    expect(simulationInfo.serverBaseUrl).toBeDefined();
    expect(simulationInfo.contextID).toBe(simulationData.ctx);
    expect(simulationInfo.isCollabExperiment).toBe(true);
  });

  it('should throw an error when simulationInfo.initialize() is called with no prior knowledge of serverID or simulationID', function () {
    expect(simulationInfo.initialize).toThrow();
    expect(_.partial(simulationInfo.initialize, 'fake_id')).toThrow();
  });
});
