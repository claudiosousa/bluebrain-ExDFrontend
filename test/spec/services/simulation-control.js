'use strict';

var TestDataGenerator = window.TestDataGenerator;

describe('Services: server-info-service', function () {
  var hbpIdentityUserDirectory,
      bbpStubFactory,
      simulationService,
      simulationControl,
      simulationState,
      simulationGenerator,
      objectControl,
      scope,
      STATE;

  // load the service to test and mock the necessary service
  beforeEach(module('simulationControlServices'));
  beforeEach(module('bbpStubFactory'));

  var httpBackend, simulations, returnSimulations, experimentTemplates;

  beforeEach(inject(function (_$httpBackend_, $rootScope, _hbpIdentityUserDirectory_, _bbpStubFactory_,
      _simulationService_, _simulationControl_, _simulationState_, _simulationGenerator_,
      _objectControl_, _STATE_) {
    httpBackend = _$httpBackend_;
    scope = $rootScope.$new();
    hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
    bbpStubFactory = _bbpStubFactory_;
    simulationService = _simulationService_;
    simulationControl = _simulationControl_;
    simulationState = _simulationState_;
    simulationGenerator = _simulationGenerator_;
    objectControl = _objectControl_;
    STATE = _STATE_;

    simulations = [
      { simulationID: 0, experimentConfiguration: 'experimentConfiguration', state: STATE.CREATED, creationDate: (new Date()).toISOString(), owner: '1234'},
      { simulationID: 1, experimentConfiguration: 'experimentConfiguration', state: STATE.INITIALIZED},
      { simulationID: 2, experimentConfiguration: 'experimentConfiguration', state: STATE.PAUSED, owner: 'default-owner'},
      { simulationID: 3, experimentConfiguration: 'experimentConfiguration', state: STATE.STARTED, owner: '4321'},
      { simulationID: 4, experimentConfiguration: 'experimentConfiguration', state: STATE.STOPPED},
      { simulationID: 5, experimentConfiguration: 'experimentConfiguration', state: STATE.INITIALIZED},
      { simulationID: 6, experimentConfiguration: 'experimentConfiguration', state: STATE.CREATED, owner: 'invalid-id'}
    ];

    // The return simulations' entries are simply augmented with 'serverID' (being 'bbpce016')
    returnSimulations = (function() {
      simulations.forEach(function(element){
        element.serverID = 'bbpce016';
      });
      return simulations;
    })();

    experimentTemplates = {
      '1': TestDataGenerator.createTestExperiment(),
      '2': TestDataGenerator.createTestExperiment(),
      '3': TestDataGenerator.createTestExperiment()
    };

    httpBackend.whenGET('http://bbpce016.epfl.ch:8080/simulation').respond(simulations);
    httpBackend.whenGET('http://bbpce016.epfl.ch:8080/simulation/1').respond(simulations[1]);
    httpBackend.whenGET('http://bbpce016.epfl.ch:8080/simulation/1/state').respond({state: STATE.INITIALIZED, timeout:300});
    httpBackend.whenPUT(/()/).respond(200);
    httpBackend.whenPOST(/()/).respond(200);

    spyOn(console, 'error');

    var userInfo1234 = {
      displayName: 'John Does'
    };
    var userInfo4321 = {
      displayName: 'John Dont'
    };
    spyOn(hbpIdentityUserDirectory, 'get').andCallFake(function(ownerID) {
      var returnedPromise;
      switch(ownerID[0]) {
        case 'default-owner':
          returnedPromise = bbpStubFactory.promise({args: [{}]});
          break;
        case '1234':
          returnedPromise = bbpStubFactory.promise({args: [{'1234': userInfo1234}]});
          break;
        case '4321':
          returnedPromise = bbpStubFactory.promise({args: [{'4321': userInfo4321}]});
          break;
        default:
          returnedPromise = bbpStubFactory.promise({args: [{}]});
      }
      return returnedPromise;
    });
  }));

  describe('When calling the simulation method', function() {
    var receivedSimulations, serverURL, serverID;

    beforeEach(function(){
      serverURL = 'http://bbpce016.epfl.ch:8080';
      serverID = 'bbpce016';
      simulationService({ serverURL: serverURL, serverID : serverID }).simulations(function(data) {
        receivedSimulations = data;
      });
      httpBackend.expectGET(serverURL + '/simulation');
      httpBackend.flush();
    });

    it('should retrieve the simulation list', function() {
      expect(angular.toJson(receivedSimulations)).toBe(angular.toJson(returnSimulations));
    });

    it('should retrieve the owner of simulations map', function() {
      expect(simulationService().owners['1234']).toBe('John Does');
      expect(simulationService().owners['4321']).toBe('John Dont');
      expect(simulationService().owners['default-owner']).toBe('Unknown');
      expect(simulationService().owners['invalid-id']).toBe('Unknown');
    });

    it('should set the forced user as owner when in full local mode', function() {
      hbpIdentityUserDirectory.get.reset();
      for (var member in simulationService().owners) {
        delete simulationService().owners[member];
      }
      window.bbpConfig.localmode.forceuser = true;
      simulationService({ serverURL: serverURL, serverID : serverID }).simulations(function(data) {
        receivedSimulations = data;
      });
      httpBackend.expectGET(serverURL + '/simulation');
      httpBackend.flush();
      expect(hbpIdentityUserDirectory.get).not.toHaveBeenCalled();
      expect(Object.keys(simulationService().owners).length).toBe(1);
      expect(simulationService().owners.vonarnim).toBe('vonarnim');
      window.bbpConfig.localmode.forceuser = false;
    });

    it('should retrieve the uptime of a simulation', function() {
      simulationService().updateUptime();
      expect(simulationService().uptime['bbpce016-0'] >= 0).toBeTruthy();
      expect(simulationService().uptime['bbpce016-0']).toBeLessThan(1); // uptime should be around 0.001s, depending on machine.
    });
  });

  describe('When calling getActiveSimulation/filterSimulations in presence of failed simulations', function() {
    var simulations;

    beforeEach(function() {
      simulations = TestDataGenerator.createTestSimulations(10, STATE.FAILED);
    });

    it('should find a STARTED simulation', function() {
      var randomIndex = TestDataGenerator.randomInt(0,simulations.length-1);
      simulations[randomIndex].state = STATE.STARTED;
      expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[randomIndex]);
    });

    it('should find a INITIALIZED simulation', function() {
      var randomIndex = TestDataGenerator.randomInt(0,simulations.length-1);
      simulations[randomIndex].state = STATE.INITIALIZED;
      expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[randomIndex]);
    });

    it('should find a CREATED simulation', function() {
      var randomIndex = TestDataGenerator.randomInt(0,simulations.length-1);
      simulations[randomIndex].state = STATE.CREATED;
      expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[randomIndex]);
    });

    it('should find a HALTED simulation', function() {
      var randomIndex = TestDataGenerator.randomInt(0,simulations.length-1);
      simulations[randomIndex].state = STATE.HALTED;
      expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[randomIndex]);
    });

    it('should return undefined in case no running simulation is there', function() {
      expect(simulationService().getActiveSimulation(simulations)).toBe(undefined);
    });

    it('should filter out a STARTED simulation', function() {
      simulations[1].state = STATE.PAUSED;
      simulations[3].state = STATE.STARTED;
      expect(simulationService().filterSimulations(simulations, function (state) { return state === STATE.STARTED || state === STATE.PAUSED;}).state).toBe(STATE.STARTED);
    });

    it('should attach a filter function and filter simulations according to state and index in the list', function() {
      simulations[2].state = STATE.STARTED;
      simulations[3].state = STATE.PAUSED;
      simulations[5].state = STATE.INITIALIZED;

      expect(simulationService().filterSimulations(simulations, function (state) { return state === STATE.STARTED || state === STATE.PAUSED; }).state).toBe(STATE.PAUSED);
      expect(simulationService().filterSimulations(simulations, function (state) { return state === STATE.INITIALIZED;}).simulationID).toBe(5);

      // We expect it to be the last element
      expect(simulationService().filterSimulations(simulations, function (state) { return state === STATE.FAILED;}).simulationID).toBe(simulations.length-1);

      simulations[4].state = STATE.PAUSED;
      expect(simulationService().filterSimulations(simulations, function (state) { return state === STATE.STOPPED;})).toBe(undefined);
    });

  });

  describe('When calling getActiveSimulation/filterSimulations in presence of stopped simulations', function() {
    var simulations;

    beforeEach(function() {
      simulations = TestDataGenerator.createTestSimulations(10, STATE.STOPPED);
    });

    it('should find a STARTED simulation', function() {
      var randomIndex = TestDataGenerator.randomInt(0,simulations.length-1);
      simulations[randomIndex].state = STATE.STARTED;
      expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[randomIndex]);
    });

    it('should find a INITIALIZED simulation', function() {
      var randomIndex = TestDataGenerator.randomInt(0,simulations.length-1);
      simulations[randomIndex].state = STATE.INITIALIZED;
      expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[randomIndex]);
    });

    it('should find a CREATED simulation', function() {
      var randomIndex = TestDataGenerator.randomInt(0,simulations.length-1);
      simulations[randomIndex].state = STATE.CREATED;
      expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[randomIndex]);
    });

    it('should find a HALTED simulation', function() {
      var randomIndex = TestDataGenerator.randomInt(0,simulations.length-1);
      simulations[randomIndex].state = STATE.HALTED;
      expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[randomIndex]);
    });

    it('should return undefined in case no running simulation is there', function() {
      expect(simulationService().getActiveSimulation(simulations)).toBe(undefined);
    });

  });

  it('should fetch a specific simulation', function() {
    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */
    var sim;
    simulationControl('http://bbpce016.epfl.ch:8080').simulation({sim_id: 1}, function(data) { sim = data; });
    httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation/1');
    httpBackend.flush();
    expect(angular.toJson(sim)).toBe(angular.toJson(simulations[1]));
  });

  it('should fetch the state of a specific simulation', function() {
    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */
    var sim;
    simulationState('http://bbpce016.epfl.ch:8080').state({sim_id: 1}, function(data) { sim = data; });
    httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation/1/state');
    httpBackend.flush();
    expect(angular.toJson(sim)).toBe(angular.toJson({state: STATE.INITIALIZED, timeout:300}));
  });

  it('should set the state of a specific simulation', function() {
    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */
    simulationState('http://bbpce016.epfl.ch:8080').update({sim_id:1}, {state: STATE.PAUSED}, function(){});
    httpBackend.flush();
    httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/1/state', {state: STATE.PAUSED});
  });

  it('should generate a simulation', function() {
    simulationGenerator('http://bbpce016.epfl.ch:8080').create(function(){});
    httpBackend.flush();
    httpBackend.expectPOST('http://bbpce016.epfl.ch:8080/simulation');
  });

   it('should control the screen color', function() {
    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */
    objectControl('http://bbpce016.epfl.ch:8080').updateMaterial({sim_id:1}, {state: STATE.PAUSED}, function(){});
    httpBackend.flush();
    httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/1/interaction', {state: STATE.PAUSED});
  });

  it('should transform the response data', function() {
    //Mock http
    var httpMock = {};
    httpMock.defaults = {};
    httpMock.defaults.transformResponse = function(){};
    expect(simulationService().transformResponse(httpMock, 'test').length).toBe(2);
  });

  it('should return "Unknown" if the authentication is turned off, the user name otherwise', function() {
     var profile = {};
     expect(simulationService().getUserName(profile)).toBe('Unknown');
     var userName = 'johndoe';
     profile = { key: { displayName: userName} };
     expect(simulationService().getUserName(profile)).toBe(userName);
  });

});

