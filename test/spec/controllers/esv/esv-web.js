'use strict';

describe('Controller: experimentCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var experimentCtrl,
    scope,
    rootScope,
    location,
    httpBackend,
    timeout,
    interval,
    experimentSimulationService,
    experimentTemplates,
    experimentTemplatesAugmented,
    experimentTemplatesArray,
    sortedExperimentTemplatesArray,
    filteredExperimentTemplatesArray,
    serverPatternFilteredExperimentTemplatesArray,
    REFRESH_UPDATE_RATE,
    STATE;

  var experimentSimulationServiceMock = {};
  experimentSimulationServiceMock.getExperiments = jasmine.createSpy('getExperiments');
  experimentSimulationServiceMock.setInitializedCallback = jasmine.createSpy('setInitializedCallback');
  experimentSimulationServiceMock.getExperiments = jasmine.createSpy('getExperiments');
  experimentSimulationServiceMock.existsAvailableServer = jasmine.createSpy('existsAvailableServer');
  experimentSimulationServiceMock.refreshExperiments = jasmine.createSpy('refreshExperiments');

  var timeoutMock = jasmine.createSpy('$timeout');

  beforeEach(module(function ($provide) {
    $provide.value('experimentSimulationService', experimentSimulationServiceMock);
    $provide.value('$timeout', timeoutMock);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$location_,
                              _$httpBackend_,
                              _$timeout_,
                              _$interval_,
                              _experimentSimulationService_,
                              _STATE_) {
    rootScope = $rootScope;
    scope = $rootScope.$new();
    location = _$location_;
    httpBackend = _$httpBackend_;
    timeout = _$timeout_;
    interval = _$interval_;
    experimentSimulationService = _experimentSimulationService_;
    STATE = _STATE_;

    experimentSimulationService.getExperiments.reset();
    experimentSimulationService.setInitializedCallback.reset();
    experimentSimulationService.getExperiments.reset();
    experimentSimulationService.existsAvailableServer.reset();
    experimentSimulationService.refreshExperiments.reset();

    experimentTemplates = {
      '1': {imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx', experimentConfiguration: 'fake configuration 1', serverPattern:'a', timeout: 100},
      '3': {imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', experimentConfiguration: 'fake configuration 3', serverPattern:'c', timeout: 300},
      '2': {imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', experimentConfiguration: 'fake configuration 2', serverPattern:'b', timeout: 200}
    };
    experimentTemplatesArray = [
      {id: '1', imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx', experimentConfiguration: 'fake configuration 1', serverPattern:'a', timeout: 100},
      {id: '3', imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', experimentConfiguration: 'fake configuration 3', serverPattern:'c', timeout: 300},
      {id: '2', imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', experimentConfiguration: 'fake configuration 2', serverPattern:'b', timeout: 200}
    ];
    sortedExperimentTemplatesArray = [
      {id: '1', imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx', experimentConfiguration: 'fake configuration 1', serverPattern:'a', timeout: 100},
      {id: '2', imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', experimentConfiguration: 'fake configuration 2', serverPattern:'b', timeout: 200},
      {id: '3', imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', experimentConfiguration: 'fake configuration 3', serverPattern:'c', timeout: 300}
    ];
    filteredExperimentTemplatesArray = [
      {id: '3', imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', experimentConfiguration: 'fake configuration 3', serverPattern:'c', timeout: 300},
      {id: '2', imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', experimentConfiguration: 'fake configuration 2', serverPattern:'b', timeout: 200}
    ];
    serverPatternFilteredExperimentTemplatesArray = [
      {id: '2', imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', experimentConfiguration: 'fake configuration 2', serverPattern:'b', timeout: 200}
    ];
    experimentTemplatesAugmented = {
      '1': {imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx', experimentConfiguration: 'fake configuration 1', serverPattern:'a', timeout: 100},
      '2': {imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', experimentConfiguration: 'fake configuration 2', serverPattern:'b', timeout: 200, runningExperiments: 1, simulations: [
        {simulationID: 0, experimentID: '2', state: STATE.CREATED, serverID : 'http://bbpce014.epfl.ch:8080'}
      ]},
      '3': {imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', experimentConfiguration: 'fake configuration 3', serverPattern:'c', timeout: 300, runningExperiments: 3, simulations: [
        { simulationID: 2, experimentID: '3', state: STATE.CREATED, serverID : 'http://bbpce016.epfl.ch:8080'},
        { simulationID: 0, experimentID: '3', state: STATE.INITIALIZED, serverID : 'http://bbpce017.epfl.ch:8080'},
        { simulationID: 2, experimentID: '3', state: STATE.PAUSED, serverID : 'http://bbpce018.epfl.ch:8080'}
      ]}
    };

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
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.setProgressMessage, jasmine.any(Function), jasmine.any(Function), jasmine.any(Function));
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

    timeout.reset();
    scope.setProgressMessage({ main: 'new_value_main', sub: 'new_value_sub'});
    expect(timeout).toHaveBeenCalled();
    timeout.mostRecentCall.args[0]();
    scope.$apply.mostRecentCall.args[0]();

    expect(scope.progressMessageMain).toEqual('new_value_main');
    expect(scope.progressMessageSub).toEqual('new_value_sub');

    scope.setProgressMessage({});
    timeout.mostRecentCall.args[0]();
    scope.$apply.mostRecentCall.args[0]();
    expect(scope.progressMessageMain).toEqual('');
    expect(scope.progressMessageSub).toEqual('');
  });

  it('should start a new experiment', function(){
    experimentSimulationService.startNewExperiments = jasmine.createSpy('startNewExperiments');
    var newExperimentString = 'fubar';
    var newExperimentServerPattern = 'toto';
    scope.startNewExperiment(newExperimentString, newExperimentServerPattern);
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
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.setProgressMessage, jasmine.any(Function), jasmine.any(Function) , jasmine.any(Function));
    var argumentFunction = experimentSimulationService.getExperiments.mostRecentCall.args[1];
    var queryingServersFinishedCallback = experimentSimulationService.getExperiments.mostRecentCall.args[2];
    argumentFunction(experimentTemplatesAugmented);
    queryingServersFinishedCallback();

    expect(scope.experiments).toEqual(experimentTemplatesAugmented);
    expect(rootScope.isQueryingServersFinished).toBe(true);
  });

  it('should filter the experiments',
    //Ignore this warning because of the name_snippetFilter
    /*jshint camelcase: false */
    inject(function(name_snippetFilter) {
      expect(name_snippetFilter(experimentTemplatesArray, 'dog')).toEqual(filteredExperimentTemplatesArray);
    }
  ));

  it('should filter the experiments in user view',
    //Ignore this warning because of the name_snippetFilter
    /*jshint camelcase: false */
    inject(function(byLocationFilter) {
      expect(byLocationFilter(experimentTemplatesArray, 'b', false)).toEqual(experimentTemplatesArray);
      expect(byLocationFilter(experimentTemplatesArray, 'b', true)).toEqual(serverPatternFilteredExperimentTemplatesArray);
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
    interval.flush(REFRESH_UPDATE_RATE - 1000);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();

    // called after in total REFRESH_UPDATE_RATE seconds
    interval.flush(1000);
    expect(experimentSimulationService.refreshExperiments).toHaveBeenCalled();
  });

  it('should stop updating after on $destroy', function() {
    // Querying servers result
    experimentSimulationService.getExperiments.mostRecentCall.args[1]();
    // Querying servers finished
    experimentSimulationService.getExperiments.mostRecentCall.args[2]();

    scope.$destroy();

    // Should do nothing after 30 seconds
    interval.flush(REFRESH_UPDATE_RATE);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
    expect(rootScope.updatePromise).not.toBeDefined();
    expect(rootScope.updateUptimePromise).not.toBeDefined();
  });

  it('should do nothing on $destroy', function() {
    rootScope.updatePromise = undefined;
    scope.$destroy();

    // Should do nothing after 30 seconds
    interval.flush(REFRESH_UPDATE_RATE);
    expect(experimentSimulationService.refreshExperiments).not.toHaveBeenCalled();
    expect(rootScope.updatePromise).not.toBeDefined();
  });


});
