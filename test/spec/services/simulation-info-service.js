'use strict';

describe('Services: server-info-service', function () {
  var simulationInfo, stateParams;


  beforeEach(module('exdFrontendApp'));
  beforeEach(module(function ($provide) {
    $provide.value('$stateParams',
      {
        serverID : 'bbpce016',
        simulationID : 'mocked_simulation_id',
        mode: 'mockedMode',
        ctx: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
      }
    );
    $provide.value('bbpConfig', {
      get: jasmine.createSpy('get').andReturn(
        {
          'bbpce016': {
            gzweb: {
              assets: 'mock_assets',
              'nrp-services': 'http://some-url',
              websocket: 'mock_websocket'
            },
            rosbridge: {
              topics   : {
                spikes: '/mock_spike_topic',
                status: '/mock_status_topic'
              },
              websocket: 'wss://mock_ws_url'
            }
          }
        }
      )
    });
  }));

  beforeEach(inject(function (
    _simulationInfo_,
    _$stateParams_) {
    simulationInfo = _simulationInfo_;
    stateParams = _$stateParams_;
  }));

  it('should set simulationInfo properties using $stateParams properties', function () {
    simulationInfo.Initialize();
    expect(simulationInfo.serverID).toEqual(stateParams.serverID);
    expect(simulationInfo.simulationID).toEqual(stateParams.simulationID);
    expect(simulationInfo.mode).toEqual(stateParams.mode);
    expect(simulationInfo.serverConfig).toBeDefined();
    expect(simulationInfo.serverBaseUrl).toBeDefined();
    expect(simulationInfo.contextID).toBe(stateParams.ctx);
    expect(simulationInfo.isCollabExperiment).toBe(true);
  });

  it('should throw an error when simulationInfo.Initialize() is called with no prior knowledge of serverID or simulationID', function () {
    stateParams.serverID = undefined;
    expect(simulationInfo.Initialize).toThrow();

    stateParams.serverID = 'fake_id';
    stateParams.simulationID = undefined;
    expect(simulationInfo.Initialize).toThrow();
  });
});