describe('Services: experimentSimulationService', function () {
  var simulationService,
    experimentSimulationService,
    simulationGenerator,
    simulationState,
    experimentList,
    scope,
    bbpConfig,
    roslib,
    STATE,
    healthStatus;

  // load the service to test and mock the necessary service
  beforeEach(module('simulationControlServices'));

  var httpBackend, stateParams;
  var returnSimulations,
      experimentListCallBbpce014,
      experimentTemplates,
      experimentTemplatesAugmented,
      imagePreview,
      serversEnabled,
      simulationSDFWorld;

  var bbpConfigMock = {};
  var bbpConfigString =
  {
    'bbpce014': {
      'gzweb': {
        'websocket': 'ws://bbpce014.epfl.ch:7681', 'assets': 'http://bbpce014.epfl.ch', 'nrp-services': 'http://bbpce014.epfl.ch:8080'
      },
      'rosbridge': {
        'websocket': 'ws://bbpce014.epfl.ch:9090', 'topics': { 'status': '/ros_cle_simulation/status' }
      },
      'serverJobLocation' : 'lugano'
    },
    'bbpce016': {
      'gzweb': {
        'websocket': 'ws://bbpce016.epfl.ch:7681', 'assets': 'http://bbpce016.epfl.ch', 'nrp-services': 'http://bbpce016.epfl.ch:8080'
      },
      'rosbridge': {
        'websocket': 'ws://bbpce016.epfl.ch:9090', 'topics': { 'status': '/ros_cle_simulation/status' }
      }
    },
    'bbpsrvc21': {
      'gzweb': {
        'websocket': 'ws://bbpsrvc21.cscs.ch:7681', 'assets': 'http://bbpsrvc21.cscs.ch', 'nrp-services': 'http://bbpsrvc21.cscs.ch:8080'
      },
      'rosbridge': {
        'websocket': 'ws://bbpsrvc21.cscs.ch:9090', 'topics': { 'status': '/ros_cle_simulation/status' }
      }
    }
  };
  bbpConfigMock.get = jasmine.createSpy('get').andReturn(bbpConfigString);

  // Mock simulationServices
  var simulationServiceObject = {};
  var simulationServiceMock = jasmine.createSpy('simulationService').andReturn(simulationServiceObject);

  var roslibMock = {};
  var nrpAnalyticsMock = {
    eventTrack: function() {},
    tickDurationEvent: function() {},
    durationEventTrack: function() {},
  };
  var rosConnectionMock = {};
  var statusListenerMock;
  var experimentListMockObject = { experiments: jasmine.createSpy('experiments')};
  var experimentListMock = jasmine.createSpy('experimentList').andReturn(experimentListMockObject);
  var simulationSDFWorldObject = {
    import: jasmine.createSpy('import')
  };
  var simulationSDFWorldMock = jasmine.createSpy('simulationSDFWorld').andReturn(simulationSDFWorldObject);

  beforeEach(module(function ($provide) {
    $provide.constant('bbpConfig', bbpConfigMock);
    $provide.value('simulationService', simulationServiceMock);
    $provide.value('roslib', roslibMock);
    $provide.value('nrpAnalytics', nrpAnalyticsMock);
    var simulationGeneratorMock = jasmine.createSpy('simulationGenerator').andReturn(
      { create: jasmine.createSpy('create')}
    );
    $provide.value('simulationGenerator', simulationGeneratorMock);
    var simulationStateMock = jasmine.createSpy('simulationState').andReturn(
      { state: jasmine.createSpy('state'),
        update: jasmine.createSpy('update')}
    );
    $provide.value('simulationState', simulationStateMock);
    $provide.value('experimentList', experimentListMock);
    $provide.value('simulationSDFWorld', simulationSDFWorldMock);
  }));

  beforeEach(inject(function (
    $httpBackend,
    $rootScope,
    $stateParams,
    _simulationService_,
    _simulationGenerator_,
     _simulationState_,
     _experimentSimulationService_,
     _experimentList_,
     _bbpConfig_,
     _roslib_,
     _STATE_,
     _simulationSDFWorld_)
  {
    httpBackend = $httpBackend;
    scope = $rootScope.$new();
    stateParams = $stateParams;
    stateParams.ctx = undefined;
    simulationService = _simulationService_;
    simulationGenerator = _simulationGenerator_;
    experimentSimulationService = _experimentSimulationService_;
    simulationState = _simulationState_;
    experimentList = _experimentList_;
    bbpConfig = _bbpConfig_;
    roslib = _roslib_;
    STATE = _STATE_;
    simulationSDFWorld = _simulationSDFWorld_;

    healthStatus = {
      bbpce014: 'CRITICAL',
      bbpce016: 'OK',
      bbpsrvc21: 'WARNING'
    };

    // Create 7 experiments, all being the same, except for 3, which has experimentConfiguration 'fakeExperiment2.xml'
    returnSimulations = (function () {
      var simulations = [];
      for (var i = 0; i < 7; i++) {
        simulations.push({
          simulationID: i,
          experimentConfiguration: 'fakeExperiment' + ((i === 3) ? 2 : i) + '.xml',
          state: STATE.CREATED,
          serverID: 'bbpce016'
        });
      }
      return simulations;
    })();

    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(returnSimulations[3]);
    simulationServiceObject.simulations = jasmine.createSpy('simulations').andReturn({$promise: {then: function(){}}});

    // introduce same '1' experiment on other server to pass through if branch in getExperiments
    experimentListCallBbpce014 = {
      data : {
        'fakeExperiment1.xml': {
          name: 'FakeName 1', description: 'Some Fake Description 1', experimentConfiguration: 'fakeExperiment1.xml', timeout: 100
        }
      }
    };

    experimentTemplates = {
      'fakeExperiment1.xml': {
        imageData: 'base64XF5Tf', name: 'FakeName 1', description: 'Some Fake Description 1', experimentConfiguration: 'fakeExperiment1.xml', serverPattern:['bbpce014','bbpce016'], timeout: 100, numSupportingServers: 2, numAvailableServers : 0
      },
      'fakeExperiment2.xml': {
        imageData: 'base64XF5Tf', name: 'FakeName 2', description: 'Some Fake Description 2', experimentConfiguration: 'fakeExperiment2.xml', serverPattern:['bbpce016'], timeout: 200, numSupportingServers: 2, numAvailableServers : 0
      },
      'fakeExperiment3.xml': {
        imageData: 'base64XF5Tf', name: 'FakeName 3', description: 'Some Fake Description 3', experimentConfiguration: 'fakeExperiment3.xml', serverPattern:['bbpce016'], timeout: 300, numSupportingServers: 2, numAvailableServers : 0
      }
    };

    experimentTemplatesAugmented = {
      'fakeExperiment1.xml': {
        imageData: 'base64XF5Tf', name: 'FakeName 1', description: 'Some Fake Description 1', experimentConfiguration: 'fakeExperiment1.xml', serverPattern:['bbpce014','bbpce016'], timeout: 100, numSupportingServers: 2, numAvailableServers : 0
      },
      'fakeExperiment2.xml': {
        imageData: 'base64XF5Tf', name: 'FakeName 2', description: 'Some Fake Description 2', experimentConfiguration: 'fakeExperiment2.xml', serverPattern:['bbpce016'], timeout: 200, numSupportingServers: 2, numAvailableServers : 0, runningExperiments: 1,
        simulations: [
          returnSimulations[3]
        ],
        contextlessSimulations: [
          returnSimulations[3]
        ]},
      'fakeExperiment3.xml': {
        imageData: 'base64XF5Tf', name: 'FakeName 3', description: 'Some Fake Description 3', experimentConfiguration: 'fakeExperiment3.xml', serverPattern:['bbpce016'], timeout: 300, numSupportingServers: 2, numAvailableServers : 0
      }
    };

    imagePreview = {
        'image_as_base64': 'base64XF5Tf'
    };

    serversEnabled = ['bbpce014','bbpce016', 'bbpce018'];

    httpBackend.whenGET('http://bbpce014.epfl.ch:8080/experiment').respond(experimentTemplates);
    httpBackend.whenGET(/^http:\/\/bbpce\d\d\d\.epfl\.ch:8080\/experiment\/fakeExperiment[123]\.xml\/preview$/).respond(imagePreview);
    httpBackend.whenGET(/^http:\/\/bbpsrvc\d\d\.cscs\.ch:8080\/experiment\/fakeExperiment[123]\.xml\/preview$/).respond(imagePreview);
    spyOn(console, 'error');
    spyOn(console, 'log').andCallThrough();

    rosConnectionMock.close = jasmine.createSpy('close');
    roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn(rosConnectionMock);
    statusListenerMock = {
      subscribe: jasmine.createSpy('subscribe'),
      unsubscribe: jasmine.createSpy('unsubscribe'),
      removeAllListeners: jasmine.createSpy('removeAllListeners')
    };
    roslibMock.createStringTopic = jasmine.createSpy('createStringTopic').andReturn(statusListenerMock);
  }));

  it('should refresh the experiment template data structure', function() {
    // the simulation should be added to the experimentTemplates
    experimentSimulationService.refreshExperiments(experimentTemplates, serversEnabled);
    var argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
    argumentFunction(returnSimulations);
    expect(experimentTemplates).toEqual(experimentTemplatesAugmented);

    // There should be no change
    var savedExperimentTemplates = angular.copy(experimentTemplates);
    experimentSimulationService.refreshExperiments(experimentTemplates, serversEnabled);
    argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
    argumentFunction(returnSimulations);
    expect(experimentTemplates).toEqual(savedExperimentTemplates);

    // The simulation should be updated
    experimentSimulationService.refreshExperiments(experimentTemplates, serversEnabled);
    argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(returnSimulations[2]);
    argumentFunction(returnSimulations);
    expect(returnSimulations[2].experimentConfiguration).toBe(returnSimulations[3].experimentConfiguration);
    expect(experimentTemplates[returnSimulations[3].experimentConfiguration].runningExperiments).toBe(1);
    expect(experimentTemplates[returnSimulations[3].experimentConfiguration].simulations).toEqual([returnSimulations[2]]);

    // Simulation should be removed when no simulation is running on the server
    experimentSimulationService.refreshExperiments(experimentTemplates, serversEnabled);
    argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(undefined);
    argumentFunction([]);
    expect(experimentTemplates[returnSimulations[3].experimentConfiguration].runningExperiments).toBe(0);
    expect(experimentTemplates[returnSimulations[3].experimentConfiguration].simulations).toEqual([]);
  });

  it('should call correctly startNewExperiments when calling startNewExperiment', function() {
    var oldSnes = experimentSimulationService.startNewExperiments;
    var oldGse = experimentSimulationService.getServersEnable;

    spyOn(experimentSimulationService, 'startNewExperiments');
    spyOn(experimentSimulationService, 'getServersEnable');

    experimentSimulationService.startNewExperiment('expconf', 'envconf', 'serverPattern', null);
    expect(experimentSimulationService.startNewExperiments).toHaveBeenCalled();
    expect(experimentSimulationService.getServersEnable).toHaveBeenCalled();

    experimentSimulationService.startNewExperiments = oldSnes;
    experimentSimulationService.getServersEnable = oldGse;
  });

  it('should change the state from INITIALIZED to STOPPED when calling stopExperimentOnServer', function() {
    expect(experimentTemplatesAugmented['fakeExperiment2.xml'].runningExperiments).toBe(1);
    experimentSimulationService.stopExperimentOnServer(experimentTemplatesAugmented, 'bbpce016', 'fakeSimulationID');
    expect(simulationState).toHaveBeenCalledWith(bbpConfigString.bbpce016.gzweb['nrp-services']);
    /* jshint camelcase: false */
    expect(simulationState().state).toHaveBeenCalledWith({sim_id: 'fakeSimulationID'}, jasmine.any(Function));

    // If the state is INITIALIZED then first change to STARTED then STOPPED
    simulationState().state.mostRecentCall.args[1]({state: STATE.INITIALIZED});
    expect(simulationState().update).toHaveBeenCalledWith({sim_id: 'fakeSimulationID'}, {state: STATE.STARTED}, jasmine.any(Function));
    simulationState().update.mostRecentCall.args[2]();
    expect(simulationState().update).toHaveBeenCalledWith({sim_id: 'fakeSimulationID'}, {state: STATE.STOPPED}, jasmine.any(Function));
    simulationState().update.mostRecentCall.args[2]();
    expect(experimentTemplatesAugmented['fakeExperiment2.xml'].runningExperiments).toBe(0);
  });

  it('should change the state from STARTED to STOPPED when calling stopExperimentOnServer', function() {
    expect(experimentTemplatesAugmented['fakeExperiment2.xml'].runningExperiments).toBe(1);
    experimentSimulationService.stopExperimentOnServer(experimentTemplatesAugmented, 'bbpce016', 'fakeSimulationID');
    expect(simulationState).toHaveBeenCalledWith(bbpConfigString.bbpce016.gzweb['nrp-services']);
    /* jshint camelcase: false */
    expect(simulationState().state).toHaveBeenCalledWith({sim_id: 'fakeSimulationID'}, jasmine.any(Function));

    // If the state is STARTED then change to STOPPED
    simulationState().state.mostRecentCall.args[1]({state: STATE.STARTED});
    expect(simulationState().update).toHaveBeenCalledWith({sim_id: 'fakeSimulationID'}, {state: STATE.STOPPED}, jasmine.any(Function));
    simulationState().update.mostRecentCall.args[2]();
    expect(experimentTemplatesAugmented['fakeExperiment2.xml'].runningExperiments).toBe(0);
  });

  it('should change the state from PAUSED to STOPPED when calling stopExperimentOnServer', function() {
    expect(experimentTemplatesAugmented['fakeExperiment2.xml'].runningExperiments).toBe(1);
    experimentSimulationService.stopExperimentOnServer(experimentTemplatesAugmented, 'bbpce016', 'fakeSimulationID');
    expect(simulationState).toHaveBeenCalledWith(bbpConfigString.bbpce016.gzweb['nrp-services']);
    /* jshint camelcase: false */
    expect(simulationState().state).toHaveBeenCalledWith({sim_id: 'fakeSimulationID'}, jasmine.any(Function));

    // If the state is PAUSED then change to STOPPED
    simulationState().state.mostRecentCall.args[1]({state: STATE.PAUSED});
    expect(simulationState().update).toHaveBeenCalledWith({sim_id: 'fakeSimulationID'}, {state: STATE.STOPPED}, jasmine.any(Function));
    simulationState().update.mostRecentCall.args[2]();
    expect(experimentTemplatesAugmented['fakeExperiment2.xml'].runningExperiments).toBe(0);
  });

  describe('Tests involving getExperiments method', function() {
    var TestDataGenerator = window.TestDataGenerator;

    // The experiments that are given as a parameter to the getExperiments method and which are "filled up".
    // (TODO: This also means the incoming parameter is modified, which is considered to be bad practice:
    // http://programmers.stackexchange.com/questions/245767/is-it-an-antipattern-modifying-an-incoming-parameter )
    var experimentsFetched = {};

    var experimentsFromTheServer = {
      data: {
        'fakeExperiment1.xml': TestDataGenerator.createTestExperiment(),
        'fakeExperiment2.xml': TestDataGenerator.createTestExperiment(),
        'fakeExperiment3.xml': TestDataGenerator.createTestExperiment()
      }
    };

    var messageCallback;
    var mockedThen;
    var emptyCallback = function() {};

    beforeEach(function(){
      messageCallback = jasmine.createSpy('messageCallback');
      mockedThen = jasmine.createSpy('then');
      simulationServiceObject.simulations = jasmine.createSpy('simulations').andReturn(
        {
          $promise: {then: mockedThen}
        });
      experimentListMockObject.experiments = jasmine.createSpy('experiments').andReturn(
        {
          $promise: {then: mockedThen}
        });
      simulationService.reset();
      console.log.reset();
    });

    it('should extend the fetched experiments from the server with the proper imageData', function () {
      var base64EncodedImageResult = 'base64XF5Tf';

      experimentSimulationService.getExperiments(experimentsFetched);
      experimentList().experiments.mostRecentCall.args[0](experimentsFromTheServer);
      httpBackend.flush();

      Object.keys(experimentsFromTheServer.data).forEach(function (experimentKey) {
        expect(experimentsFetched[experimentKey].imageData).toEqual(base64EncodedImageResult);
      });
    });

    it('should callback when all servers have answered to the query', function() {
      var queryingServersFinishedCallback = jasmine.createSpy('queryingServersFinishedCallback');
      simulationService().simulations.reset();
      experimentSimulationService.refreshExperiments(experimentsFetched, serversEnabled, emptyCallback, queryingServersFinishedCallback);
      // Resolve the deferred variables
      mockedThen.argsForCall.forEach(function (argument) {
        argument[0]();
      });
      // We have to use scope.$digest() here, since otherwise the used promises would not be resolved,
      // also see: http://stackoverflow.com/questions/24211312/angular-q-when-is-not-resolved-in-karma-unit-test
      scope.$digest();

      expect(queryingServersFinishedCallback).toHaveBeenCalled();
    });

    it('should output no error when callback was not defined', function() {
      console.error.reset();
      simulationService().simulations.reset();
      experimentSimulationService.refreshExperiments(experimentsFetched, serversEnabled, emptyCallback, undefined);
      // Resolve the deferred variables
      mockedThen.argsForCall.forEach(function (argument) {
        argument[0]();
      });
      // We have to use scope.$digest() here, since otherwise the used promises would not be resolved,
      // also see: http://stackoverflow.com/questions/24211312/angular-q-when-is-not-resolved-in-karma-unit-test
      expect(scope.$digest).not.toThrow();
    });

    it('should register for status information', function() {
      var simulationID = 0;
      var serverID = 'bbpce016';

      // register our callback for progress messages
      experimentSimulationService.setProgressMessageCallback(messageCallback);
      experimentSimulationService.registerForStatusInformation(serverID, simulationID);

      expect(roslib.getOrCreateConnectionTo).toHaveBeenCalledWith('ws://bbpce016.epfl.ch:9090');
      expect(roslib.createStringTopic).toHaveBeenCalledWith(rosConnectionMock, '/ros_cle_simulation/status');

      expect(statusListenerMock.subscribe).toHaveBeenCalled();
      var dataNotDone = { data : '{"progress": {"task": "mock_task", "subtask": "mock_subtask"}}'};
      statusListenerMock.subscribe.mostRecentCall.args[0](dataNotDone);
      expect(messageCallback).toHaveBeenCalledWith({ main: 'mock_task', sub: 'mock_subtask'});

      messageCallback.reset();
      var dataDone = { data : '{"progress": {"done": "true"}}'};
      statusListenerMock.subscribe.mostRecentCall.args[0](dataDone);
      expect(messageCallback).toHaveBeenCalledWith({ main: 'Simulation initialized.' });
    });

    it('should test the launch of an experiment on a given server', function() {
      var expectedOperatingMode = 'edit';
      var serverID = 'bbpce014';
      var simulationID = 'mocked_sim_id';
      stateParams.ctx = '97923877-13ea-4b43-ac31-6b79e130d344';
      experimentSimulationService.setProgressMessageCallback(messageCallback);
      var initializedCallback = jasmine.createSpy('initializedCallback');
      experimentSimulationService.setInitializedCallback(initializedCallback);

      experimentSimulationService.launchExperimentOnServer('mocked_experiment_conf', null, serverID, null);
      expect(messageCallback).toHaveBeenCalled();
      expect(simulationGenerator).toHaveBeenCalledWith(bbpConfigString.bbpce014.gzweb['nrp-services'], null);

      var simulationGeneratorMockObject = simulationGenerator();
      expect(simulationGeneratorMockObject.create).toHaveBeenCalledWith(
        {
          experimentConfiguration: 'mocked_experiment_conf',
          /* jshint camelcase: false */
          gzserverHost: 'lugano',
          operationMode: expectedOperatingMode,
          contextID: stateParams.ctx
        },
        jasmine.any(Function)
      );
      simulationGeneratorMockObject.create.mostRecentCall.args[1]({ simulationID : simulationID});

      expect(messageCallback).toHaveBeenCalled();
      expect(simulationState).toHaveBeenCalledWith('http://bbpce014.epfl.ch:8080', null);
      expect(simulationState().update).toHaveBeenCalledWith({sim_id: simulationID}, {state: STATE.INITIALIZED}, jasmine.any(Function));
      var updateFunction = simulationState().update.mostRecentCall.args[2];
      simulationState().update.reset();
      updateFunction();
      expect(simulationState().update).toHaveBeenCalledWith({sim_id: simulationID}, {state: STATE.STARTED}, jasmine.any(Function));
      updateFunction = simulationState().update.mostRecentCall.args[2];
      simulationState().update.reset();
      updateFunction();
      expect(simulationState().update).toHaveBeenCalledWith({sim_id: simulationID}, {state: STATE.PAUSED}, jasmine.any(Function));
      updateFunction = simulationState().update.mostRecentCall.args[2];

      // Test for initialized Callback
      updateFunction();
      var url = 'esv-web/gz3d-view/' + serverID + '/' + simulationID + '/' + expectedOperatingMode;
      expect(initializedCallback).toHaveBeenCalledWith(url);

      // Should not throw an error when the callback is not defined
      experimentSimulationService.setInitializedCallback(undefined);
      expect(updateFunction).not.toThrow();
    });

    it('should start the experiment in edit mode', function() {
      experimentSimulationService.setProgressMessageCallback(messageCallback);
      experimentSimulationService.launchExperimentOnServer('mocked_experiment_conf', null, 'bbpce014', null);
      var simulationGeneratorMockObject = simulationGenerator();
      expect(simulationGeneratorMockObject.create).toHaveBeenCalledWith({
        experimentConfiguration: 'mocked_experiment_conf',
        /* jshint camelcase: false */
        gzserverHost: 'lugano',
        operationMode: 'edit'
      },
        jasmine.any(Function));
    });

    it('should start a new experiment', function(){
      experimentSimulationService.setProgressMessageCallback(messageCallback);

      simulationService.reset();

      experimentSimulationService.startNewExperiments('experiment_conf', null, serversEnabled, ['bbpce014', 'bbpce016'], emptyCallback);

      expect(simulationService).toHaveBeenCalledWith({serverURL: 'http://bbpce014.epfl.ch:8080', serverID: 'bbpce014'});
      expect(simulationService).toHaveBeenCalledWith({serverURL: 'http://bbpce016.epfl.ch:8080', serverID: 'bbpce016'});

      simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(undefined);
      simulationServiceObject.simulations.mostRecentCall.args[0](returnSimulations);
      expect(messageCallback).toHaveBeenCalled();

      var returnSimulations2 = [
        { simulationID: 0, experimentConfiguration: '0', state: STATE.STOPPED, serverID : 'bbpce016'},
        { simulationID: 1, experimentConfiguration: '1', state: STATE.STOPPED, serverID : 'bbpce016'}
      ];

      messageCallback.reset();
      simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn({ simulationID: 0, experimentConfiguration: '0', state: STATE.STARTED, serverID : 'bbpce016'});
      simulationServiceObject.simulations.mostRecentCall.args[0](returnSimulations2);
      expect(messageCallback).not.toHaveBeenCalled();
    });

    it('should upload the new environment if any when calling startNewExperiments', function () {
      experimentSimulationService.setProgressMessageCallback(messageCallback);

      experimentSimulationService.startNewExperiments('experiment_conf', 'notnull', serversEnabled, ['bbpce014', 'bbpce016'], emptyCallback);

      simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(undefined);
      simulationServiceObject.simulations.mostRecentCall.args[0](returnSimulations);

      expect(simulationSDFWorldObject.import).toHaveBeenCalled();

      var oldLeos = experimentSimulationService.launchExperimentOnServer;
      experimentSimulationService.launchExperimentOnServer = jasmine.createSpy('launchExperimentOnServer').andCallFake(function(){});
      // spyOn(experimentSimulationService, 'launchExperimentOnServer').andCallFake(function () {});
      simulationSDFWorldObject.import.mostRecentCall.args[1]({path: 'dummy'});
      expect(experimentSimulationService.launchExperimentOnServer).toHaveBeenCalled();
      // experimentSimulationService.launchExperimentOnServer.andCal
      // lThrough();
      experimentSimulationService.launchExperimentOnServer = oldLeos;
    });

    it('should pass environmentConfiguration to the backend iff it\'s defined', function () {
      experimentSimulationService.setProgressMessageCallback(messageCallback);

      experimentSimulationService.launchExperimentOnServer('experiment_conf', 'environment_conf', 'bbpce014', emptyCallback);
      var simulationGeneratorMockObject = simulationGenerator();
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].experimentConfiguration).toBe('experiment_conf');
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].gzserverHost).toBe('lugano');
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].environmentConfiguration).toBe('environment_conf');
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].operationMode).toBe('edit');

      experimentSimulationService.launchExperimentOnServer('experiment_conf', undefined, 'bbpce014', emptyCallback);

      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].experimentConfiguration).toBe('experiment_conf');
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].gzserverHost).toBe('lugano');
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].environmentConfiguration).toBeUndefined();
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].operationMode).toBe('edit');

      experimentSimulationService.launchExperimentOnServer('experiment_conf', null, 'bbpce014', emptyCallback);

      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].experimentConfiguration).toBe('experiment_conf');
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].gzserverHost).toBe('lugano');
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].environmentConfiguration).toBeUndefined();
      expect(simulationGeneratorMockObject.create.mostRecentCall.args[0].operationMode).toBe('edit');
    });

  });

  it('should check for an available Server', function(){
    var isAvailableCallback = jasmine.createSpy('isAvailableCallback');
    // Set which server is occupied with running simulations or not
    var serverAvailableHash = {'bbpce014': true, 'bbpce016': true}; // All servers are available
    experimentSimulationService.existsAvailableServer(experimentTemplates, serversEnabled, serverAvailableHash, isAvailableCallback);
    expect(experimentTemplates['fakeExperiment1.xml'].numSupportingServers).toBe(2);
    expect(experimentTemplates['fakeExperiment1.xml'].numAvailableServers).toBe(2);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment1.xml', true);

    expect(experimentTemplates['fakeExperiment2.xml'].numSupportingServers).toBe(1);
    expect(experimentTemplates['fakeExperiment2.xml'].numAvailableServers).toBe(1);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment2.xml', true);

    expect(experimentTemplates['fakeExperiment3.xml'].numSupportingServers).toBe(1);
    expect(experimentTemplates['fakeExperiment3.xml'].numAvailableServers).toBe(1);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment3.xml', true);

    isAvailableCallback.reset();

    // Set which server is occupied with running simulations or not
    serverAvailableHash = {'bbpce014': true, 'bbpce016': false}; // Only server bbpce014 is available
    experimentSimulationService.existsAvailableServer(experimentTemplates, serversEnabled, serverAvailableHash, isAvailableCallback);
    expect(experimentTemplates['fakeExperiment1.xml'].numSupportingServers).toBe(2);
    expect(experimentTemplates['fakeExperiment1.xml'].numAvailableServers).toBe(1);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment1.xml', true);

    expect(experimentTemplates['fakeExperiment2.xml'].numSupportingServers).toBe(1);
    expect(experimentTemplates['fakeExperiment2.xml'].numAvailableServers).toBe(0);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment2.xml', false);

    expect(experimentTemplates['fakeExperiment3.xml'].numSupportingServers).toBe(1);
    expect(experimentTemplates['fakeExperiment3.xml'].numAvailableServers).toBe(0);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment3.xml', false);

    isAvailableCallback.reset();

    // Set which server is occupied with running simulations or not
    serverAvailableHash = {'bbpce014': false, 'bbpce016': true}; // Only server bbpce016 is available
    experimentSimulationService.existsAvailableServer(experimentTemplates, serversEnabled, serverAvailableHash, isAvailableCallback);
    expect(experimentTemplates['fakeExperiment1.xml'].numSupportingServers).toBe(2);
    expect(experimentTemplates['fakeExperiment1.xml'].numAvailableServers).toBe(1);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment1.xml', true);

    expect(experimentTemplates['fakeExperiment2.xml'].numSupportingServers).toBe(1);
    expect(experimentTemplates['fakeExperiment2.xml'].numAvailableServers).toBe(1);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment2.xml', true);

    expect(experimentTemplates['fakeExperiment3.xml'].numSupportingServers).toBe(1);
    expect(experimentTemplates['fakeExperiment3.xml'].numAvailableServers).toBe(1);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment3.xml', true);

    isAvailableCallback.reset();

    // Set which server is occupied with running simulations or not
    serverAvailableHash = {'bbpce014': false, 'bbpce016': false}; // No server is available
    experimentSimulationService.existsAvailableServer(experimentTemplates, serversEnabled, serverAvailableHash, isAvailableCallback);
    expect(experimentTemplates['fakeExperiment1.xml'].numSupportingServers).toBe(2);
    expect(experimentTemplates['fakeExperiment1.xml'].numAvailableServers).toBe(0);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment1.xml', false);

    expect(experimentTemplates['fakeExperiment2.xml'].numSupportingServers).toBe(1);
    expect(experimentTemplates['fakeExperiment2.xml'].numAvailableServers).toBe(0);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment2.xml', false);

    expect(experimentTemplates['fakeExperiment3.xml'].numSupportingServers).toBe(1);
    expect(experimentTemplates['fakeExperiment3.xml'].numAvailableServers).toBe(0);
    expect(isAvailableCallback).toHaveBeenCalledWith('fakeExperiment3.xml', false);

    isAvailableCallback.reset();

  });

  it ('should get the available servers properly when they are not stored in localstorage', function() {
    localStorage.getItem.isSpy = false;
    spyOn(localStorage, 'getItem').andCallFake(function (key) { // jshint ignore:line
      return null;
    });
    expect(experimentSimulationService.getServersEnable()).toEqual([Object.keys(bbpConfigString)[2]]);
  });

  it ('should get the available servers properly when they are  stored in localstorage', function() {
    var servers = ['foo','bar'];
    localStorage.getItem.isSpy = false;
    spyOn(localStorage, 'getItem').andCallFake(function (key) { // jshint ignore:line
      return angular.toJson(servers);
    });
    expect(experimentSimulationService.getServersEnable()).toEqual(servers);
  });

  it('should return Healthy servers', function () {
    var servers = Object.keys(bbpConfigString);
    var EXPECTED_SORT_ORDER = ['bbpce016', 'bbpsrvc21', 'bbpce014'];
    servers.forEach(function (server) {
      httpBackend.whenGET(bbpConfigString[server].gzweb['nrp-services'] + '/health/errors').respond(200, { state: healthStatus[server] });
    });
    var healthyServers;
    experimentSimulationService.getHealthyServers()
      .then(function (servers) {
        healthyServers = servers;
      });
    httpBackend.flush();
    scope.$digest();
    //expect servers to be sorted by status
    healthyServers.forEach(function (s, i) {
      expect(s.id).toBe(EXPECTED_SORT_ORDER[i]);
    });
  });

  it('should consider a server failing when response to health check contains the CRITICAL state', function () {
    var servers = Object.keys(bbpConfigString);

    var EXPECTED_SORT_ORDER = ['bbpsrvc21', 'bbpce014', 'bbpce016'];
    servers.forEach(function (server) {
      httpBackend.whenGET(bbpConfigString[server].gzweb['nrp-services'] + '/health/errors').respond(server === 'bbpce016' ? 500 : 200, { state: healthStatus[server] });
    });
    var healthyServers;
    experimentSimulationService.getHealthyServers()
      .then(function (servers) {
        healthyServers = servers;
      });
    httpBackend.flush();
    scope.$digest();
    //expect servers to be sorted by status
    healthyServers.forEach(function (s, i) {
      expect(s.id).toBe(EXPECTED_SORT_ORDER[i]);
    });
  });
});

