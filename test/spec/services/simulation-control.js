'use strict';

describe('Services: simulation-services', function () {
  var simulationService,
      simulationControl,
      simulationState,
      simulationGenerator,
      lightControl,
      screenControl,
      scope,
      STATE;

  // load the service to test and mock the necessary service
  beforeEach(module('simulationControlServices'));

  var httpBackend;
  var simulations, returnSimulations;

  beforeEach(inject(function (_$httpBackend_, $rootScope, _simulationService_, _simulationControl_, _simulationState_, _simulationGenerator_, _lightControl_, _screenControl_, _STATE_) {
    httpBackend = _$httpBackend_;
    scope = $rootScope.$new();
    simulationService = _simulationService_;
    simulationControl = _simulationControl_;
    simulationState = _simulationState_;
    simulationGenerator = _simulationGenerator_;
    lightControl = _lightControl_;
    screenControl = _screenControl_;
    STATE = _STATE_;

    simulations = [
      { simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.CREATED},
      { simulationID: 1, experimentID: 'fakeExperiment1', state: STATE.INITIALIZED},
      { simulationID: 2, experimentID: 'fakeExperiment2', state: STATE.PAUSED},
      { simulationID: 3, experimentID: 'fakeExperiment3', state: STATE.STARTED},
      { simulationID: 4, experimentID: 'fakeExperiment4', state: STATE.STOPPED},
      { simulationID: 5, experimentID: 'fakeExperiment5', state: STATE.INITIALIZED},
      { simulationID: 6, experimentID: 'fakeExperiment6', state: STATE.CREATED}
    ];

    returnSimulations = [
      { simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.CREATED, serverID : 'http://bbpce016.epfl.ch:8080'},
      { simulationID: 1, experimentID: 'fakeExperiment1', state: STATE.INITIALIZED, serverID : 'http://bbpce016.epfl.ch:8080'},
      { simulationID: 2, experimentID: 'fakeExperiment2', state: STATE.PAUSED, serverID : 'http://bbpce016.epfl.ch:8080'},
      { simulationID: 3, experimentID: 'fakeExperiment3', state: STATE.STARTED, serverID : 'http://bbpce016.epfl.ch:8080'},
      { simulationID: 4, experimentID: 'fakeExperiment4', state: STATE.STOPPED, serverID : 'http://bbpce016.epfl.ch:8080'},
      { simulationID: 5, experimentID: 'fakeExperiment5', state: STATE.INITIALIZED, serverID : 'http://bbpce016.epfl.ch:8080'},
      { simulationID: 6, experimentID: 'fakeExperiment6', state: STATE.CREATED, serverID : 'http://bbpce016.epfl.ch:8080'}
    ];

    httpBackend.whenGET('http://bbpce016.epfl.ch:8080/simulation').respond(simulations);
    httpBackend.whenGET('http://bbpce016.epfl.ch:8080/simulation/1').respond(simulations[1]);
    httpBackend.whenGET('http://bbpce016.epfl.ch:8080/simulation/1/state').respond({state: STATE.INITIALIZED, timeout:300});
    httpBackend.whenPUT(/()/).respond(200);
    httpBackend.whenPOST(/()/).respond(200);
    spyOn(console, 'error');
  }));


  it('should retrieve the simulation list', function() {
    var mySimulations;
    simulationService('http://bbpce016.epfl.ch:8080').simulations(function(data) {
      mySimulations = data;
    });
    httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation');
    httpBackend.flush();
    expect(angular.toJson(mySimulations)).toBe(angular.toJson(returnSimulations));
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
    expect(simulationService().getActiveSimulation(simulations)).toBe(simulations[6]);

    simulations[0].state = STATE.STOPPED;
    simulations[6].state = STATE.STOPPED;
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

  it('should control the light of a simulation', function() {
    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */
    lightControl('http://bbpce016.epfl.ch:8080').updateLight({sim_id:1}, {state: STATE.PAUSED}, function(){});
    httpBackend.flush();
    httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/1/interaction/light', {state: STATE.PAUSED});
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
});
