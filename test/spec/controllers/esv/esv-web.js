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
    experimentSimulationService,
    REFRESH_UPDATE_RATE,
    STATE;

  var experimentSimulationServiceMock = {
    setShouldLaunchInEditMode : jasmine.createSpy('setShouldLaunchInEditMode'),
    startNewExperiments : jasmine.createSpy('startNewExperiments')
  };

  var experimentTemplates = {
    '1': TestDataGenerator.createTestExperiment(),
    '2': TestDataGenerator.createTestExperiment(),
    '3': TestDataGenerator.createTestExperiment()
  };

  var serversEnabled = [ 'bbpce014', 'bbpce016', 'bbpce018' ];
  var serversEnabledFromLocalStorage = [ 'bbpce014', 'bbpce016' ];

  var store = {};
  store['server-enabled'] = angular.toJson(serversEnabled);

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
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$location_,
                              _$httpBackend_,
                              _$timeout_,
                              _experimentSimulationService_,
                              _STATE_) {
    scope = $rootScope.$new();
    controller = $controller;
    location = _$location_;
    httpBackend = _$httpBackend_;
    timeout = _$timeout_;
    experimentSimulationService = _experimentSimulationService_;
    STATE = _STATE_;

    experimentSimulationServiceMock.getExperiments = jasmine.createSpy('getExperiments');
    experimentSimulationServiceMock.setInitializedCallback = jasmine.createSpy('setInitializedCallback');
    experimentSimulationServiceMock.existsAvailableServer = jasmine.createSpy('existsAvailableServer');
    experimentSimulationServiceMock.refreshExperiments = jasmine.createSpy('refreshExperiments');
    experimentSimulationServiceMock.getServersEnable = jasmine.createSpy('getServersEnable').andReturn(serversEnabled);

    spyOn(localStorage, 'getItem').andCallFake(function (key) {
      return store[key];
    });
    spyOn(localStorage, 'setItem').andCallFake(function (key, value) {
      store[key] = value;
    });

    experimentCtrl = $controller('experimentCtrl', {
      $scope: scope
    });

    REFRESH_UPDATE_RATE = 30 * 1000; // 30 seconds

    httpBackend.whenGET('views/common/home.html').respond({}); // Templates are requested via HTTP and processed locally.
    httpBackend.whenGET('views/esv/experiment_templates.json').respond(experimentTemplates);

    store['server-enabled'] = serversEnabledFromLocalStorage;

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  it('should init the list of server enabled by default' , function () {
    store['server-enabled'] = null;
    // We need this var declaration to make jshint happy.
    var experimentCtrlWithoutLocalStorage;
    experimentCtrlWithoutLocalStorage = controller('experimentCtrl', {
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

  it('should start a new experiment', function(){
    experimentSimulationService.startNewExperiments = jasmine.createSpy('startNewExperiments');
    experimentSimulationService.setShouldLaunchInEditMode = jasmine.createSpy('setShouldLaunchInEditMode');
    var newExperimentString = 'fubar';
    var newExperimentServerPattern = 'toto';
    scope.startNewExperiment(newExperimentString, newExperimentServerPattern);
    expect(experimentSimulationService.setShouldLaunchInEditMode).toHaveBeenCalledWith(false);
    expect(experimentSimulationService.startNewExperiments).toHaveBeenCalledWith(newExperimentString, serversEnabled, newExperimentServerPattern, scope.setProgressbarInvisible);
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
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.experiments, serversEnabled, scope.setProgressMessage, jasmine.any(Function), jasmine.any(Function));
    var queryingServersFinishedCallback = experimentSimulationService.getExperiments.mostRecentCall.args[3];
    queryingServersFinishedCallback();
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

  it('should create the updatePromise and call refresh experiments after 30 seconds', function() {
    var queryingServersFinishedCallback = experimentSimulationService.getExperiments.mostRecentCall.args[3];
    scope.updatePromise = undefined;
    queryingServersFinishedCallback();

    expect(scope.updatePromise).toBeDefined();
    // Should not have been called 1 second before REFRESH_UPDATE_RATE
    timeout.flush(REFRESH_UPDATE_RATE - 1000);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();

    // called after in total REFRESH_UPDATE_RATE seconds
    timeout.flush(1000);
    expect(experimentSimulationService.refreshExperiments).toHaveBeenCalled();
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

  describe('Tests related to scope.$destroy()', function(){

  it('should stop updating after on $destroy', function() {
    // Querying servers finished
    experimentSimulationService.getExperiments.mostRecentCall.args[2]();

    scope.$destroy();

    // Should do nothing after 30 seconds
    timeout.flush(REFRESH_UPDATE_RATE);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
      expect(scope.updatePromise).not.toBeDefined();
      expect(scope.updateUptimePromise).not.toBeDefined();
  });

  it('should do nothing on $destroy', function() {
      scope.updatePromise = undefined;
    scope.$destroy();

    // Should do nothing after 30 seconds
    timeout.flush(REFRESH_UPDATE_RATE);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
      expect(scope.updatePromise).not.toBeDefined();
      expect(scope.updateUptimePromise).not.toBeDefined();
    });
  });

  it('should test enterEditMode', function() {
    scope.enterEditMode('foo', 'bar');
    expect(experimentSimulationService.setShouldLaunchInEditMode).toHaveBeenCalled();
    expect(experimentSimulationService.startNewExperiments).toHaveBeenCalled();
  });

});
