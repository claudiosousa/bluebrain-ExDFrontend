'use strict';

describe('Services: server-info-service', function () {
  var simulationInfo, httpBackend, simulationData, serverConfig, environmentService, nrpBackendVersions,
    nrpFrontendVersion, simulationControl, hbpIdentityUserDirectory;


  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('nrpFrontendVersionMock'));
  beforeEach(module('nrpBackendVersionsMock'));
  beforeEach(module('simulationControlMock'));
  beforeEach(module('userContextServiceMock'));
  beforeEach(module('hbpIdentityUserDirectoryMock'));

  beforeEach(function () {
    simulationData = {
      serverID: 'bbpce016',
      simulationID: 'mocked_simulation_id',
      ctx: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
      experimentID: 'AnimatedMouse'
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

  beforeEach(inject(function (_simulationInfo_,
                              _$httpBackend_,
                              _environmentService_,
                              _nrpBackendVersions_,
                              _nrpFrontendVersion_,
                              _simulationControl_,
                              _hbpIdentityUserDirectory_) {
    simulationInfo = _simulationInfo_;
    httpBackend = _$httpBackend_;
    environmentService = _environmentService_;
    nrpBackendVersions = _nrpBackendVersions_;
    nrpFrontendVersion = _nrpFrontendVersion_;
    simulationControl = _simulationControl_;
    hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
  }));

  it('should set simulationInfo properties using $stateParams properties', function () {
    spyOn(simulationInfo, 'getVersionStrings');
    spyOn(simulationInfo, 'getSimulationDetails');

    httpBackend.whenGET('http://proxy/server/' + simulationData.serverID).respond(200, serverConfig);

    // Collab mode
    environmentService.setPrivateExperiment(true);
    var experimentResponse = { data: { 'experiment_configuration': { visualModel: 'mouse.dae'} } };
    httpBackend.whenGET(serverConfig.gzweb['nrp-services'] + '/experiment/' + simulationData.ctx).respond(200, experimentResponse);
    simulationInfo.initialize(simulationData.serverID, simulationData.experimentID, simulationData.simulationID, simulationData.ctx);
    httpBackend.flush();

    expect(simulationInfo.serverID).toEqual(simulationData.serverID);
    expect(simulationInfo.simulationID).toEqual(simulationData.simulationID);
    expect(simulationInfo.serverConfig).toBeDefined();
    expect(simulationInfo.serverBaseUrl).toBeDefined();
    expect(simulationInfo.contextID).toBe(simulationData.ctx);
    expect(environmentService.isPrivateExperiment()).toBe(true);
    expect(simulationInfo.experimentID).toBe(simulationData.experimentID);
    /*jshint camelcase: false */
    var visualUrl = experimentResponse.data.experiment_configuration.visualModel;
    expect(simulationInfo.animatedModel.assetsPath).toBe(serverConfig.gzweb.assets + '/' + visualUrl);

    // Non-Collab mode
    environmentService.setPrivateExperiment(false);
    experimentResponse = { 'AnimatedMouse': { configuration: { visualModel: 'mouse.dae'} } };
    httpBackend.whenGET('http://proxy/experiments').respond(200, experimentResponse);
    simulationInfo.initialize(simulationData.serverID, simulationData.experimentID, simulationData.simulationID, undefined);
    httpBackend.flush();

    expect(simulationInfo.serverID).toEqual(simulationData.serverID);
    expect(simulationInfo.simulationID).toEqual(simulationData.simulationID);
    expect(simulationInfo.serverConfig).toBeDefined();
    expect(simulationInfo.serverBaseUrl).toBeDefined();
    expect(simulationInfo.contextID).not.toBeDefined();
    expect(environmentService.isPrivateExperiment()).toBe(false);
    expect(simulationInfo.experimentID).toBe(simulationData.experimentID);
    visualUrl = experimentResponse[simulationData.experimentID].configuration.visualModel;
    expect(simulationInfo.animatedModel.assetsPath).toBe(serverConfig.gzweb.assets + '/' + visualUrl);

    expect(simulationInfo.getVersionStrings).toHaveBeenCalled();
    expect(simulationInfo.getSimulationDetails).toHaveBeenCalled();
  });

  it('should throw an error when simulationInfo.initialize() is called with no prior knowledge of serverID or simulationID', function () {
    expect(simulationInfo.initialize).toThrow();
    expect(_.partial(simulationInfo.initialize, 'fake_id')).toThrow();
  });

  it('should set frontend and backend version strings', function() {
    var backendVersionString = {
      toString: 'Backend: 1.2.3'
    };
    nrpBackendVersions().get.and.callFake(function (fn) {
      fn(backendVersionString);
    });
    var frontendVersionString = {
      toString: 'Frontend: 4.5.6'
    };
    nrpFrontendVersion.get.and.callFake(function (fn) {
      fn(frontendVersionString);
    });

    // no serverBaseUrl
    simulationInfo.getVersionStrings();
    expect(simulationInfo.versionString).toBe(frontendVersionString.toString);


    // with serverBaseUrl
    simulationInfo.serverBaseUrl = 'test_base_url';
    simulationInfo.getVersionStrings();
    expect(simulationInfo.versionString).toBe(frontendVersionString.toString + backendVersionString.toString);
  });

  it('getSimulationDetails() - no serverBaseURL', function() {
    simulationInfo.serverBaseUrl = null;

    simulationInfo.getSimulationDetails();

    expect(simulationControl).not.toHaveBeenCalled();
  });

  it('getSimulationDetails() - no simulationID', function() {
    simulationInfo.simulationID = null;

    simulationInfo.getSimulationDetails();

    expect(simulationControl).not.toHaveBeenCalled();
  });

  it('getSimulationDetails() - normal run, local mode', function() {
    window.bbpConfig.localmode.forceuser = true;
    window.bbpConfig.localmode.ownerID = 'test_owner_ID';

    simulationInfo.serverBaseUrl = 'test_url';
    simulationInfo.simulationID = 'test_sim_id';

    var simulationDetails = {
      owner: 12345,
      experimentConfiguration: 'test_exp_config',
      environmentConfiguration: 'test_env_config',
      creationDate: 'test_date'
    };
    simulationControl().simulation.and.callFake(function(simData, callbackFn) {
      callbackFn(simulationDetails);
    });

    simulationInfo.getSimulationDetails();

    expect(simulationInfo.ownerID).toBe(simulationDetails.owner);
    expect(simulationInfo.experimentConfiguration).toBe(simulationDetails.experimentConfiguration);
    expect(simulationInfo.environmentConfiguration).toBe(simulationDetails.environmentConfiguration);
    expect(simulationInfo.creationDate).toBe(simulationDetails.creationDate);
    expect(simulationInfo.owner).toBe(window.bbpConfig.localmode.ownerID);
  });

  it('getSimulationDetails() - normal run, non-local mode', function() {
    window.bbpConfig.localmode.forceuser = false;

    simulationInfo.serverBaseUrl = 'test_url';
    simulationInfo.simulationID = 'test_sim_id';

    var simulationDetails = {
      owner: 'testDataOwnerID',
      experimentConfiguration: 'test_exp_config',
      environmentConfiguration: 'test_env_config',
      creationDate: 'test_date'
    };
    simulationControl().simulation.and.callFake(function(simData, callbackFn) {
      callbackFn(simulationDetails);
    });

    var profile = {
      testDataOwnerID: {
        displayName: 'test_display_name'
      }
    };

    hbpIdentityUserDirectory.get().then.and.callFake(function (callbackFn) {
      callbackFn(profile);
    });

    simulationInfo.getSimulationDetails();

    expect(simulationInfo.ownerID).toBe(simulationDetails.owner);
    expect(simulationInfo.experimentConfiguration).toBe(simulationDetails.experimentConfiguration);
    expect(simulationInfo.environmentConfiguration).toBe(simulationDetails.environmentConfiguration);
    expect(simulationInfo.creationDate).toBe(simulationDetails.creationDate);
    expect(simulationInfo.owner).toBe(profile.testDataOwnerID.displayName);
  });

});
