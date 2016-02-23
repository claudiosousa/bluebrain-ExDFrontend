'use strict';

describe('Controller: ESVCollabEditCtrl', function () {

  var TestDataGenerator = window.TestDataGenerator;

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var experimentCtrl,
    scope,
    state,
    experimentSimulationService,
    collabConfigService,
    stateParams,
    slurminfoService,
    serverError;

  var collabConfigServiceMock = {
    clone: jasmine.createSpy('clone'),
    get: jasmine.createSpy('get').andReturn({'experimentID': '', 'contextID': 1})
  };

  var experimentTemplates = {
    '1': TestDataGenerator.createTestExperiment(),
    '2': TestDataGenerator.createTestExperiment(),
    '3': TestDataGenerator.createTestExperiment()
  };

  var serversEnabled = [ 'bbpce014', 'bbpce016', 'bbpce018' ];

  var store = {};

  var getExperimentsThenSpy = jasmine.createSpy('then');

  var slurminfoServiceMockObject = {};
  slurminfoServiceMockObject.get = jasmine.createSpy('get').andReturn({'foo':'bar'});

  var experimentSimulationServiceMock = {
    setShouldLaunchInEditMode : jasmine.createSpy('setShouldLaunchInEditMode'),
    startNewExperiments : jasmine.createSpy('startNewExperiments'),
    getExperiments : jasmine.createSpy('getExperiments').andCallFake(function () {
      return { then: getExperimentsThenSpy.andCallFake(function (f) { f(); }) };
    }),
    setInitializedCallback : jasmine.createSpy('setInitializedCallback'),
    existsAvailableServer : jasmine.createSpy('existsAvailableServer'),
    refreshExperiments : jasmine.createSpy('refreshExperiments'),
    getServersEnable : jasmine.createSpy('getServersEnable').andReturn(serversEnabled),
    startNewExperiment : jasmine.createSpy('startNewExperiment'),
    enterEditMode : jasmine.createSpy('enterEditMode')
  };

  var experimentTemplatesArray = _.map(experimentTemplates, function(entry, key){
    var extendedObject = angular.copy(entry);
    extendedObject.id = key;
    return extendedObject;
  });

  beforeEach(module(function ($provide) {
    $provide.value('experimentSimulationService', experimentSimulationServiceMock);
    $provide.value('collabConfigService', collabConfigServiceMock);
    angular.forEach(experimentSimulationServiceMock, function(mockObject){
      mockObject.reset();
    });
    $provide.value('slurminfoService', slurminfoServiceMockObject);
    collabConfigServiceMock.clone.reset();
    collabConfigServiceMock.get.reset();
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              $state,
                              _experimentSimulationService_,
                              _collabConfigService_,
                              _slurminfoService_,
                              _$stateParams_,
                              _serverError_) {
    scope = $rootScope.$new();
    state = $state;
    experimentSimulationService = _experimentSimulationService_;
    collabConfigService = _collabConfigService_;
    stateParams = _$stateParams_;
    serverError = _serverError_;
    slurminfoService = _slurminfoService_;

    store['server-enabled'] = angular.toJson(serversEnabled);

    spyOn(localStorage, 'getItem').andCallFake(function (key) {
      return store[key];
    });

    experimentCtrl = $controller('ESVCollabEditCtrl', {
      $scope: scope
    });

    // create mock for state changes
    spyOn(state, 'go');

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  it('should have initialized the variables correctly', function() {
    expect(scope.selectedIndex).toBe(-1);
    expect(scope.isQueryingServersFinished).toBe(false);
    expect(scope.isCloneRequested).toBe(false);
    expect(scope.experiments).toEqual({});
    expect(scope.serversEnabled).toBe(serversEnabled);
    expect(slurminfoService.get).toHaveBeenCalled();
    expect(scope.clusterPartAvailInfo).toEqual({'foo':'bar'});
  });

  it('should select the correct entry', function() {
    scope.selectedIndex = -1;
    scope.setSelected(1);
    expect(scope.selectedIndex).toEqual(1);
  });

  it('should get the registered experiment if any', function() {
    expect(collabConfigService.get).toHaveBeenCalled();
  });

  it('should get the experiments if no experiment was registered in the database', function() {
    var successCallback = collabConfigService.get.mostRecentCall.args[1];
    successCallback({experimentID: ''}); // An experiment has not been registered yet
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.experiments);
    expect(scope.isQueryingServersFinished).toBe(true);
  });

  it('should not try to get the experiments if one has been already registered', function() {
    spyOn(scope, 'goToRegisteredState');
    var successCallback = collabConfigService.get.mostRecentCall.args[1];
    successCallback({experimentID: 'FakeExperimentID'}); // An experiment has been already registered.
    expect(experimentSimulationService.getExperiments).not.toHaveBeenCalledWith();
    expect(scope.goToRegisteredState).toHaveBeenCalledWith('FakeExperimentID');
  });

  it('should display an error message if the database is unavailable', function() {
    var failureCallback = collabConfigService.get.mostRecentCall.args[2];
    spyOn(serverError, 'display');
    var data = {};
    failureCallback(data);
    expect(experimentSimulationService.getExperiments).not.toHaveBeenCalled();
    expect(scope.isQueryingServersFinished).toBe(true);
    expect(scope.experiments).toBeDefined(); // $scope.experiment contains an error message displayed in the html view
    expect(serverError.display).toHaveBeenCalledWith(data);
  });

  it('should go to the registered edit page state', function() {
    scope.goToRegisteredState('FakeExperimentID');
    expect(state.go).toHaveBeenCalled();
    expect(experimentSimulationService.getExperiments).not.toHaveBeenCalled();
  });

  it('should clone the experiment', function() {
    stateParams.ctx = 'FakeContextID';
    spyOn(window.parent, 'postMessage');
    scope.cloneExperiment('FakeExperimentID');
    expect(collabConfigService.clone).toHaveBeenCalledWith(
      {contextID: 'FakeContextID'}, {experimentID: 'FakeExperimentID'}, jasmine.any(Function)
    );
    spyOn(scope, 'goToRegisteredState');
    var redirectionCallback = collabConfigService.clone.mostRecentCall.args[2];
    redirectionCallback();
    expect(scope.goToRegisteredState).toHaveBeenCalledWith('FakeExperimentID');
    expect(scope.isCloneRequested).toBe(true);
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

});
