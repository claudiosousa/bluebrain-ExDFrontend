'use strict';

describe('Controller: experimentCtrl', function () {

  var TestDataGenerator = window.TestDataGenerator;

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var experimentCtrl,
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
    STATE;

  var hbpUserDirectoryPromiseObject = {};
  hbpUserDirectoryPromiseObject.then = jasmine.createSpy('then');
  var hbpUserDirectoryPromiseObject2 = {};
  hbpUserDirectoryPromiseObject2.then = jasmine.createSpy('then');
  var hbpUserDirectoryMock = {};
  hbpUserDirectoryMock.getCurrentUser = jasmine.createSpy('getCurrentUser').andReturn(hbpUserDirectoryPromiseObject);
  hbpUserDirectoryMock.get = jasmine.createSpy('get').andReturn(hbpUserDirectoryPromiseObject2);

  var simulationServiceMockObject = {};
  simulationServiceMockObject.updateUptime = jasmine.createSpy('updateUptime');
  var simulationServiceMock = jasmine.createSpy('simulationServiceMock').andReturn(simulationServiceMockObject);

  var experimentTemplates = {
    '1': TestDataGenerator.createTestExperiment(),
    '2': TestDataGenerator.createTestExperiment(),
    '3': TestDataGenerator.createTestExperiment()
  };

  var serversEnabled = [ 'bbpce014', 'bbpce016', 'bbpce018' ];
  var serversEnabledFromLocalStorage = [ 'bbpce014', 'bbpce016' ];

  var store = {};
  store['server-enabled'] = angular.toJson(serversEnabled);

  var getExperimentsThenSpy = jasmine.createSpy('then');

  var experimentSimulationServiceMock = {
    setShouldLaunchInEditMode : jasmine.createSpy('setShouldLaunchInEditMode'),
    startNewExperiments : jasmine.createSpy('startNewExperiments'),
    getExperiments : jasmine.createSpy('getExperiments').andCallFake(function () {
      return { then: getExperimentsThenSpy.andCallFake(function (f) { f(); }) };
    }),
    setInitializedCallback : jasmine.createSpy('setInitializedCallback'),
    setProgressMessageCallback : jasmine.createSpy('setProgressMessageCallback'),
    existsAvailableServer : jasmine.createSpy('existsAvailableServer'),
    refreshExperiments : jasmine.createSpy('refreshExperiments'),
    getServersEnable : jasmine.createSpy('getServersEnable').andReturn(serversEnabled),
    startNewExperiment : jasmine.createSpy('startNewExperiment'),
    enterEditMode : jasmine.createSpy('enterEditMode')
  };

  var experimentTemplatesArray = (function () {
    var result = [];
    Object.keys(experimentTemplates).forEach(function (entry) {
      var extendedObject = angular.copy(experimentTemplates[entry]);
      extendedObject.id = entry;
      result.push(extendedObject);
    });
    return result;
  }());

  beforeEach(module(function ($provide) {
    $provide.value('experimentSimulationService', experimentSimulationServiceMock);
    $provide.value('hbpUserDirectory', hbpUserDirectoryMock);
    $provide.value('simulationService', simulationServiceMock);
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
                              _hbpUserDirectory_,
                              _STATE_) {
    scope = $rootScope.$new();
    controller = $controller;
    location = _$location_;
    httpBackend = _$httpBackend_;
    timeout = _$timeout_;
    interval = _$interval_;
    experimentSimulationService = _experimentSimulationService_;
    simulationService = _simulationService_;
    hbpUserDirectory = _hbpUserDirectory_;
    STATE = _STATE_;

    spyOn(localStorage, 'getItem').andCallFake(function (key) {
      return store[key];
    });
    spyOn(localStorage, 'setItem').andCallFake(function (key, value) {
      store[key] = value;
    });

    experimentCtrl = $controller('experimentCtrl', {
      $scope: scope
    });

    ESV_UPDATE_RATE = 30 * 1000; // 30 seconds
    UPTIME_UPDATE_RATE = 2 * 1000; // 2 seconds

    httpBackend.whenGET('views/common/home.html').respond({}); // Templates are requested via HTTP and processed locally.
    httpBackend.whenGET('views/esv/experiment_templates.json').respond(experimentTemplates);

    store['server-enabled'] = serversEnabledFromLocalStorage;

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

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
    controller('experimentCtrl', {
      $scope: scope
    });
    expect(hbpUserDirectory.get).not.toHaveBeenCalled();
    expect(scope.userID).toEqual('vonarnim');
    window.bbpConfig.localmode.forceuser = false;
  });

  it('should init the list of server enabled by default' , function () {
    store['server-enabled'] = null;
    controller('experimentCtrl', {
      $scope: scope
    });

    expect(scope.serversEnabled).toEqual(serversEnabled);
  });

  it('should set the progressbar visible', function() {
    scope.joinSelectedIndex = 3;
    scope.startNewExperimentSelectedIndex = -1;
    scope.setProgressbarVisible(2);
    expect(scope.joinSelectedIndex).toEqual(-1);
    expect(scope.startNewExperimentSelectedIndex).toEqual(2);
  });

  it('should set the progressbar invisible', function() {
    scope.joinSelectedIndex = 3;
    scope.startNewExperimentSelectedIndex = 2;
    scope.setProgressbarInvisible();
    expect(scope.joinSelectedIndex).toEqual(-1);
    expect(scope.startNewExperimentSelectedIndex).toEqual(-1);
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

  it('should select the correct entry', function() {
    scope.selectedIndex = -1;
    scope.joinSelectedIndex = 3;
    scope.setSelected(1);
    expect(scope.selectedIndex).toEqual(1);
    expect(scope.joinSelectedIndex).toEqual(-1);

    scope.selectedIndex = 2;
    scope.joinSelectedIndex = 3;
    scope.setSelected(2);
    expect(scope.selectedIndex).toEqual(2);
    expect(scope.joinSelectedIndex).toEqual(3);

    scope.startNewExperimentSelectedIndex = 1;
    scope.setSelected(1);
    expect(scope.selectedIndex).toEqual(2);
  });

  it('should set the Joinable table to visible', function() {
    scope.joinSelectedIndex = -1;
    scope.setJoinableVisible(1);
    expect(scope.joinSelectedIndex).toEqual(1);
  });

  it('should get the experiments', function() {
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.experiments);
    expect(experimentSimulationService.refreshExperiments).toHaveBeenCalled();
    experimentSimulationService.refreshExperiments.mostRecentCall.args[3]();
    expect(scope.isQueryingServersFinished).toBe(true);
  });

  it('should filter the experiments',
    inject(function(nameSnippetFilter) {
      var unfilteredExperiments = TestDataGenerator.createTestExperiments(100);

      // Modify one random entry to contain 'Waldo' in its name
      var experimentToFind = unfilteredExperiments[TestDataGenerator.randomInt(0, unfilteredExperiments.length - 1)];
      experimentToFind.name = 'This is a string which contains Waldo';

      expect(nameSnippetFilter(unfilteredExperiments, 'Waldo')).toEqual([ experimentToFind ]);
    }
  ));

  it('should filter the experiments in user view',
    inject(function(byMaturityFilter) {
      var unfilteredExperiments = TestDataGenerator.createTestExperiments(3);

      // Modify one entry to contain 'production' in its maturity property
      unfilteredExperiments[2].maturity = 'production';

      expect(byMaturityFilter(unfilteredExperiments, false)).toEqual([unfilteredExperiments['2']]);
      expect(byMaturityFilter(unfilteredExperiments, true)).toEqual([unfilteredExperiments['0'], unfilteredExperiments['1']]);
    }
  ));

  it('should convert the hash to an array',
    inject(function(convertToArrayFilter) {
        expect(convertToArrayFilter(experimentTemplates)).toEqual(experimentTemplatesArray);
      }
    ));

  it('should create the updatePromise and call refresh experiments after ESV_UPDATE_RATE seconds', function() {
    var refreshExperimentsFinishedCallback = experimentSimulationService.refreshExperiments.mostRecentCall.args[3];
    scope.updatePromise = undefined;
    refreshExperimentsFinishedCallback();

    experimentSimulationService.refreshExperiments.reset();

    expect(scope.updatePromise).toBeDefined();
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
      expect(scope.isDestroyed).toBeFalsy();
      scope.$destroy();
      expect(scope.isDestroyed).toBeTruthy();
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

    it('should create a new inputElement and click it', function () {
      scope.uploadEnvironmentAndStart('experiment');
      expect(angular.element).toHaveBeenCalled();
      expect(elementReturnVal.bind).toHaveBeenCalled();
      expect(elementReturnVal.bind.mostRecentCall.args[0]).toBe('change');
      expect(dummyInput.click).toHaveBeenCalled();
    });

    it('should read the uploaded file and forward the content to startNewExperiment', function () {
      scope.uploadEnvironmentAndStart('experiment');
      elementReturnVal.bind.mostRecentCall.args[1]();
      expect(dummyFileReader.readAsText).toHaveBeenCalled();
      expect(dummyFileReader.onload).toBeDefined();
      dummyFileReader.onload({target: 'dummy'});
      expect(experimentSimulationService.startNewExperiments).toHaveBeenCalled();
    });

  });

});
