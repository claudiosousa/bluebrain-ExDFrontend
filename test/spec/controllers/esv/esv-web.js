'use strict';

describe('Controller: experimentCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var experimentCtrl,
    scope,
    rootScope,
    window,
    httpBackend,
    timeout,
    experimentSimulationService,
    experimentTemplates,
    experimentTemplatesAugmented,
    filteredExperimentTemplatesAugmented,
    sortedExperimentTemplatesArray,
    STATE;

  var experimentSimulationServiceMock = {};
  experimentSimulationServiceMock.getExperiments = jasmine.createSpy('getExperiments');
  experimentSimulationServiceMock.setInitializedCallback = jasmine.createSpy('setInitializedCallback');
  experimentSimulationServiceMock.getExperiments = jasmine.createSpy('getExperiments');
  experimentSimulationServiceMock.existsAvailableServer = jasmine.createSpy('existsAvailableServer');

  var timeoutMock = jasmine.createSpy('$timeout');

  var windowMock = {};
  windowMock.location = {href : '', reload : jasmine.createSpy('reload')};

  beforeEach(module(function ($provide) {
    $provide.value('experimentSimulationService', experimentSimulationServiceMock);
    $provide.value('$timeout', timeoutMock);
    $provide.value('$window', windowMock);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$window_,
                              _$httpBackend_,
                              _$timeout_,
                              _experimentSimulationService_,
                              _STATE_) {
    rootScope = $rootScope;
    scope = $rootScope.$new();
    window = _$window_;
    httpBackend = _$httpBackend_;
    timeout = _$timeout_;
    experimentSimulationService = _experimentSimulationService_;
    STATE = _STATE_;

    experimentTemplates = {
      '1': {imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx'},
      '3': {imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog'},
      '2': {imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy'}
    };
    sortedExperimentTemplatesArray = [
      {imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx'},
      {imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy'},
      {imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog'}
    ];
    experimentTemplatesAugmented = {
      '1': {imageUrl: 'img/someFakeUrl1 car dog cat.png', name: 'FakeName 1 car', snippet: 'Some Fake Description 1 xxx'},
      '2': {imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', runningExperiments: 1, simulations: [
        {simulationID: 0, experimentID: '2', state: STATE.CREATED, serverID : 'http://bbpce014.epfl.ch:8080'}
      ]},
      '3': {imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', runningExperiments: 3, simulations: [
        { simulationID: 2, experimentID: '3', state: STATE.CREATED, serverID : 'http://bbpce016.epfl.ch:8080'},
        { simulationID: 0, experimentID: '3', state: STATE.INITIALIZED, serverID : 'http://bbpce017.epfl.ch:8080'},
        { simulationID: 2, experimentID: '3', state: STATE.PAUSED, serverID : 'http://bbpce018.epfl.ch:8080'}
      ]}
    };
    filteredExperimentTemplatesAugmented = {
      '2': {imageUrl: 'img/someFakeUrl2 car dog cat.png', name: 'FakeName 2 dog', snippet: 'Some Fake Description 2 yyy', runningExperiments: 1, simulations: [
        {simulationID: 0, experimentID: '2', state: STATE.CREATED, serverID : 'http://bbpce014.epfl.ch:8080'}
      ]},
      '3': {imageUrl: 'img/someFakeUrl3 car dog cat.png', name: 'FakeName 3 cat', snippet: 'Some Fake Description 3 dog', runningExperiments: 3, simulations: [
        { simulationID: 2, experimentID: '3', state: STATE.CREATED, serverID : 'http://bbpce016.epfl.ch:8080'},
        { simulationID: 0, experimentID: '3', state: STATE.INITIALIZED, serverID : 'http://bbpce017.epfl.ch:8080'},
        { simulationID: 2, experimentID: '3', state: STATE.PAUSED, serverID : 'http://bbpce018.epfl.ch:8080'}
      ]}
    };

    experimentCtrl = $controller('experimentCtrl', {
      $rootScope: rootScope,
      $scope: scope
    });

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  it('should init the global variables', function() {
    expect(rootScope.selectedIndex).toEqual(-1);
    expect(rootScope.joinSelectedIndex).toEqual(-1);
    expect(scope.setSelected).toEqual(jasmine.any(Function));
    expect(scope.setJoinableVisible).toEqual(jasmine.any(Function));
    expect(experimentSimulationService.setInitializedCallback).toHaveBeenCalledWith(scope.joinExperiment);
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.setProgressMessage, jasmine.any(Function));
  });

  it('should set the progressbar visible', function() {
    rootScope.joinSelectedIndex = 3;
    rootScope.startNewExperimentSelectedIndex = -1;
    scope.setProgressbarVisible(2);
    expect(rootScope.joinSelectedIndex).toEqual(-1);
    expect(rootScope.startNewExperimentSelectedIndex).toEqual(2);
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
    scope.startNewExperiment(newExperimentString);
    expect(experimentSimulationService.startNewExperiments).toHaveBeenCalledWith(newExperimentString);
  });

  it('should join an experiment', function(){
    scope.setProgressMessage = jasmine.createSpy('setProgressMessage');

    scope.joinExperiment('fake_url');
    expect(scope.setProgressMessage).toHaveBeenCalledWith({main: 'fake_url'});
    expect(window.location.href).toEqual('fake_url');
    expect(window.location.reload).toHaveBeenCalled();
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
    expect(experimentSimulationService.getExperiments).toHaveBeenCalledWith(scope.setProgressMessage, jasmine.any(Function));
    var argumentFunction = experimentSimulationService.getExperiments.mostRecentCall.args[1];
    argumentFunction(experimentTemplatesAugmented);
    expect(scope.experiments).toEqual(experimentTemplatesAugmented);
  });

  it('should filter the experiments',
    //Ignore this warning because of the name_nippetFilter
    /*jshint camelcase: false */
    inject(function(name_snippetFilter) {
      expect(name_snippetFilter(experimentTemplatesAugmented, 'dog')).toEqual(filteredExperimentTemplatesAugmented);
    }
  ));

  it('should reverse-sort the entries',
    inject(function(orderObjectByFilter) {
        expect(orderObjectByFilter(experimentTemplates, 'name', false)).toEqual(sortedExperimentTemplatesArray);
        expect(orderObjectByFilter(experimentTemplates, 'name', true)).toEqual(sortedExperimentTemplatesArray.reverse());
      }
    ));

  it('should set isServerAvailable to true', function() {
    rootScope.isServerAvailable = false;
    experimentSimulationService.existsAvailableServer.mostRecentCall.args[0]();
    expect(rootScope.isServerAvailable).toEqual(true);
  });
});
