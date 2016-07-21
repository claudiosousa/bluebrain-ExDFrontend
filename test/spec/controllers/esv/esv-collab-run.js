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
    hbpIdentityUserDirectory,
    ESV_UPDATE_RATE,
    UPTIME_UPDATE_RATE,
    STATE,
    stateParams,
    collabConfigService,
    serverError,
    slurminfoService,
    $q,
    collabFolderAPIService;

  var collabConfigServiceMock = {
    clone: jasmine.createSpy('clone'),
    get: jasmine.createSpy('get')
  };

  var simulationServiceMockObject = {
    updateUptime: jasmine.createSpy('updateUptime'),
    owners: { id1: 'John Doe', id2: 'John Don\'t' },
    uptime: { date1: '100', date2: '200' }
  };
  var simulationServiceMock = jasmine.createSpy('simulationServiceMock').andReturn(simulationServiceMockObject);

  var healthyServers = [
    {
      id: 'bbpce014',
      state: 'OK'
    },
    {
      id: 'bbpce016',
      state: 'WARNING'
    },
    {
      id: 'bbpce018',
      state: 'CRITICAL'
    }
  ];
  var serversEnabled = healthyServers.map(function (s) { return s.id; });
  var serversEnabledFromLocalStorage = ['bbpce014', 'bbpce016'];

  var store = {};
  store['server-enabled'] = angular.toJson(serversEnabled);

  var slurminfoServiceMockObject = {};
  slurminfoServiceMockObject.get = jasmine.createSpy('get').andReturn({'foo':'bar'});

  beforeEach(module(function ($provide) {
    var getExperimentsThenSpy = jasmine.createSpy('then');
    var stopExperimentsThenSpy = jasmine.createSpy('then');
    var experimentSimulationServiceMock = {
      startNewExperiments: jasmine.createSpy('startNewExperiments'),
      getExperiments: jasmine.createSpy('getExperiments').andCallFake(function () {
        return { then: getExperimentsThenSpy.andCallFake(function (f) { f(); }) };
      }),
      getHealthyServers: jasmine.createSpy('getExperiments').andCallFake(function () {
        return $q.when(healthyServers);
      }),
      setProgressMessageCallback: jasmine.createSpy('setProgressMessageCallback'),
      setInitializedCallback : jasmine.createSpy('setInitializedCallback'),
      existsAvailableServer : jasmine.createSpy('existsAvailableServer'),
      refreshExperiments : jasmine.createSpy('refreshExperiments'),
      getServersEnable : jasmine.createSpy('getServersEnable').andReturn(serversEnabled),
      startNewExperiment : jasmine.createSpy('startNewExperiment'),
      stopExperimentOnServer: jasmine.createSpy('stopExperimentOnServer').andCallFake(function () {
        return { then: stopExperimentsThenSpy.andCallFake(function (f) { f(); }) };
      })
    };
    $provide.value('experimentSimulationService', experimentSimulationServiceMock);
    var hbpIdentityUserDirectoryPromiseObject = { then: jasmine.createSpy('then').andReturn({ then: jasmine.createSpy('then')})};
    var hbpIdentityUserDirectoryPromiseObject2 = { then: jasmine.createSpy('then') };
    var hbpIdentityUserDirectoryMock = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').andReturn(hbpIdentityUserDirectoryPromiseObject),
      get: jasmine.createSpy('get').andReturn(hbpIdentityUserDirectoryPromiseObject2),
      isGroupMember: jasmine.createSpy('isGroupMember').andReturn({then: jasmine.createSpy('then')})
    };
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectoryMock);
    $provide.value('simulationService', simulationServiceMock);
    $provide.value('collabConfigService', collabConfigServiceMock);
    $provide.value('slurminfoService', slurminfoServiceMockObject);
    for (var mock in experimentSimulationServiceMock) {
      experimentSimulationServiceMock[mock].reset();
    }

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
                              _hbpIdentityUserDirectory_,
                              _STATE_,
                              _collabConfigService_,
                              _$stateParams_,
                              _serverError_,
                              _$q_,
                              _collabFolderAPIService_) {
    scope = $rootScope.$new();
    controller = $controller;
    location = _$location_;
    httpBackend = _$httpBackend_;
    timeout = _$timeout_;
    interval = _$interval_;
    experimentSimulationService = _experimentSimulationService_;
    simulationService = _simulationService_;
    slurminfoService = _slurminfoService_;
    hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
    STATE = _STATE_;
    stateParams = _$stateParams_;
    collabConfigService = _collabConfigService_;
    serverError = _serverError_;
    hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
    $q = _$q_;
    collabFolderAPIService = _collabFolderAPIService_;

    spyOn(localStorage, 'getItem').andCallFake(function (key) {
      return store[key];
    });
    spyOn(localStorage, 'setItem').andCallFake(function (key, value) {
      store[key] = value;
    });

    ESVCollabRunCtrl = $controller('ESVCollabRunCtrl', {
      $scope: scope
    });

    $rootScope.$digest();

    ESV_UPDATE_RATE = 30 * 1000; // 30 seconds
    UPTIME_UPDATE_RATE = 2 * 1000; // 2 seconds

    store['server-enabled'] = serversEnabledFromLocalStorage;
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
    var hbpIdentityUserDirectoryPromiseObject = hbpIdentityUserDirectory.getCurrentUser();
    hbpIdentityUserDirectoryPromiseObject.then.mostRecentCall.args[0](currentUserInfo1234);
    expect(scope.userID).toEqual(currentUserInfo1234.id);
  });

  it('should set the forced user id in full local mode' , function () {
    window.bbpConfig.localmode.forceuser = true;
    controller('ESVCollabRunCtrl', {
      $scope: scope
    });
    expect(hbpIdentityUserDirectory.get).not.toHaveBeenCalled();
    expect(scope.userID).toEqual('vonarnim');
    expect(scope.hasEditRights).toBe(true);
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

  it('should set the edit rights', function() {
    scope.updateUserID();
    var hbpIdentityUserDirectoryPromiseObject = hbpIdentityUserDirectory.getCurrentUser();
    var callback = hbpIdentityUserDirectoryPromiseObject.then().then.mostRecentCall.args[0];
    callback();
    var isGroupMemberCallback = hbpIdentityUserDirectory.isGroupMember().then.mostRecentCall.args[0];
    expect(scope.editRights).not.toBeDefined();
    isGroupMemberCallback(true);
    expect(scope.hasEditRights).toBe(true);
    isGroupMemberCallback(false);
    expect(scope.hasEditRights).toBe(false);
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
    spyOn(scope, 'updateExperiment');
    getSuccessCallback(response);
    expect(scope.experiment.id).toEqual(response.experimentID);
    expect(scope.isQueryingServersFinished).toBe(true);
    expect(scope.updateExperiment).toHaveBeenCalled();

    spyOn(serverError, 'display');
    scope.isQueryingServersFinished = false;
    scope.experiment = undefined;
    var getFailureCallback = collabConfigService.get.mostRecentCall.args[2];
    getFailureCallback();
    expect(scope.experiment).toBeDefined();// should provide a dummy experiment object for error reporting
    expect(serverError.display).toHaveBeenCalled();
    expect(scope.isQueryingServersFinished).toBe(true);
  });

  it('should redirect to Collab edit page if no experiment was selected', function() {
    scope.getExperimentsFinishedCallback();
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    spyOn(location, 'path');
    var response = { experimentID: ''};
    getSuccessCallback(response);
    expect(location.path).toHaveBeenCalled();
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

  it('test getExperimentsFinishedCallback updates the experiment image to one in collab storage', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    var experimentID = 'ExDBraitenbergLauron';
    scope.experiments[experimentID] = {imageData: 'defaultImage'};
    // set up collabImage to return a fake image
    scope.collabImage = $q.when('newImage');
    scope.getExperimentsFinishedCallback();
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    var response = { experimentID: experimentID };
    getSuccessCallback(response);
    scope.$apply();
    expect(scope.experiment.imageData).toBe('newImage');
  });

  it('test getExperimentsFinishedCallback uses default image if there is no image in the storage', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    var experimentID = 'ExDBraitenbergLauron';
    scope.experiments[experimentID] = {imageData: 'defaultImage'};
    // set up collabImage to return null
    scope.collabImage = $q.when(null);
    scope.getExperimentsFinishedCallback();
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    var response = { experimentID: experimentID };
    getSuccessCallback(response);
    scope.$apply();
    expect(scope.experiment.imageData).toBe('defaultImage');
  });

  it('test loadCollabImage calls everything correctly', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    var experimentID = 'ExDBraitenbergLauron';
    var experimentFolderUUID = 'fakeUUID';
    // call the function, get the promise back
    var returnValue = scope.loadCollabImage();
    expect(collabConfigService.get).toHaveBeenCalledWith({contextID: context}, jasmine.any(Function), jasmine.any(Function));
    // get the collabConfigService callback function
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    spyOn(collabFolderAPIService, 'getFolderFile').andReturn($q.when({_uuid: 'fakeUUID'}));
    var imageData = 'data:image/png;base64,fakeContent';
    var blob = new Blob([imageData],{type : 'image/png'});
    spyOn(collabFolderAPIService, 'downloadFile').andReturn($q.when(blob));
    var readAsDataURL = jasmine.createSpy();
    var eventListener = jasmine.createSpy();
    spyOn(window, 'FileReader').andReturn({
      addEventListener: eventListener,
      readAsDataURL: readAsDataURL
    });
    // call the callback function and test we get the expected output
    getSuccessCallback({ experimentID: experimentID , experimentFolderUUID: experimentFolderUUID});
    scope.$apply();
    // set call the callback function in eventlister with the imageData
    eventListener.mostRecentCall.args[1]({
      target:{
        result:imageData
      }
    });
    expect(readAsDataURL).toHaveBeenCalledWith(blob);
    expect(eventListener.mostRecentCall.args[0]).toEqual('loadend');
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalledWith(experimentFolderUUID, experimentID+'.png');
    expect(collabFolderAPIService.downloadFile).toHaveBeenCalledWith('fakeUUID', {'responseType': 'blob'});
    returnValue.then(function(value){
      expect(value).toBe('fakeContent');
    });
    scope.$apply();

  });

  it('test loadCollabImage returns a promise with null when there is no experimentUUID or experimentID', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    var experimentID = 'ExDBraitenbergLauron';
    var experimentFolderUUID = 'fakeUUID';
    // call the function, get the promise back
    var returnValue = scope.loadCollabImage();
    // get the collabConfigService callback function
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    // try without experimentFolderUUID
    getSuccessCallback({ experimentID: experimentID});
    returnValue.then(function(value){
      expect(value).toBe(null);
    });
    scope.$apply();
    // try without experimentID
    getSuccessCallback({experimentFolderUUID: experimentFolderUUID});
    returnValue.then(function(value){
      expect(value).toBe(null);
    });
    scope.$apply();
  });

  it('test loadCollabImage returns a promise with null when there is no image _uuid', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    var experimentID = 'ExDBraitenbergLauron';
    var experimentFolderUUID = 'fakeUUID';
    // call the function, get the promise back
    var returnValue = scope.loadCollabImage();
    // get the collabConfigService callback function
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    // no image uuidis returned from getFolderFile
    spyOn(collabFolderAPIService, 'getFolderFile').andReturn($q.when({}));
    getSuccessCallback({ experimentID: experimentID , experimentFolderUUID: experimentFolderUUID});
    returnValue.then(function(value){
      expect(value).toBe(null);
    });
    scope.$apply();
  });

  it('test loadCollabImage returns a promise with null when there is no image', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    var experimentID = 'ExDBraitenbergLauron';
    var experimentFolderUUID = 'fakeUUID';
    // call the function, get the promise back
    var returnValue = scope.loadCollabImage();
    // get the collabConfigService callback function
    var getSuccessCallback = collabConfigService.get.mostRecentCall.args[1];
    spyOn(collabFolderAPIService, 'getFolderFile').andReturn($q.when({_uuid: 'fakeUUID'}));
    // no image is returned from downloadFile
    spyOn(collabFolderAPIService, 'downloadFile').andReturn($q.when(null));
    getSuccessCallback({ experimentID: experimentID , experimentFolderUUID: experimentFolderUUID});
    returnValue.then(function(value){
      expect(value).toBe(null);
    });
    scope.$apply();
  });

  it('test loadCollabImage returns a promise with null when the get fails', function() {
    var context = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    stateParams.ctx = context;
    // call the function, get the promise back
    var returnValue = scope.loadCollabImage();
    // get the collabConfigService callback function
    var getFailureCallback = collabConfigService.get.mostRecentCall.args[2];
    getFailureCallback();
    returnValue.then(function(value){
      expect(value).toBe(null);
    });
    scope.$apply();
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

  describe('Tests related to updateExperiment:', function() {
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
      scope.experiment.id = '1';
    });

    it('should update scope.owners and scope.uptime', function() {
      scope.updateExperiment();
      expect(scope.owners).toBeDefined();
      expect(scope.uptime).toBeDefined();
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
    spyOn(scope, 'updateExperiment');

    scope.stopSimulation(scope.experiments['1'].simulations[0]);
    expect(experimentSimulationService.stopExperimentOnServer).toHaveBeenCalledWith(scope.experiments, 'fakeserverID', 'fakeID');
    expect(scope.updateExperiment).toHaveBeenCalled();

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