describe('Services: error handling', function () {
  var httpBackend;
  var serverError, simulationService, simulationControl;
  var simulationGenerator, simulationState, experimentSimulationService, serversEnabled;
  var objectControl;
  serversEnabled = ['bbpce014','bbpce016', 'bbpce018'];

  beforeEach(module('exd.templates','simulationControlServices'));

  var roslibMock = {};
  roslibMock.createStringTopic = jasmine.createSpy('createStringTopic').andReturn({ subscribe: function(){} });
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn({});

  var serverErrorMock = jasmine.createSpy('serverError');
  serverErrorMock.display = jasmine.createSpy('display');
  beforeEach(module(function ($provide) {
    $provide.value('serverError', serverErrorMock);
    $provide.value('roslib', roslibMock);
  }));

  beforeEach(inject(function($httpBackend,_simulationService_, _simulationControl_,
     _simulationGenerator_, _simulationState_, _experimentSimulationService_, _objectControl_, _serverError_){

    httpBackend = $httpBackend;
    serverError = _serverError_;
    serverError.display.reset();
    simulationService = _simulationService_;
    simulationControl = _simulationControl_;
    simulationGenerator = _simulationGenerator_;
    simulationState = _simulationState_;
    experimentSimulationService = _experimentSimulationService_;
    objectControl = _objectControl_;
    httpBackend.whenPUT(/\/simulation/).respond(500);
  }));

  afterEach(function() {
     httpBackend.verifyNoOutstandingExpectation();
     httpBackend.verifyNoOutstandingRequest();
   });

  it('should call once serverError.display for every failing service', function() {
    var serverURL = 'http://bbpce014.epfl.ch:8080';
    var serverID = 'bbpce014';
    var response;
    httpBackend.whenGET(/\/simulation/).respond(400);

    simulationService({serverURL: serverURL, serverID: serverID}).simulations();
    httpBackend.expectGET(serverURL + '/simulation');
    httpBackend.flush();
    expect(serverError.display.callCount).toBe(1);
    response = serverError.display.mostRecentCall.args[0];
    expect(response.status).toBe(400);
    serverError.display.reset();

    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */
    var simulationID = { sim_id: '0'};
    simulationControl(serverURL).simulation(simulationID);
    httpBackend.expectGET(serverURL + '/simulation/' + simulationID.sim_id);
    httpBackend.flush();
    expect(serverError.display.callCount).toBe(1);
    response = serverError.display.mostRecentCall.args[0];
    expect(response.status).toBe(400);
    serverError.display.reset();

    simulationState(serverURL).state(simulationID);
    httpBackend.expectGET(serverURL + '/simulation/' + simulationID.sim_id + '/state');
    httpBackend.flush();
    expect(serverError.display.callCount).toBe(1);
    response = serverError.display.mostRecentCall.args[0];
    expect(response.status).toBe(400);
    serverError.display.reset();

   objectControl(serverURL).updateMaterial(simulationID, {});
    httpBackend.expectPUT(serverURL + '/simulation/' + simulationID.sim_id + '/interaction/material_change', {});
    httpBackend.flush();
    expect(serverError.display.callCount).toBe(1);
    response = serverError.display.mostRecentCall.args[0];
    expect(response.status).toBe(500);
  });

  var testErrorCallbackWithErrorDisplay = function(isFatalError) {
    serverError.display.reset();
    httpBackend.whenPOST(/()/).respond(500, isFatalError ? {message: 'cluster'} : {message: 'Another'});
    httpBackend.whenGET(/()/).respond(200);
    httpBackend.whenPUT(/()/).respond(200);
    experimentSimulationService.setProgressMessageCallback(jasmine.createSpy('messageCallback'));
    var errorCallback = jasmine.createSpy('errorCallback');
    experimentSimulationService.launchExperimentOnServer('mocked_experiment_conf', null, 'bbpce014', errorCallback);
    httpBackend.flush();
    expect(errorCallback.callCount).toBe(1);
    expect(serverError.display.callCount).toBe(isFatalError ? 1 : 0);
  };

  it('should test the error callback and call display when launching an experiment fails', function() {
    testErrorCallbackWithErrorDisplay(true);
  });

  // Define a separate test because httpBackend needs to be reset with afterEach()
  it('should test the error callback but shouldn\'t call display if launching an experiment fails', function() {
    testErrorCallbackWithErrorDisplay(false);
  });

  it('should not call serverError for a failing GET /simulation request with 504 or a -1 status', function() {
    var serverURL = 'http://bbpce014.epfl.ch:8080';
    var serverID = 'bbpce014';
    httpBackend.whenGET(/\/simulation/).respond(504);
    simulationService({serverURL: serverURL, serverID: serverID}).simulations();
    httpBackend.expectGET(serverURL + '/simulation');
    httpBackend.flush();
    expect(serverError.display.callCount).toBe(0);

    httpBackend.whenGET(/\/simulation/).respond(-1);
    simulationService({serverURL: serverURL, serverID: serverID}).simulations();
    httpBackend.expectGET(serverURL + '/simulation');
    httpBackend.flush();
    expect(serverError.display.callCount).toBe(0);
  });
});

