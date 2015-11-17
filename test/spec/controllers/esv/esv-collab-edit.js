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
    stateParams;

  var collabConfigServiceMock = {
    clone: jasmine.createSpy('clone'),
    get: jasmine.createSpy('get').andReturn({'experimentId': 1, 'contextId': 1})
  };

  var experimentTemplates = {
    '1': TestDataGenerator.createTestExperiment(),
    '2': TestDataGenerator.createTestExperiment(),
    '3': TestDataGenerator.createTestExperiment()
  };

  var serversEnabled = [ 'bbpce014', 'bbpce016', 'bbpce018' ];

  var store = {};

  var getExperimentsThenSpy = jasmine.createSpy('then');

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
    collabConfigServiceMock.clone.reset();
    collabConfigServiceMock.get.reset();
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              $state,
                              _experimentSimulationService_,
                              _collabConfigService_,
                              _$stateParams_) {
    scope = $rootScope.$new();
    state = $state;
    experimentSimulationService = _experimentSimulationService_;
    collabConfigService = _collabConfigService_;
    stateParams = _$stateParams_;

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
    expect(scope.isQueryingServersFinished).toBe(true); // Due to the immediate prommise-call after getExperiments
    expect(scope.experiments).toEqual({});
    expect(scope.serversEnabled).toBe(serversEnabled);
  });

  it('should select the correct entry', function() {
    scope.selectedIndex = -1;
    scope.setSelected(1);
    expect(scope.selectedIndex).toEqual(1);
  });

  it('should get the experiments', function() {
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.experiments);
    expect(scope.isQueryingServersFinished).toBe(true);
  });

  it('should clone the experiment', function() {
    stateParams.ctx = 'FakeContextID';
    spyOn(window.parent, 'postMessage');
    scope.cloneExperiment('FakeExperimentID');
    expect(collabConfigService.clone).toHaveBeenCalledWith(
      {contextId: 'FakeContextID'}, {experimentId: 'FakeExperimentID'}, jasmine.any(Function)
    );
    var redirectionCallback = collabConfigService.clone.mostRecentCall.args[2];
    redirectionCallback();
    var collabApiParams = window.parent.postMessage.mostRecentCall.args[0];
    var targetWindowUri = window.parent.postMessage.mostRecentCall.args[1];
    expect(collabApiParams.data.mode).toBe('run');
    expect(targetWindowUri).toBe('*');
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
