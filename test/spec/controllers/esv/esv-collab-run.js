'use strict';

describe('Controller: ESVCollabRunCtrl', function () {

  var TestDataGenerator = window.TestDataGenerator;

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var ESVCollabRunCtrl,
    scope,
    controller,
    location,
    httpBackend,
    timeout,
    interval,
    experimentSimulationService,
    simulationService,
    hbpUserDirectory,
    ESV_UPDATE_RATE,
    UPTIME_UPDATE_RATE,
    STATE,
    OPERATION_MODE,
    stateParams,
    collabConfigService,
    serverError,
    slurminfoService;

  var collabConfigServiceMock = {
    clone: jasmine.createSpy('clone'),
    get: jasmine.createSpy('get')
  };

  var hbpUserDirectoryPromiseObject = { then: jasmine.createSpy('then') };
  var hbpUserDirectoryPromiseObject2 = { then: jasmine.createSpy('then') };
  var hbpUserDirectoryMock = {
    getCurrentUser: jasmine.createSpy('getCurrentUser').andReturn(hbpUserDirectoryPromiseObject),
    get: jasmine.createSpy('get').andReturn(hbpUserDirectoryPromiseObject2)
  };

  var simulationServiceMockObject = {
    updateUptime: jasmine.createSpy('updateUptime'),
    owners: { id1: 'John Doe', id2: 'John Don\'t' },
    uptime: { date1: '100', date2: '200' }
  };
  var simulationServiceMock = jasmine.createSpy('simulationServiceMock').andReturn(simulationServiceMockObject);

  var serversEnabled = [ 'bbpce014', 'bbpce016', 'bbpce018' ];
  var serversEnabledFromLocalStorage = [ 'bbpce014', 'bbpce016' ];

  var store = {};
  store['server-enabled'] = angular.toJson(serversEnabled);

  var slurminfoServiceMockObject = {};
  slurminfoServiceMockObject.get = jasmine.createSpy('get').andReturn({'foo':'bar'});

  beforeEach(module(function ($provide) {
    var getExperimentsThenSpy = jasmine.createSpy('then');
    var stopExperimentsThenSpy = jasmine.createSpy('then');
    var experimentSimulationServiceMock = {
      setShouldLaunchInEditMode : jasmine.createSpy('setShouldLaunchInEditMode'),
      startNewExperiments : jasmine.createSpy('startNewExperiments'),
      getExperiments : jasmine.createSpy('getExperiments').andCallFake(function () {
        return { then: getExperimentsThenSpy.andCallFake(function (f) { f(); }) };
      }),
      setProgressMessageCallback : jasmine.createSpy('setProgressMessageCallback'),
      setInitializedCallback : jasmine.createSpy('setInitializedCallback'),
      existsAvailableServer : jasmine.createSpy('existsAvailableServer'),
      refreshExperiments : jasmine.createSpy('refreshExperiments'),
      getServersEnable : jasmine.createSpy('getServersEnable').andReturn(serversEnabled),
      startNewExperiment : jasmine.createSpy('startNewExperiment'),
      stopExperimentOnServer: jasmine.createSpy('stopExperimentOnServer').andCallFake(function () {
        return { then: stopExperimentsThenSpy.andCallFake(function (f) { f(); }) };
      }),
      enterEditMode : jasmine.createSpy('enterEditMode')
    };
    $provide.value('experimentSimulationService', experimentSimulationServiceMock);
    $provide.value('hbpUserDirectory', hbpUserDirectoryMock);
    $provide.value('simulationService', simulationServiceMock);
    $provide.value('collabConfigService', collabConfigServiceMock);
    $provide.value('slurminfoService', slurminfoServiceMockObject);
    for (var mock in experimentSimulationServiceMock) {
      experimentSimulationServiceMock[mock].reset();
    }
    hbpUserDirectoryPromiseObject.then.reset();
    hbpUserDirectoryPromiseObject2.then.reset();
    hbpUserDirectoryMock.getCurrentUser.reset();
    hbpUserDirectoryMock.get.reset();
    simulationServiceMock.reset();
    simulationServiceMockObject.updateUptime.reset();
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$location_,
                              _$httpBackend_,
                              _$timeout_,
                              _$interval_,
                              _experimentSimulationService_,
                              _simulationService_,
                              _slurminfoService_,
                              _hbpUserDirectory_,
                              _STATE_,
                              _OPERATION_MODE_,
                              _collabConfigService_,
                              _$stateParams_,
                              _serverError_) {
    scope = $rootScope.$new();
    controller = $controller;
    location = _$location_;
    httpBackend = _$httpBackend_;
    timeout = _$timeout_;
    interval = _$interval_;
    experimentSimulationService = _experimentSimulationService_;
    simulationService = _simulationService_;
    slurminfoService = _slurminfoService_;
    hbpUserDirectory = _hbpUserDirectory_;
    STATE = _STATE_;
    OPERATION_MODE = _OPERATION_MODE_;
    stateParams = _$stateParams_;
    collabConfigService = _collabConfigService_;
    serverError = _serverError_;

    spyOn(localStorage, 'getItem').andCallFake(function (key) {
      return store[key];
    });
    spyOn(localStorage, 'setItem').andCallFake(function (key, value) {
      store[key] = value;
    });

    ESVCollabRunCtrl = $controller('ESVCollabRunCtrl', {
      $scope: scope
    });

    ESV_UPDATE_RATE = 30 * 1000; // 30 seconds
    UPTIME_UPDATE_RATE = 2 * 1000; // 2 seconds

    store['server-enabled'] = serversEnabledFromLocalStorage;

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  it('should initialize scope members' , function () {
      expect(scope.joinSelected).toBe(false);
      expect(scope.startNewExperimentSelected).toBe(false);
      expect(scope.isServerAvailable).toEqual({});
      expect(scope.isQueryingServersFinished).toBe(false);
      expect(scope.isDestroyed).toBe(false);
      expect(scope.updatePromise).not.toBeDefined();
      expect(scope.uptimePromise).not.toBeDefined();
      expect(scope.experiments).toEqual({});
      expect(scope.serversEnabled).toEqual(experimentSimulationService.getServersEnable());
      expect(scope.userID).not.toBeDefined();
      expect(scope.isCollabEditPage).toBe(false);
      expect(scope.owners).not.toBeDefined();
      expect(scope.uptime).not.toBeDefined();
      expect(slurminfoService.get).toHaveBeenCalled();
      expect(scope.clusterPartAvailInfo).toEqual({'foo':'bar'});
  });

  it('should fetch and set the current user id' , function () {
    var currentUserInfo1234 = {
      displayName: 'John Does',
      id: '1234'
    };
    hbpUserDirectoryPromiseObject.then.mostRecentCall.args[0](currentUserInfo1234);
    expect(scope.userID).toEqual(currentUserInfo1234.id);
  });

  it('should set the forced user id in full local mode' , function () {
    window.bbpConfig.localmode.forceuser = true;
    controller('ESVCollabRunCtrl', {
      $scope: scope
    });
    expect(hbpUserDirectory.get).not.toHaveBeenCalled();
    expect(scope.userID).toEqual('vonarnim');
    window.bbpConfig.localmode.forceuser = false;
  });

  it('should init the list of server enabled by default' , function () {
    store['server-enabled'] = null;
    controller('ESVCollabRunCtrl', {
      $scope: scope
    });

    expect(scope.serversEnabled).toEqual(serversEnabled);
  });

  it('should set the progressbar visible', function() {
    scope.joinSelected = true;
    scope.startNewExperimentSelected = false;
    scope.setProgressbarVisible();
    expect(scope.joinSelected).toEqual(false);
    expect(scope.startNewExperimentSelected).toEqual(true);
  });

  it('should set the progressbar invisible', function() {
    scope.joinSelected = true;
    scope.startNewExperimentSelected = true;
    scope.setProgressbarInvisible();
    expect(scope.joinSelected).toEqual(false);
    expect(scope.startNewExperimentSelected).toEqual(true);
  });

  it('should set the progress message', function() {
    scope.$apply = jasmine.createSpy('$apply');

    scope.progressMessageMain = 'fubar';
    scope.progressMessageSub = 'bar';

    scope.setProgressMessage({ main: 'new_value_main', sub: 'new_value_sub'});
    timeout.flush();
    scope.$apply.mostRecentCall.args[0]();

    expect(scope.progressMessageMain).toEqual('new_value_main');
    expect(scope.progressMessageSub).toEqual('new_value_sub');

    scope.setProgressMessage({});
    timeout.flush();
    scope.$apply.mostRecentCall.args[0]();
    expect(scope.progressMessageMain).toEqual('');
    expect(scope.progressMessageSub).toEqual('');
  });

  it('should join an experiment', function(){
    scope.setProgressMessage = jasmine.createSpy('setProgressMessage');

    scope.joinExperiment('fake_url');
    var message = 'Joining experiment ' + 'fake_url';
    expect(scope.setProgressMessage).toHaveBeenCalledWith({main: message});
    expect(location.path()).toEqual('/fake_url');
  });

  it('should set the Joinable table to visible', function() {
    scope.joinSelected = false;
    scope.setJoinableVisible();
    expect(scope.joinSelected).toEqual(true);
  });

  it('should get the experiment list', function() {
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.experiments);
    expect(experimentSimulationService.getExperiments(scope.experiments).then).toHaveBeenCalled();
    expect(experimentSimulationService.refreshExperiments).toHaveBeenCalled();
    expect(experimentSimulationService.refreshExperiments.mostRecentCall.args[3]).toBe(
      scope.getExperimentsFinishedCallback
    );
  });

  it('should retrieve the specified experiment using its Collab context', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    var experimentID = 'ExDBraitenbergLauron';
    scope.experiments[experimentID] = {};
    scope.getExperimentsFinishedCallback();
    expect(collabConfigService.get.mostRecentCall.args[0].contextID).toEqual(context);
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    var response = { experimentID: experimentID };
    spyOn(scope, 'updateExperiments');
    getSuccessCallback(response);
    expect(scope.experiment).toEqual({id: response.experimentID});
    expect(scope.isQueryingServersFinished).toBe(true);
    expect(scope.updateExperiments).toHaveBeenCalled();

    spyOn(serverError, 'display');
    scope.isQueryingServersFinished = false;
    scope.experiment = undefined;
    var getFailureCallback = collabConfigService.get.mostRecentCall.args[2];
    getFailureCallback();
    expect(scope.experiment).toBeDefined();// should provide a dummy experiment object for error reporting
    expect(serverError.display).toHaveBeenCalled();
    expect(scope.isQueryingServersFinished).toBe(true);
  });

  it('should create the updatePromise and call refresh experiments after ESV_UPDATE_RATE seconds', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    var experimentID = 'ExDBraitenbergLauron';
    scope.experiments[experimentID] = {};
    scope.getExperimentsFinishedCallback();
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    var response = { experimentID: experimentID };
    scope.updatePromise = undefined;
    getSuccessCallback(response);
    expect(scope.updatePromise).toBeDefined();
    experimentSimulationService.refreshExperiments.reset();
    // Should not have been called 1 second before ESV_UPDATE_RATE
    timeout.flush(ESV_UPDATE_RATE - 1000);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
    // called after in total ESV_UPDATE_RATE seconds
    timeout.flush(1000);
    expect(experimentSimulationService.refreshExperiments).toHaveBeenCalled();
  });

  it('should create the updateUptimePromise and update the uptime after UPTIME_UPDATE_RATE seconds', function() {
    expect(scope.updateUptimePromise).toBeDefined();
    expect(simulationServiceMockObject.updateUptime).not.toHaveBeenCalled();
    interval.flush(UPTIME_UPDATE_RATE);
    expect(simulationServiceMockObject.updateUptime).toHaveBeenCalled();
  });

  it('should toggle servers properly', function() {
    expect(scope.serversEnabled).not.toContain('toto');
    scope.toggleServer('toto');
    expect(scope.serversEnabled).toContain('toto');
    expect(experimentSimulationService.refreshExperiments).toHaveBeenCalled();
    scope.toggleServer('toto');
    expect(scope.serversEnabled).not.toContain('toto');
    expect(experimentSimulationService.refreshExperiments).toHaveBeenCalled();
  });

  it('should save the result when toggling the servers', function() {
    expect(scope.serversEnabled).not.toContain('toto');
    scope.toggleServer('toto');
    expect(angular.fromJson(store['server-enabled'])).toContain('toto');
    scope.toggleServer('toto');
    expect(angular.fromJson(store['server-enabled'])).not.toContain('toto');
  });

  it('should set the isServerAvailable variable', function() {
    scope.toggleServer('dummy');
    scope.isServerAvailable = {};
    experimentSimulationService.refreshExperiments.mostRecentCall.args[2]('fakeId', true);
    expect(scope.isServerAvailable).toEqual({'fakeId': true});
  });

  describe('Tests related to updateExperiments', function() {
    beforeEach(function(){
      var experimentTemplates = {
        '1': TestDataGenerator.createTestExperiment(),
        '2': TestDataGenerator.createTestExperiment(),
        '3': TestDataGenerator.createTestExperiment()
      };
      scope.experiments = experimentTemplates;
      scope.experiments['1'].simulations = [];
      scope.experiments['1'].simulations.push({serverID: 'fakeserverID', simulationID: 'fakeID'});
      scope.experiment = scope.experiments['1'];
    });

    it('should update scope.owners and scope.uptime', function() {
      scope.updateExperiments();
      expect(scope.owners).toBeDefined();
      expect(scope.uptime).toBeDefined();
    });

    it('should set the isAlreadyEditing variable to true if the user owns an edit simulation', function() {
      scope.updateExperiments();
      expect(scope.isAlreadyEditing).toBe(false);

      scope.userID = 'fakeUserID';
      scope.experiments['1'].simulations[0].owner = 'fakeUserID';
      scope.experiments['1'].simulations[0].operationMode = OPERATION_MODE.EDIT;

      scope.updateExperiments();
      expect(scope.isAlreadyEditing).toBe(true);
    });

    it('should set the isAlreadyEditing variable and update the userID if it was undefined', function() {
      scope.isAlreadyEditing = false;
      scope.userID = undefined;
      scope.experiments['1'].simulations[0].owner = 'fakeUserID';
      scope.experiments['1'].simulations[0].operationMode = OPERATION_MODE.EDIT;
      hbpUserDirectoryPromiseObject.then.reset();

      scope.updateExperiments();
      hbpUserDirectoryPromiseObject.then.mostRecentCall.args[0]({id: 'fakeUserID'});
      expect(scope.userID).toBe('fakeUserID');
    });
  });

  it('should stop a running experiment', function() {
    var experimentTemplates = {
      '1': TestDataGenerator.createTestExperiment(),
      '2': TestDataGenerator.createTestExperiment(),
      '3': TestDataGenerator.createTestExperiment()
    };
    scope.experiments = experimentTemplates;
    scope.experiments['1'].simulations = [];
    scope.experiments['1'].simulations.push({serverID: 'fakeserverID', simulationID: 'fakeID'});
    var updateExperiments = scope.updateExperiments;
    scope.updateExperiments = jasmine.createSpy('updateExperiments');

    scope.stopSimulation(scope.experiments['1'].simulations[0]);
    expect(experimentSimulationService.stopExperimentOnServer).toHaveBeenCalledWith(scope.experiments, 'fakeserverID', 'fakeID');
    expect(scope.updateExperiments).toHaveBeenCalled();

    // restore original function
    scope.updateExperiments = updateExperiments;
  });

  describe('Tests related to scope.$destroy()', function(){
    it('should stop updating after on $destroy', function() {
      // Querying servers finished
      experimentSimulationService.refreshExperiments.mostRecentCall.args[3]();
      experimentSimulationService.refreshExperiments.reset();

      scope.$destroy();

      // Should do nothing after 30 seconds
      timeout.flush(ESV_UPDATE_RATE);
      interval.flush(UPTIME_UPDATE_RATE);
      expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
      expect(scope.updatePromise).not.toBeDefined();
      expect(scope.updateUptimePromise).not.toBeDefined();
    });

    it('should do nothing on $destroy', function() {
      scope.updatePromise = undefined;
      scope.updateUptimePromise = undefined;
      experimentSimulationService.refreshExperiments.reset();
      scope.$destroy();

      // Should do nothing after 30 seconds
      timeout.flush(ESV_UPDATE_RATE);
      interval.flush(UPTIME_UPDATE_RATE);
      expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
      expect(scope.updatePromise).not.toBeDefined();
      expect(scope.updateUptimePromise).not.toBeDefined();
    });

    it('should not schedule a new update after $destroy', function() {
      scope.updatePromise = undefined;
      expect(scope.isDestroyed).toBe(false);
      scope.$destroy();
      expect(scope.isDestroyed).toBe(true);
      // Querying servers finished
      experimentSimulationService.refreshExperiments.mostRecentCall.args[3]();
      expect(scope.updatePromise).toBeUndefined();
    });
  });

  it('should forward correctly the call to the experimentSimulationService when calling startNewExperiment', function () {
    scope.startNewExperiment('foo', 'bar');
    expect(experimentSimulationService.startNewExperiment).toHaveBeenCalled();
    expect(experimentSimulationService.startNewExperiment.mostRecentCall.args[0]).toBe('foo');
    expect(experimentSimulationService.startNewExperiment.mostRecentCall.args[2]).toBe('bar');
  });

  it('should test enterEditMode', function() {
    scope.enterEditMode('foo', 'bar');
    expect(experimentSimulationService.enterEditMode).toHaveBeenCalled();
    expect(experimentSimulationService.enterEditMode.mostRecentCall.args[0]).toBe('foo');
    expect(experimentSimulationService.enterEditMode.mostRecentCall.args[2]).toBe('bar');
  });

  describe('tests the uploadEnvironmentAndStart', function () {

    var dummyInput, dummyFileReader, elementReturnVal;
    dummyInput = {
      'click': jasmine.createSpy('click'),
      'files': jasmine.createSpy('files')
    };
    dummyFileReader = {
      'readAsText': jasmine.createSpy('readAsText')
    };
    elementReturnVal = [dummyInput];
    elementReturnVal.bind = jasmine.createSpy('bind');

    beforeEach(inject(function ($window) {
      dummyInput.click.reset();
      dummyInput.files.reset();
      elementReturnVal.bind.reset();
      spyOn(angular, 'element').andReturn(elementReturnVal);
      dummyFileReader.readAsText.reset();
      dummyFileReader.onload = undefined;
      spyOn($window, 'FileReader').andReturn(dummyFileReader);
    }));
  });

});