describe('Start simulation error handling', function () {
  var httpBackend, experimentSimulationService;
  var servers = ['bbpce014','bbpce016', 'bbpce018', 'bbpsrvc020'];

  beforeEach(module('simulationControlServices'));

  var roslibMock = {};
  roslibMock.createStringTopic = jasmine.createSpy('createStringTopic').andReturn({ subscribe: function () { } });
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn({});
  var hbpIdentityUserDirectoryMock = {get: jasmine.createSpy('getCurrentUser').andReturn({})};
  var nrpAnalyticsMock = {
    eventTrack: jasmine.createSpy('eventTrack'),
    tickDurationEvent: jasmine.createSpy('tickDurationEvent')
  };

  beforeEach(module(function ($provide) {
    $provide.value('roslib', roslibMock);
    $provide.value('nrpAnalytics', nrpAnalyticsMock); // Issues unexpected GET requests
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectoryMock);
  }));

  beforeEach(inject(function($httpBackend,_simulationService_, _simulationControl_,
     _simulationGenerator_, _simulationState_, _experimentSimulationService_){

    httpBackend = $httpBackend;
    experimentSimulationService = _experimentSimulationService_;
  }));

  afterEach(function () {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  var launchExperimentsWithFailingServer = function (succedsRunningExperiement) {
    spyOn(experimentSimulationService, 'launchExperimentOnServer').andCallThrough();
    experimentSimulationService.setProgressMessageCallback(jasmine.createSpy('messageCallback'));
    var failureCallback = jasmine.createSpy('failureCallback');
    var errorCallback = jasmine.createSpy('errorCallback');
    experimentSimulationService.startNewExperiments(
      'mocked_experiment_conf', null, servers, servers, failureCallback, errorCallback);
    httpBackend.flush();

    expect(failureCallback.callCount).toBe(succedsRunningExperiement ? 0 : 1);
    expect(errorCallback.callCount).toBe(0);

    var triedForServers = experimentSimulationService.launchExperimentOnServer.calls.map(function (fnCall) {
      return fnCall.args[2];
    });

    expect(triedForServers.length).toBe(succedsRunningExperiement ? 4 : 1);
    var allServersWereTried = servers.every(function (s) {
      return triedForServers.indexOf(s) >= 0;
    });
    expect(allServersWereTried).toBe(succedsRunningExperiement);
  };

  it('should go through all servers trying to create a simulation until success', function () {
    var serverindex2succeed = servers.length - 1;
    servers.forEach(function (server, i) {
      var returnCode = (i === serverindex2succeed) ? 200 : 500;
      httpBackend.whenGET(/()/).respond(200);
      httpBackend.whenPUT(/()/).respond(200, {message: 'Alright'});
      // Non-fatal 500 error issued by all but the last queried server
      httpBackend.whenPOST('http://' + server + '.epfl.ch:8080/simulation').respond(returnCode, {message: 'timeout'});
    });
    launchExperimentsWithFailingServer(true);
  });

  it('should go through all servers trying to create and update a simulation until success', function () {
    var serverindex2succeed = servers.length - 1;
    servers.forEach(function (server, i) {
      var returnCode = (i === serverindex2succeed) ? 200 : 500;
      httpBackend.whenGET(/()/).respond(200);
      httpBackend.whenPOST('http://' + server + '.epfl.ch:8080/simulation').respond(200, {});
      // Fatal 500 error
      httpBackend.whenPUT('http://' + server + '.epfl.ch:8080/simulation/state').respond(returnCode, {message: 'Cannot'});
    });
    launchExperimentsWithFailingServer(false);
  });

  it('should call error callback if all servers failed', function () {
    servers.forEach(function (server) {
      httpBackend.whenGET('http://' + server + '.epfl.ch:8080/simulation').respond(200);
      httpBackend.whenPOST('http://' + server + '.epfl.ch:8080/simulation').respond(500);
    });

    experimentSimulationService.setProgressMessageCallback(jasmine.createSpy('messageCallback'));
    var failureCallback = jasmine.createSpy('failureCallback');
    experimentSimulationService.startNewExperiments('mocked_experiment_conf', null, servers, servers, failureCallback);
    httpBackend.flush();
    expect(failureCallback.callCount).toBe(1);
  });
});
