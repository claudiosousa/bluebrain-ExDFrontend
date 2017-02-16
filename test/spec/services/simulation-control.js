'use strict';

var TestDataGenerator = window.TestDataGenerator;

describe('Services: server-info-service', function () {
  var hbpIdentityUserDirectory,
      bbpStubFactory,
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
      _simulationControl_, _simulationState_, _simulationGenerator_,
      _objectControl_, _STATE_) {
    httpBackend = _$httpBackend_;
    scope = $rootScope.$new();
    hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
    bbpStubFactory = _bbpStubFactory_;
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
    spyOn(hbpIdentityUserDirectory, 'get').and.callFake(function(ownerID) {
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

  it('should fetch a specific simulation', function() {
    var sim;
    simulationControl('http://bbpce016.epfl.ch:8080').simulation({'sim_id': 1}, function(data) { sim = data; });
    httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation/1');
    httpBackend.flush();
    expect(angular.toJson(sim)).toBe(angular.toJson(simulations[1]));
  });

  it('should fetch the state of a specific simulation', function() {
    var sim;
    simulationState('http://bbpce016.epfl.ch:8080').state({'sim_id': 1}, function(data) { sim = data; });
    httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation/1/state');
    httpBackend.flush();
    expect(angular.toJson(sim)).toBe(angular.toJson({state: STATE.INITIALIZED, timeout:300}));
  });

  it('should set the state of a specific simulation', function() {
    simulationState('http://bbpce016.epfl.ch:8080').update({'sim_id':1}, {state: STATE.PAUSED}, function(){});
    httpBackend.flush();
    httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/1/state', {state: STATE.PAUSED});
  });

  it('should generate a simulation', function() {
    simulationGenerator('http://bbpce016.epfl.ch:8080').create(function(){});
    httpBackend.flush();
    httpBackend.expectPOST('http://bbpce016.epfl.ch:8080/simulation');
  });

   it('should control the screen color', function() {
    objectControl('http://bbpce016.epfl.ch:8080').updateMaterial({'sim_id':1}, {state: STATE.PAUSED}, function(){});
    httpBackend.flush();
    httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/1/interaction', {state: STATE.PAUSED});
  });

});

describe('experimentSimulationService', function () {
  var $httpBackend, $rootScope, experimentSimulationService, bbpConfig, statusListenerSubscribe,
    unsubscribeFn, removeAllListenersFn;

  beforeEach(module('simulationControlServices'));
  beforeEach(module('experimentServices'));
  beforeEach(module(function ($provide) {
    unsubscribeFn = jasmine.createSpy('createStringTopic.unsubscribe');
    removeAllListenersFn = jasmine.createSpy('createStringTopic.removeAllListeners');
    $provide.value('roslib', {
      getOrCreateConnectionTo: function () { return { close: angular.noop }; },
      createStringTopic: function () {
        return {
          subscribe: function (fn) { statusListenerSubscribe = fn; },
          unsubscribe: unsubscribeFn,
          removeAllListeners: removeAllListenersFn
        };
      }
    });

    $provide.value('simulationConfigService',
        {
          initConfigFiles: jasmine.createSpy('initConfigFiles').and.returnValue(
            {
              then: jasmine.createSpy('then').and.returnValue(

                  {catch: jasmine.createSpy('catch') }
                )
            })
        });

    $provide.value('nrpAnalytics', { eventTrack: angular.noop, tickDurationEvent: angular.noop });
  }));
  beforeEach(inject(function (_$httpBackend_, _experimentSimulationService_, _$rootScope_, _bbpConfig_) {
    experimentSimulationService = _experimentSimulationService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    bbpConfig = _bbpConfig_;
  }));

  it('should notify progress', function () {
    var experiment = {
      configuration: {
        maturity: 'production',
        name: 'Mature experiment name'
      },
      availableServers: ['localhost']
    };

    var proxyUrl = bbpConfig.get('api.proxy.url');
    $httpBackend.whenGET(proxyUrl + '/server/localhost').respond(200, {
      gzweb: {
        assets: 'http://localhost:8040',
        'nrp-services': 'http://localhost:8080'
      },
      rosbridge: { topics: {} }
    });
    $httpBackend.whenPUT('http://localhost:8080/simulation/sdf_world').respond(200, {});
    $httpBackend.whenPOST('http://localhost:8080/simulation').respond(200, {});
    $httpBackend.whenPUT('http://localhost:8080/simulation/state').respond(200, {});

    var progressNotification = jasmine.createSpy(progressNotification);
    experimentSimulationService.startNewExperiment(experiment, true, {})
      .then(angular.noop, angular.noop, progressNotification);
    $httpBackend.flush(3);
    statusListenerSubscribe({ data: JSON.stringify({ progress: { task: 'true', subtask: 'subtask' } }) });
    statusListenerSubscribe({ data: JSON.stringify({ progress: { done: true } }) });

    $httpBackend.flush();
    expect(progressNotification.calls.mostRecent().args).toEqual([{ main: 'Simulation initialized.' }]);

    expect(unsubscribeFn).toHaveBeenCalled();
    expect(removeAllListenersFn).toHaveBeenCalled();
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

});

describe('Services: error handling', function () {
  var httpBackend;
  var serverError, simulationControl;
  var simulationGenerator, simulationState, experimentSimulationService;
  var objectControl;

  beforeEach(module('exd.templates','simulationControlServices'));
  beforeEach(module('experimentServices'));

  var roslibMock = {};
  roslibMock.createStringTopic = jasmine.createSpy('createStringTopic').and.returnValue({ subscribe: function(){} });
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').and.returnValue({});

  var serverErrorMock = jasmine.createSpy('serverError');
  serverErrorMock.displayHTTPError = jasmine.createSpy('displayHTTPError');
  beforeEach(module(function ($provide) {
    $provide.value('serverError', serverErrorMock);
    $provide.value('roslib', roslibMock);

    $provide.value('simulationConfigService',
        {
          initConfigFiles: jasmine.createSpy('initConfigFiles').and.returnValue(
            {
              then: jasmine.createSpy('then').and.returnValue(

                  {catch: jasmine.createSpy('catch') }
                )
            })
        });


  }));

  beforeEach(inject(function($httpBackend,_simulationControl_,
     _simulationGenerator_, _simulationState_, _experimentSimulationService_, _objectControl_, _serverError_){

    httpBackend = $httpBackend;
    serverError = _serverError_;
    serverError.displayHTTPError.calls.reset();
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

  it('should call once serverError.displayHTTPError for every failing service', function() {
    var serverURL = 'http://bbpce014.epfl.ch:8080';
    var response;
    httpBackend.whenGET(/\/simulation/).respond(400);
    /*jshint camelcase: false */
    var simulationID = { 'sim_id': '0'};
    simulationControl(serverURL).simulation(simulationID);
    httpBackend.expectGET(serverURL + '/simulation/' + simulationID.sim_id);
    httpBackend.flush();
    expect(serverError.displayHTTPError.calls.count()).toBe(1);
    response = serverError.displayHTTPError.calls.mostRecent().args[0];
    expect(response.status).toBe(400);
    serverError.displayHTTPError.calls.reset();

    simulationState(serverURL).state(simulationID);
    httpBackend.expectGET(serverURL + '/simulation/' + simulationID.sim_id + '/state');
    httpBackend.flush();
    expect(serverError.displayHTTPError.calls.count()).toBe(1);
    response = serverError.displayHTTPError.calls.mostRecent().args[0];
    expect(response.status).toBe(400);
    serverError.displayHTTPError.calls.reset();

    objectControl(serverURL).updateMaterial(simulationID, {});
    httpBackend.expectPUT(serverURL + '/simulation/' + simulationID.sim_id + '/interaction/material_change', {});
    httpBackend.flush();
    expect(serverError.displayHTTPError.calls.count()).toBe(1);
    response = serverError.displayHTTPError.calls.mostRecent().args[0];
    expect(response.status).toBe(500);
  });
});


describe('Services: experimentSimulationService (Stopping the simulation)', function () {
  var experimentSimulationService,
    experimentProxyService,
    simulationState,
    q,
    STATE;

  // load the service to test and mock the necessary service
  beforeEach(module('experimentServices'));
  beforeEach(module('simulationControlServices'));

  beforeEach(module(function ($provide) {
    $provide.value('roslib', {});
    var simulationStateMock = jasmine.createSpy('simulationState').and.returnValue(
      {
        state: jasmine.createSpy('state').and.returnValue({ $promise: { then: jasmine.createSpy('then') } }),
        update: jasmine.createSpy('update').and.returnValue({ $promise: { then: jasmine.createSpy('then') } })
      }
    );
    $provide.value('simulationState', simulationStateMock);
    $provide.value('experimentProxyService',
      { getServerConfig: jasmine.createSpy('getServerConfig').and.returnValue(
        { then: jasmine.createSpy('then').and.returnValue(
          { then: jasmine.createSpy('then').and.returnValue(
            { catch: jasmine.createSpy('catch') })
          })
        })
      }
    );

    $provide.value('simulationConfigService',
      {
        initConfigFiles: jasmine.createSpy('initConfigFiles').and.returnValue(
          {
            then: jasmine.createSpy('then').and.returnValue(

              { catch: jasmine.createSpy('catch') }
            )
          })
      });

  }));

  beforeEach(inject(function (
    $q,
    _experimentProxyService_,
    _experimentSimulationService_,
    _simulationState_,
    _STATE_)
  {
    q = $q;
    experimentProxyService = _experimentProxyService_;
    experimentSimulationService = _experimentSimulationService_;
    simulationState = _simulationState_;
    STATE = _STATE_;
  }));


  it('should change the state to STOPPED, with possible transition by PAUSED, when calling stopExperimentOnServer', function() {
    var simulation = {
      server: 'bbpsrvc21',
      runningSimulation: { simulationID: 'fakeID' }
    };
    experimentSimulationService.stopExperimentOnServer(simulation);
    var serverConfig = { gzweb: { 'nrp-services': {} } };
    experimentProxyService.getServerConfig(serverConfig).then.calls.mostRecent().args[0](serverConfig);
    var callback = simulationState().state().$promise.then.calls.mostRecent().args[0];

    // Should call $q.reject if the callback argument is not an object of the form { state: someObject }
    spyOn(q, 'reject');
    callback();
    expect(q.reject.calls.count()).toBe(1);
    callback({ state: undefined });
    expect(q.reject.calls.count()).toBe(2);
    callback({ state:  STATE.CREATED });
    expect(q.reject.calls.count()).toBe(2);

   // Should pause and stop the simulation if the state is CREATED
   var updateCallback = simulationState().update;
   expect(updateCallback.calls.mostRecent().args[1].state).toBe(STATE.INITIALIZED);
   expect(updateCallback().$promise.then.calls.mostRecent().args[0]).toBeDefined();
   var cascadingUpdateCallback = updateCallback().$promise.then.calls.mostRecent().args[0];
   cascadingUpdateCallback();
   expect(updateCallback.calls.mostRecent().args[1].state).toBe(STATE.STOPPED);
   updateCallback.calls.reset();

   // Should stop the simulation if the state is STARTED, PAUSED or HALTED
   var states = [STATE.STARTED, STATE.PAUSED, STATE.HALTED];
   for (var i = 0; i < states.length; i++) {
     updateCallback.calls.reset();
     callback({ state:  states[i] });
     expect(updateCallback.calls.mostRecent().args[1].state).toBe(STATE.STOPPED);
   }
  });
});


describe('Factory: simulationCreationInterceptor', function () {
  var simulationCreationInterceptor, scope, serverError;

  beforeEach(module('simulationControlServices'));
  beforeEach(inject(function ($rootScope, _simulationCreationInterceptor_, _serverError_) {
    scope = $rootScope;
    simulationCreationInterceptor = _simulationCreationInterceptor_;
    serverError = _serverError_;
  }));

  it('should distinguish fatal from non fatal error', function () {
    var errorMessagesAndFatality = {
      'Another <- non fatal error': false,
      'something -> timeout <- happened ': false,
      'bla bla -> previous one <- bla bla -> terminated <- bla bla': false,
      'very much fatal': true,
      'oops': true
    };

    spyOn(serverError, 'displayHTTPError').and.returnValue();
    _.forEach(errorMessagesAndFatality, function (fatal, msg) {
      simulationCreationInterceptor({ data: msg })
        .catch(function (err) {
          expect(err.isFatal).toBe(fatal);
        });
      scope.$apply();
    });
  });

});
