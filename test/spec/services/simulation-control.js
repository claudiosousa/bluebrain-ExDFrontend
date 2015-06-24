'use strict';

describe('Services: simulation-services', function () {
  var hbpUserDirectory,
      bbpStubFactory,
      simulationService,
      simulationControl,
      simulationState,
      simulationGenerator,
      screenControl,
      scope,
      STATE;

  // load the service to test and mock the necessary service
  beforeEach(module('simulationControlServices'));
  beforeEach(module('hbpCommon'));
  beforeEach(module('bbpStubFactory'));

  var httpBackend;
  var simulations, returnSimulations, experimentTemplates, experimentTemplatesAugmented;

  beforeEach(inject(function (_$httpBackend_, $rootScope, _hbpUserDirectory_, _bbpStubFactory_,
      _simulationService_, _simulationControl_, _simulationState_, _simulationGenerator_,
      _screenControl_, _STATE_) {
    httpBackend = _$httpBackend_;
    scope = $rootScope.$new();
    hbpUserDirectory = _hbpUserDirectory_;
    bbpStubFactory = _bbpStubFactory_;
    simulationService = _simulationService_;
    simulationControl = _simulationControl_;
    simulationState = _simulationState_;
    simulationGenerator = _simulationGenerator_;
    screenControl = _screenControl_;
    STATE = _STATE_;

    var now = new Date();
    simulations = [
      { simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.CREATED, creationDate: now.toISOString(), owner: '1234'},
      { simulationID: 1, experimentID: 'fakeExperiment1', state: STATE.INITIALIZED},
      { simulationID: 2, experimentID: 'fakeExperiment2', state: STATE.PAUSED, owner: 'default-owner'},
      { simulationID: 3, experimentID: 'fakeExperiment3', state: STATE.STARTED, owner: '4321'},
      { simulationID: 4, experimentID: 'fakeExperiment4', state: STATE.STOPPED},
      { simulationID: 5, experimentID: 'fakeExperiment5', state: STATE.INITIALIZED},
      { simulationID: 6, experimentID: 'fakeExperiment6', state: STATE.CREATED, owner: 'invalid-id'}
    ];

    returnSimulations = [
      { simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.CREATED, creationDate: now.toISOString(), owner: '1234', serverID : 'bbpce016'},
      { simulationID: 1, experimentID: 'fakeExperiment1', state: STATE.INITIALIZED, serverID : 'bbpce016'},
      { simulationID: 2, experimentID: 'fakeExperiment2', state: STATE.PAUSED, owner: 'default-owner', serverID : 'bbpce016'},
      { simulationID: 3, experimentID: 'fakeExperiment3', state: STATE.STARTED, owner: '4321', serverID : 'bbpce016'},
      { simulationID: 4, experimentID: 'fakeExperiment4', state: STATE.STOPPED, serverID : 'bbpce016'},
      { simulationID: 5, experimentID: 'fakeExperiment5', state: STATE.INITIALIZED, serverID : 'bbpce016'},
      { simulationID: 6, experimentID: 'fakeExperiment6', state: STATE.CREATED, owner: 'invalid-id', serverID : 'bbpce016'}
    ];

    experimentTemplates = {
      '1': {imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx', experimentConfiguration: 'fakeExperiment1', serverPattern:'bbpce', timeout: 100},
      '2': {imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', experimentConfiguration: 'fakeExperiment2', serverPattern:'bbpce', timeout: 200},
      '3': {imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', experimentConfiguration: 'fakeExperiment3', serverPattern:'bbpce', timeout: 300}
    };

    experimentTemplatesAugmented = {
      '1': {imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx', experimentConfiguration: 'fakeExperiment1', serverPattern:'bbpce', timeout: 100, numSupportingServers : 2},
      '2': {imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', experimentConfiguration: 'fakeExperiment2', serverPattern:'bbpce', timeout: 200, numSupportingServers : 2, runningExperiments: 1, simulations: [
        {simulationID: 0, experimentID: '2', state: STATE.CREATED, serverID : 'http://bbpce014.epfl.ch:8080'}
      ]},
      '3': {imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', experimentConfiguration: 'fakeExperiment3', serverPattern:'bbpce', timeout: 300, runningExperiments: 3, simulations: [
        { simulationID: 2, experimentID: '3', state: STATE.CREATED, serverID : 'http://bbpce016.epfl.ch:8080'},
        { simulationID: 0, experimentID: '3', state: STATE.INITIALIZED, serverID : 'http://bbpce017.epfl.ch:8080'},
        { simulationID: 2, experimentID: '3', state: STATE.PAUSED, serverID : 'http://bbpce018.epfl.ch:8080'}
      ]}
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
    spyOn(hbpUserDirectory, 'get').andCallFake(function(ownerID) {
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


  it('should retrieve the simulation list', function() {
    var mySimulations;
    simulationService({ serverURL: 'http://bbpce016.epfl.ch:8080', serverID : 'bbpce016' }).simulations(function(data) {
      mySimulations = data;
    });
    httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation');
    httpBackend.flush();
    expect(angular.toJson(mySimulations)).toBe(angular.toJson(returnSimulations));
  });

  it('should retrieve the owner of simulations map', function() {
    var mySimulations;
    simulationService({ serverURL: 'http://bbpce016.epfl.ch:8080', serverID : 'bbpce016' }).simulations(function(data) {
      mySimulations = data;
    });
    httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation');
    httpBackend.flush();
    expect(simulationService().owners['1234']).toBe('John Does');
    expect(simulationService().owners['4321']).toBe('John Dont');
    expect(simulationService().owners['default-owner']).toBe('Unknown');
    expect(simulationService().owners['invalid-id']).toBe('Unknown');
  });

  it('should retrieve the uptime of a simulation', function() {
    var mySimulations;
    simulationService({ serverURL: 'http://bbpce016.epfl.ch:8080', serverID : 'bbpce016' }).simulations(function(data) {
      mySimulations = data;
    });
    httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation');
    httpBackend.flush();
    simulationService().updateUptime();
    expect(simulationService().uptime['bbpce016-0'] >= 0).toBeTruthy();
    expect(simulationService().uptime['bbpce016-0']).toBeLessThan(1); // uptime should be around 0.001s, depending on machine.
  });

  it('should attach a filter function and filter simulations according to state and index in the list', function() {
    expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[3]);

    expect(simulationService().filterSimulations(simulations, STATE.STARTED, STATE.PAUSED).state).toBe(STATE.STARTED);

    simulations[2].state = STATE.STARTED;
    simulations[3].state = STATE.PAUSED;

    expect(simulationService().filterSimulations(simulations, STATE.STARTED, STATE.PAUSED).state).toBe(STATE.PAUSED);
    expect(simulationService().filterSimulations(simulations, STATE.INITIALIZED).simulationID).toBe(5);
    expect(simulationService().filterSimulations(simulations, STATE.CREATED).simulationID).toBe(6);

    simulations[4].state = STATE.PAUSED;
    expect(simulationService().filterSimulations(simulations, STATE.STOPPED)).toBe(undefined);

    simulations[2].state = STATE.STOPPED;
    simulations[3].state = STATE.STOPPED;
    simulations[4].state = STATE.STOPPED;
    expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[5]);

    simulations[1].state = STATE.STOPPED;
    simulations[5].state = STATE.STOPPED;
    expect(simulationService().getActiveSimulation(simulations)).toBe(undefined);
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
    screenControl('http://bbpce016.epfl.ch:8080').updateScreenColor({sim_id:1}, {state: STATE.PAUSED}, function(){});
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
    scope,
    bbpConfig,
    roslib,
    STATE;


  // load the service to test and mock the necessary service
  beforeEach(module('simulationControlServices'));

  var httpBackend;
  var returnSimulations, experimentTemplates, experimentTemplatesAugmented;

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
    }
  };
  bbpConfigMock.get = jasmine.createSpy('get').andReturn(bbpConfigString);

  // Mock simulationServices
  var simulationServiceObject = {};
  var simulationServiceMock = jasmine.createSpy('simulationService').andReturn(simulationServiceObject);

  var roslibMock = {};
  var rosConnectionMock = {};
  var statusListenerMock;
  var simulationGeneratorMockObject = { create: jasmine.createSpy('create')};
  var simulationGeneratorMock = jasmine.createSpy('simulationGenerator').andReturn(simulationGeneratorMockObject);
  var simulationStateMockObject = { update: jasmine.createSpy('update')};
  var simulationStateMock = jasmine.createSpy('simulationState').andReturn(simulationStateMockObject);

  beforeEach(module(function ($provide) {
    $provide.constant('bbpConfig', bbpConfigMock);
    $provide.value('simulationService', simulationServiceMock);
    $provide.value('roslib', roslibMock);
    $provide.value('simulationGenerator', simulationGeneratorMock);
    $provide.value('simulationState', simulationStateMock);
  }));

  beforeEach(inject(function (_$httpBackend_, $rootScope, _simulationService_, _simulationGenerator_,
      _simulationState_, _experimentSimulationService_, _bbpConfig_, _roslib_, _STATE_) {
    httpBackend = _$httpBackend_;
    scope = $rootScope.$new();
    simulationService = _simulationService_;
    simulationGenerator = _simulationGenerator_;
    experimentSimulationService = _experimentSimulationService_;
    simulationState = _simulationState_;
    bbpConfig = _bbpConfig_;
    roslib = _roslib_;
    STATE = _STATE_;

    returnSimulations = [
      { simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.CREATED, serverID : 'bbpce016'},
      { simulationID: 1, experimentID: 'fakeExperiment1', state: STATE.INITIALIZED, serverID : 'bbpce016'},
      { simulationID: 2, experimentID: 'fakeExperiment3', state: STATE.PAUSED, serverID : 'bbpce016'},
      { simulationID: 3, experimentID: 'fakeExperiment3', state: STATE.STARTED, serverID : 'bbpce016'},
      { simulationID: 4, experimentID: 'fakeExperiment4', state: STATE.STOPPED, serverID : 'bbpce016'},
      { simulationID: 5, experimentID: 'fakeExperiment5', state: STATE.INITIALIZED, serverID : 'bbpce016'},
      { simulationID: 6, experimentID: 'fakeExperiment6', state: STATE.CREATED, serverID : 'bbpce016'}
    ];
    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(returnSimulations[3]);
    simulationServiceObject.simulations = jasmine.createSpy('simulations').andReturn({$promise: {then: function(){}}});

    experimentTemplates = {
      '1': {
        imageUrl: 'img/someFakeUrl1.png', name: 'FakeName 1', snippet: 'Some Fake Description 1', experimentConfiguration: 'fakeExperiment1', serverPattern:'bbpce', timeout: 100, numSupportingServers: 2, numAvailableServers : 0
      },
      'fakeExperiment3': {
        imageUrl: 'img/someFakeUrl2.png', name: 'FakeName 2', snippet: 'Some Fake Description 3', experimentConfiguration: 'fakeExperiment3', serverPattern:'bbpce', timeout: 200, numSupportingServers: 2, numAvailableServers : 0
      },
      '3': {
        imageUrl: 'img/someFakeUrl3.png', name: 'FakeName 3', snippet: 'Some Fake Description 2', experimentConfiguration: 'fakeExperiment2', serverPattern:'bbpce', timeout: 300, numSupportingServers: 2, numAvailableServers : 0
      }
    };

    experimentTemplatesAugmented = {
      '1': {
        imageUrl: 'img/someFakeUrl1.png', name: 'FakeName 1', snippet: 'Some Fake Description 1', experimentConfiguration: 'fakeExperiment1', serverPattern:'bbpce', timeout: 100, numSupportingServers: 2, numAvailableServers : 0
      },
      'fakeExperiment3': {
        imageUrl: 'img/someFakeUrl2.png', name: 'FakeName 2', snippet: 'Some Fake Description 3', experimentConfiguration: 'fakeExperiment3', serverPattern:'bbpce', timeout: 200, numSupportingServers: 2, numAvailableServers : 0, runningExperiments: 1, simulations: [
          returnSimulations[3]
      ]},
      '3': {
        imageUrl: 'img/someFakeUrl3.png', name: 'FakeName 3', snippet: 'Some Fake Description 2', experimentConfiguration: 'fakeExperiment2', serverPattern:'bbpce', timeout: 300, numSupportingServers: 2, numAvailableServers : 0
      }
    };

    httpBackend.whenGET('views/esv/experiment_templates.json').respond(experimentTemplates);
    spyOn(console, 'error');

    roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn(rosConnectionMock);
    statusListenerMock = { subscribe : jasmine.createSpy('subscribe')};
    roslibMock.createStringTopic = jasmine.createSpy('createStringTopic').andReturn(statusListenerMock);
  }));

  it('should add a simulation to the templates', function() {
    experimentSimulationService.addSimulationToTemplate(experimentTemplates, returnSimulations[3]);
    expect(experimentTemplates).toEqual(experimentTemplatesAugmented);
    expect(experimentTemplates[returnSimulations[3].experimentID].runningExperiments).toBe(1);

    experimentSimulationService.addSimulationToTemplate(experimentTemplates, returnSimulations[3]);
    expect(experimentTemplates[returnSimulations[3].experimentID].runningExperiments).toBe(2);
  });

  it('should not add nonexisting simulations to the templates', function() {
    var experimentTemplatesCopy = angular.copy(experimentTemplates);
    experimentSimulationService.addSimulationToTemplate(experimentTemplates, returnSimulations[0]);
    expect(experimentTemplates).toEqual(experimentTemplatesCopy);
  });

  it('should refresh the experiment template data structure', function() {
    simulationService = simulationServiceMock;

    // the simulation should be added to the experimentTemplates
    experimentSimulationService.refreshExperiments(experimentTemplates);
    var argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
    argumentFunction(returnSimulations);
    expect(experimentTemplates).toEqual(experimentTemplatesAugmented);

    // There should be no change
    var savedExperimentTemplates = angular.copy(experimentTemplates);
    experimentSimulationService.refreshExperiments(experimentTemplates);
    argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
    argumentFunction(returnSimulations);
    expect(experimentTemplates).toEqual(savedExperimentTemplates);

    // The simulation should be updated
    experimentSimulationService.refreshExperiments(experimentTemplates);
    argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(returnSimulations[2]);
    argumentFunction(returnSimulations);
    expect(returnSimulations[2].experimentID).toBe(returnSimulations[3].experimentID);
    expect(experimentTemplates[returnSimulations[3].experimentID].runningExperiments).toBe(1);
    expect(experimentTemplates[returnSimulations[3].experimentID].simulations).toEqual([returnSimulations[2]]);

    // Simulation should be removed when no simulation is running on the server
    experimentSimulationService.refreshExperiments(experimentTemplates);
    argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(undefined);
    argumentFunction([]);
    expect(experimentTemplates[returnSimulations[3].experimentID].runningExperiments).toBe(0);
    expect(experimentTemplates[returnSimulations[3].experimentID].simulations).toEqual([]);
  });

  it('should retrieve the augmented experiments', function() {
    simulationService = simulationServiceMock;
    var messageCallback = jasmine.createSpy('messageCallback');
    var callback = jasmine.createSpy('callback');

    spyOn(experimentSimulationService, 'augmentExperiments');
    experimentSimulationService.getExperiments(messageCallback, callback);

    httpBackend.expectGET('views/esv/experiment_templates.json');
    httpBackend.flush();

    experimentSimulationService.augmentExperiments(experimentTemplates);
    expect(bbpConfig.get).toHaveBeenCalledWith('api.neurorobotics');

    expect(simulationService).toHaveBeenCalledWith({ serverURL: bbpConfigString.bbpce014.gzweb['nrp-services'], serverID: 'bbpce014'});
    expect(simulationService).toHaveBeenCalledWith({ serverURL: bbpConfigString.bbpce016.gzweb['nrp-services'], serverID: 'bbpce016'});

    expect(simulationServiceObject.simulations.callCount).toEqual(8);

    var argumentFunction = simulationServiceObject.simulations.calls[1].args[0];
    argumentFunction(returnSimulations);
    expect(simulationServiceObject.getActiveSimulation).toHaveBeenCalledWith(returnSimulations);

    expect(callback).toHaveBeenCalledWith(experimentTemplatesAugmented);
  });

  it('should callback when all servers have answered to the query', function() {
    var mockedThen = jasmine.createSpy('then');
    simulationServiceObject.simulations = jasmine.createSpy('simulations').andReturn(
      {
        $promise: {then: mockedThen}
      });

    var queryingServersFinishedCallback = jasmine.createSpy('queryingServersFinishedCallback');
    var emptyCallback = function(){};
    experimentSimulationService.getExperiments(emptyCallback, emptyCallback, queryingServersFinishedCallback);

    // Now flush the backend (because the experiment templates are queried)
    httpBackend.flush();

    // The callback for querying the servers is not called since this happens in a callback of a currently mocked function.
    expect(queryingServersFinishedCallback).not.toHaveBeenCalled();

    // Hence we have to call those explicitly.
    mockedThen.argsForCall.forEach(function (argument) {
      argument[0]();
    });

    // We have to use scope.$digest() here, since otherwise the used promises would not be resolved,
    // also see: http://stackoverflow.com/questions/24211312/angular-q-when-is-not-resolved-in-karma-unit-test
    scope.$digest();
    expect(queryingServersFinishedCallback).toHaveBeenCalled();
  });

  it('should register for status information', function() {
    var simulationID = 0;
    var serverID = 'bbpce016';

    // register our callback for progress messages
    var messageCallback = jasmine.createSpy('messageCallback');
    var initializedCallback = jasmine.createSpy('initializedCallback');
    experimentSimulationService.getExperiments(messageCallback, function(){});
    experimentSimulationService.setInitializedCallback(initializedCallback);

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
    expect(initializedCallback).toHaveBeenCalledWith('esv-web/gz3d-view/' + serverID + '/' + simulationID);
  });

  it('should test the launch of an experiment on a given server', function() {
    var messageCallback = jasmine.createSpy('messageCallback');
    experimentSimulationService.getExperiments(messageCallback, function(){});

    experimentSimulationService.launchExperimentOnServer('mocked_experiment_id', 'bbpce014');
    expect(messageCallback).toHaveBeenCalled();
    expect(simulationGenerator).toHaveBeenCalledWith(bbpConfigString.bbpce014.gzweb['nrp-services']);

    messageCallback.reset();
    expect(simulationGeneratorMockObject.create).toHaveBeenCalledWith({
      experimentID: 'mocked_experiment_id',
      /* jshint camelcase: false */
      gzserverHost: 'lugano'
    }, jasmine.any(Function));
    simulationGeneratorMockObject.create.mostRecentCall.args[1]({ simulationID : 'mocked_sim_id'});
    expect(messageCallback).toHaveBeenCalled();

    messageCallback.reset();
    expect(simulationState).toHaveBeenCalledWith('http://bbpce014.epfl.ch:8080');
  });

  it('should start a new experiment', function(){
    simulationService.reset();
    var messageCallback = jasmine.createSpy('messageCallback');
    experimentSimulationService.getExperiments(messageCallback, function(){});

    experimentSimulationService.startNewExperiments('experiment_id', 'bbpce');

    expect(simulationService).toHaveBeenCalledWith({serverURL: 'http://bbpce014.epfl.ch:8080', serverID: 'bbpce014'});
    expect(simulationService).toHaveBeenCalledWith({serverURL: 'http://bbpce016.epfl.ch:8080', serverID: 'bbpce016'});

    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(undefined);
    simulationServiceObject.simulations.mostRecentCall.args[0](returnSimulations);
    expect(messageCallback).toHaveBeenCalled();

    var returnSimulations2 = [
      { simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.STOPPED, serverID : 'bbpce016'},
      { simulationID: 1, experimentID: 'fakeExperiment1', state: STATE.STOPPED, serverID : 'bbpce016'}
    ];

    messageCallback.reset();
    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn({ simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.STARTED, serverID : 'bbpce016'});
    simulationServiceObject.simulations.mostRecentCall.args[0](returnSimulations2);
    expect(messageCallback).not.toHaveBeenCalled();
  });

  it('should check for an available Server', function(){
    simulationService.reset();
    var isAvailableCallback = jasmine.createSpy('isAvailableCallback');
    experimentSimulationService.existsAvailableServer(experimentTemplates, isAvailableCallback);

    expect(simulationService).toHaveBeenCalledWith({serverURL: 'http://bbpce014.epfl.ch:8080', serverID: 'bbpce014'});
    expect(simulationService).toHaveBeenCalledWith({serverURL: 'http://bbpce016.epfl.ch:8080', serverID: 'bbpce016'});

    expect(simulationServiceObject.simulations).toHaveBeenCalled();

    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(undefined);
    simulationServiceObject.simulations.mostRecentCall.args[0](returnSimulations);
    expect(simulationServiceObject.getActiveSimulation).toHaveBeenCalled();
    expect(isAvailableCallback).toHaveBeenCalled();


    isAvailableCallback.reset();
    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn({ simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.STARTED, serverID : 'bbpce016'});
    simulationServiceObject.simulations.mostRecentCall.args[0](returnSimulations);
    expect(simulationServiceObject.getActiveSimulation).toHaveBeenCalled();
    expect(isAvailableCallback).not.toHaveBeenCalled();
  });
});


describe('Services: error handling', function () {
  var httpBackend;
  var serverError, simulationService, simulationControl;
  var simulationGenerator, simulationState, experimentSimulationService;
  var screenControl;

  beforeEach(module('simulationControlServices'));

  var roslibMock = {};
  roslibMock.createStringTopic = jasmine.createSpy('createStringTopic').andReturn({ subscribe: function(){} });
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn({});

  var serverErrorMock = jasmine.createSpy('serverError');
  beforeEach(module(function ($provide) {
    $provide.value('serverError', serverErrorMock);
    $provide.value('roslib', roslibMock);
  }));

  beforeEach(inject(function($httpBackend,_simulationService_, _simulationControl_,
     _simulationGenerator_, _simulationState_, _experimentSimulationService_, _screenControl_, _serverError_){

    httpBackend = $httpBackend;
    serverError = _serverError_;
    serverError.reset();
    simulationService = _simulationService_;
    simulationControl = _simulationControl_;
    simulationGenerator = _simulationGenerator_;
    simulationState = _simulationState_;
    experimentSimulationService = _experimentSimulationService_;
    screenControl = _screenControl_;
    httpBackend.whenPUT(/\/simulation/).respond(500);
  }));

  afterEach(function() {
     httpBackend.verifyNoOutstandingExpectation();
     httpBackend.verifyNoOutstandingRequest();
   });

  it('should call once serverError for every failing service', function() {
    var serverURL = 'http://bbpce014.epfl.ch:8080';
    var serverID = 'bbpce014';
    var response;
    httpBackend.whenGET(/\/simulation/).respond(400);

    simulationService({serverURL: serverURL, serverID: serverID}).simulations();
    httpBackend.expectGET(serverURL + '/simulation');
    httpBackend.flush();
    expect(serverError.callCount).toBe(1);
    response = serverError.mostRecentCall.args[0];
    expect(response.status).toBe(400);
    serverError.reset();

    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */
    var simulationID = { sim_id: '0'};
    simulationControl(serverURL).simulation(simulationID);
    httpBackend.expectGET(serverURL + '/simulation/' + simulationID.sim_id);
    httpBackend.flush();
    expect(serverError.callCount).toBe(1);
    response = serverError.mostRecentCall.args[0];
    expect(response.status).toBe(400);
    serverError.reset();

    simulationState(serverURL).state(simulationID);
    httpBackend.expectGET(serverURL + '/simulation/' + simulationID.sim_id + '/state');
    httpBackend.flush();
    expect(serverError.callCount).toBe(1);
    response = serverError.mostRecentCall.args[0];
    expect(response.status).toBe(400);
    serverError.reset();

    simulationGenerator(serverURL).create();
    httpBackend.expectPOST(serverURL + '/simulation').respond(500);
    httpBackend.flush();
    expect(serverError.callCount).toBe(1);
    response = serverError.mostRecentCall.args[0];
    expect(response.status).toBe(500);
    serverError.reset();

    screenControl(serverURL).updateScreenColor(simulationID, {});
    httpBackend.expectPUT(serverURL + '/simulation/' + simulationID.sim_id + '/interaction', {});
    httpBackend.flush();
    expect(serverError.callCount).toBe(1);
    response = serverError.mostRecentCall.args[0];
    expect(response.status).toBe(500);
  });

  it('should test the error callback when launching an experiment fails', function() {
    var errorCallback = jasmine.createSpy('errorCallback');
    httpBackend.whenPOST(/()/).respond({simulationID: '0'}, 200);
    httpBackend.whenGET(/()/).respond(200);
    experimentSimulationService.getExperiments(function(){}, function(){}, function(){});
    httpBackend.flush();
    experimentSimulationService.launchExperimentOnServer('mocked_experiment_id', 'bbpce014', errorCallback);
    httpBackend.flush();
    expect(errorCallback.callCount).toBe(1);
    expect(serverError.callCount).toBe(1);
  });

  it('should not call serverError for a failing GET /simulation request with 504 status', function() {
    var serverURL = 'http://bbpce014.epfl.ch:8080';
    var serverID = 'bbpce014';
    httpBackend.whenGET(/\/simulation/).respond(504);
    simulationService({serverURL: serverURL, serverID: serverID}).simulations();
    httpBackend.expectGET(serverURL + '/simulation');
    httpBackend.flush();
    expect(serverError.callCount).toBe(0);
  });

});
