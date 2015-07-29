'use strict';

var TestDataGenerator = window.TestDataGenerator;

describe('Controller: experimentCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var experimentCtrl,
    scope,
    rootScope,
    location,
    httpBackend,
    timeout,
    experimentSimulationService,
    REFRESH_UPDATE_RATE,
    STATE;

  var experimentSimulationServiceMock = {};

  var experimentTemplates = {
    '1': { name: 'FakeName 1 car', description: 'Some Fake Description 1 xxx', maturity: 'development', experimentConfiguration: 'fake configuration 1', serverPattern: ['a'], timeout: 100},
    '3': {name: 'FakeName 3 cat', description: 'Some Fake Description 3 dog', maturity: 'development', experimentConfiguration: 'fake configuration 3', serverPattern:['c'], timeout: 300},
    '2': {name: 'FakeName 2 dog', description: 'Some Fake Description 2 yyy', maturity: 'production', experimentConfiguration: 'fake configuration 2', serverPattern:['b'], timeout: 200}
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

  function getExperimentById(id) {
    var result;
    experimentTemplatesArray.forEach(function (element) {
      if (element.id === id) {
        result = element;
      }
    });
    return angular.copy(result);
  }

  beforeEach(module(function ($provide) {
    $provide.value('experimentSimulationService', experimentSimulationServiceMock);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$location_,
                              _$httpBackend_,
                              _$timeout_,
                              _experimentSimulationService_,
                              _STATE_) {
    rootScope = $rootScope;
    scope = $rootScope.$new();
    location = _$location_;
    httpBackend = _$httpBackend_;
    timeout = _$timeout_;
    experimentSimulationService = _experimentSimulationService_;
    STATE = _STATE_;

    experimentSimulationServiceMock.getExperiments = jasmine.createSpy('getExperiments');
    experimentSimulationServiceMock.setInitializedCallback = jasmine.createSpy('setInitializedCallback');
    experimentSimulationServiceMock.existsAvailableServer = jasmine.createSpy('existsAvailableServer');
    experimentSimulationServiceMock.refreshExperiments = jasmine.createSpy('refreshExperiments');

    experimentCtrl = $controller('experimentCtrl', {
      $rootScope: rootScope,
      $scope: scope
    });

    REFRESH_UPDATE_RATE = 30 * 1000; // 30 seconds

    httpBackend.whenGET('views/common/home.html').respond({}); // Templates are requested via HTTP and processed locally.
    httpBackend.whenGET('views/esv/experiment_templates.json').respond(experimentTemplates);
    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  it('should init the global variables', function () {
    expect(rootScope.selectedIndex).toEqual(-1);
    expect(rootScope.joinSelectedIndex).toEqual(-1);
    expect(rootScope.isQueryingServersFinished).toEqual(false);
    expect(scope.setSelected).toEqual(jasmine.any(Function));
    expect(scope.setJoinableVisible).toEqual(jasmine.any(Function));
    expect(experimentSimulationService.setInitializedCallback).toHaveBeenCalledWith(scope.joinExperiment);
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith({}, scope.setProgressMessage, jasmine.any(Function), jasmine.any(Function));
  });

  it('should set the progressbar visible', function() {
    rootScope.joinSelectedIndex = 3;
    rootScope.startNewExperimentSelectedIndex = -1;
    scope.setProgressbarVisible(2);
    expect(rootScope.joinSelectedIndex).toEqual(-1);
    expect(rootScope.startNewExperimentSelectedIndex).toEqual(2);
  });

  it('should set the progressbar invisible', function() {
    rootScope.joinSelectedIndex = 3;
    rootScope.startNewExperimentSelectedIndex = 2;
    scope.setProgressbarInvisible();
    expect(rootScope.joinSelectedIndex).toEqual(-1);
    expect(rootScope.startNewExperimentSelectedIndex).toEqual(-1);
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

  it('should start a new experiment', function(){
    experimentSimulationService.startNewExperiments = jasmine.createSpy('startNewExperiments');
    experimentSimulationService.setShouldLaunchInEditMode = jasmine.createSpy('setShouldLaunchInEditMode');
    var newExperimentString = 'fubar';
    var newExperimentServerPattern = 'toto';
    scope.startNewExperiment(newExperimentString, newExperimentServerPattern);
    expect(experimentSimulationService.setShouldLaunchInEditMode).toHaveBeenCalledWith(false);
    expect(experimentSimulationService.startNewExperiments).toHaveBeenCalledWith(newExperimentString, newExperimentServerPattern, scope.setProgressbarInvisible);
  });

  it('should join an experiment', function(){
    scope.setProgressMessage = jasmine.createSpy('setProgressMessage');

    scope.joinExperiment('fake_url');
    var message = 'Joining experiment ' + 'fake_url';
    expect(scope.setProgressMessage).toHaveBeenCalledWith({main: message});
    expect(location.path()).toEqual('/fake_url');
  });

  it('should select the correct entry', function() {
    rootScope.selectedIndex = -1;
    rootScope.joinSelectedIndex = 3;
    scope.setSelected(1);
    expect(rootScope.selectedIndex).toEqual(1);
    expect(rootScope.joinSelectedIndex).toEqual(-1);

    rootScope.selectedIndex = 2;
    rootScope.joinSelectedIndex = 3;
    scope.setSelected(2);
    expect(rootScope.selectedIndex).toEqual(2);
    expect(rootScope.joinSelectedIndex).toEqual(3);

    rootScope.startNewExperimentSelectedIndex = 1;
    scope.setSelected(1);
    expect(rootScope.selectedIndex).toEqual(2);
  });

  it('should set the Joinable table to visible', function() {
    rootScope.joinSelectedIndex = -1;
    scope.setJoinableVisible(1);
    expect(rootScope.joinSelectedIndex).toEqual(1);
  });

  it('should get the experiments', function() {
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.experiments, scope.setProgressMessage, jasmine.any(Function), jasmine.any(Function));
    var queryingServersFinishedCallback = experimentSimulationService.getExperiments.mostRecentCall.args[2];
    queryingServersFinishedCallback();
    expect(rootScope.isQueryingServersFinished).toBe(true);
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
      expect(byMaturityFilter(experimentTemplatesArray, false)).toEqual([getExperimentById('2')]);
      expect(byMaturityFilter(experimentTemplatesArray, true)).toEqual([getExperimentById('1'), getExperimentById('3')]);
    }
  ));

  it('should convert the hash to an array',
    inject(function(convertToArrayFilter) {
        expect(convertToArrayFilter(experimentTemplates)).toEqual(experimentTemplatesArray);
      }
    ));

  it('should create the updatePromise and call refresh experiments after 30 seconds', function() {
    var queryingServersFinishedCallback = experimentSimulationService.getExperiments.mostRecentCall.args[2];
    rootScope.updatePromise = undefined;
    queryingServersFinishedCallback();

    expect(rootScope.updatePromise).toBeDefined();
    // Should not have been called 1 second before REFRESH_UPDATE_RATE
    timeout.flush(REFRESH_UPDATE_RATE - 1000);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();

    // called after in total REFRESH_UPDATE_RATE seconds
    timeout.flush(1000);
    expect(experimentSimulationService.refreshExperiments).toHaveBeenCalled();
  });

  it('should stop updating after on $destroy', function() {
    // Querying servers finished
    experimentSimulationService.getExperiments.mostRecentCall.args[2]();

    scope.$destroy();

    // Should do nothing after 30 seconds
    timeout.flush(REFRESH_UPDATE_RATE);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
    expect(rootScope.updatePromise).not.toBeDefined();
    expect(rootScope.updateUptimePromise).not.toBeDefined();
  });

  it('should do nothing on $destroy', function() {
    rootScope.updatePromise = undefined;
    scope.$destroy();

    // Should do nothing after 30 seconds
    timeout.flush(REFRESH_UPDATE_RATE);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
    expect(rootScope.updatePromise).not.toBeDefined();
  });

});
