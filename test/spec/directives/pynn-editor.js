/**
 * Created by Bernd Eckstein on 16.10.15.
 */
'use strict';



describe('Directive: pynnEditor', function () {

  String.prototype.repeat = function(num) {
    return new Array( num + 1 ).join( this );
  };

  var VIEW = 'views/esv/pynn-editor.html';

  var $rootScope,
    $compile,
    $httpBackend,
    $scope,
    isolateScope,
    element,
    backendInterfaceService,
    pythonCodeHelper,
    ScriptObject,
    $timeout,
    hbpDialogFactory;

  var backendInterfaceServiceMock = {
    getBrain:  jasmine.createSpy('getBrain'),
    setBrain:  jasmine.createSpy('setBrain'),
    saveBrain: jasmine.createSpy('saveBrain')
  };

  var simulationInfoMock = {
    contextID: '97923877-13ea-4b43-ac31-6b79e130d344',
    simulationID : 'mocked_simulation_id',
    isCollabExperiment: true
  };

  var documentationURLsMock =
  {
    getDocumentationURLs: function () {
      return {
        then: function (callback) {
          return callback({
            cleDocumentationURL: 'cleDocumentationURL',
            backendDocumentationURL: 'backendDocumentationURL'
          });
        }
      };
    }
  };

  var docMock = {
    clearHistory: function () {},
    markClean: function () {}
  };

  var tokenMock = {
    type: 'variable',
    string: 'token'
  };

  var lineMock = {};

  var cmMock = {
    getDoc: function() { return docMock; },
    getTokenAt: function() {return tokenMock; },
    addLineClass: function(/*line, str, str2*/) { return lineMock; },
    addLineWidget: function(/*line, node, boolean*/) {},
    scrollIntoView: function(/*line*/) {},
    removeLineClass: jasmine.createSpy('removeLineClass')
  };

  // @jshint: no i can't make that CamelCase without breaking it
  /* jshint camelcase:false */
  var errorMock1 = {
    data: {
      error_message: 'ERROR',
      error_line: 0,
      error_column: 1
    }
  };

  var errorMock2 = {
    data: {
      error_message: 'Error Message: The name \'token\' is not defined',
      error_line: 0,
      error_column: 0
    }
  };


  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('documentationURLs', documentationURLsMock);
    $provide.value('simulationInfo' , simulationInfoMock);
  }));

  beforeEach(inject(function (_$rootScope_,
                              _$httpBackend_,
                              _$compile_,
                              _backendInterfaceService_,
                              $templateCache,
                              _pythonCodeHelper_,
                              _$timeout_,
                              _hbpDialogFactory_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $compile = _$compile_;
    backendInterfaceService = _backendInterfaceService_;
    pythonCodeHelper = _pythonCodeHelper_;
    ScriptObject = pythonCodeHelper.ScriptObject;
    $timeout = _$timeout_;
    hbpDialogFactory = _hbpDialogFactory_;

    $scope = $rootScope.$new();
    $templateCache.put(VIEW, '');
    $scope.control = {};
    element = $compile('<pynn-editor control="control"/>')($scope);
    $scope.$digest();

    isolateScope = element.isolateScope();
  }));

  it('should set the pynnScript and the populations variables to undefined by default', function () {
    $scope.control.refresh();
    expect(isolateScope.pynnScript).toBeUndefined();
    expect(isolateScope.populations).toBeUndefined();
    expect(backendInterfaceService.getBrain).toHaveBeenCalled();
  });

  it('should return codemirror instance when already set', function() {
    isolateScope.cm = 'CM';
    var cm = isolateScope.getCM();
    expect(cm).toEqual(isolateScope.cm);
  });

  describe('Get/Set brain, PyNN script', function () {
    var data = {
      'brain_type': 'py',
      'data': '// A PyNN script',
      'data_type': 'text',
      'filename': '/path/filename.py',
      'brain_populations': {
        'list1': [1, 2, 3],
        'index1': 9,
        'slice0': {'from': 0, 'to':10, 'step':2 }
      }
    };
    var data2 = {
      'brain_type': 'h5',
      'data': '// binary h5 data',
      'data_type': 'base64',
      'filename': '/path/filename.h5',
      'brain_populations': { 'index': 0}
    };
    var expected_script = data.data;
    var expected_populations = data.brain_populations;

    beforeEach(function () {
      // Mock functions that access elements that are not available in test environment
      isolateScope.getCM = jasmine.createSpy('getCM').andReturn(cmMock);
      backendInterfaceService.getBrain.reset();
      backendInterfaceService.setBrain.reset();
    });

    it('should handle the retrieved populations and pynn script properly', function () {
      // Mock getBrain Callback with data as return value
      backendInterfaceService.getBrain.andCallFake(function(f) { f(data); });
      $scope.control.refresh();
      expect(backendInterfaceService.getBrain).toHaveBeenCalled();
      expect(isolateScope.pynnScript).toEqual(expected_script);
      expect(isolateScope.populations).toEqual(expected_populations);
    });

    it('should not load a h5 brain', function () {
      // Mock getBrain Callback with data2 as return value
      backendInterfaceService.getBrain.andCallFake(function(f) { f(data2); });
      $scope.control.refresh();
      expect(backendInterfaceService.getBrain).toHaveBeenCalled();
      expect(isolateScope.pynnScript).toBeUndefined();
    });

    it('should update a pynn script properly', function () {
      isolateScope.update('pynn script');
      expect(backendInterfaceService.setBrain).toHaveBeenCalled();
      expect(isolateScope.loading).toBe(true);
      backendInterfaceService.setBrain.argsForCall[0][3](); // success callback
      expect(isolateScope.loading).toBe(false);
    });

    it('should save a pynn script properly', function () {
      var script = '# some dummy pynn script';
      expect(isolateScope.isSavingToCollab).toBe(false);
      isolateScope.saveIntoCollabStorage(script);
      expect(backendInterfaceService.saveBrain).toHaveBeenCalledWith(
        simulationInfoMock.contextID,
        script,
        jasmine.any(Function),
        jasmine.any(Function)
      );
      expect(isolateScope.isSavingToCollab).toBe(true);
      backendInterfaceService.saveBrain.argsForCall[0][2]();
      expect(isolateScope.isSavingToCollab).toBe(false);
      isolateScope.isSavingToCollab = true;
      spyOn(hbpDialogFactory, 'alert');
      backendInterfaceService.saveBrain.argsForCall[0][3]();
      expect(isolateScope.isSavingToCollab).toBe(false);
      expect(hbpDialogFactory.alert).toHaveBeenCalled();
    });

    it('should be able to repeat the same test twice', function () {
      isolateScope.update('pynn script');
      expect(backendInterfaceService.setBrain).toHaveBeenCalled();
      expect(isolateScope.loading).toBe(true);
      backendInterfaceService.setBrain.argsForCall[0][3](); // success callback
      expect(isolateScope.loading).toBe(false);
    });

    it('should handle handle an error when sending a pynn script properly (1)', function () {
      isolateScope.update('pynn script');
      expect(backendInterfaceService.setBrain).toHaveBeenCalled();
      expect(isolateScope.loading).toBe(true);
      backendInterfaceService.setBrain.argsForCall[0][4](errorMock1); // error callback
      expect(isolateScope.loading).toBe(false);
    });

    it('should handle handle an error when sending a pynn script properly (2)', function () {
      isolateScope.update('search a\ntoken token\nanother line');
      expect(backendInterfaceService.setBrain).toHaveBeenCalled();
      expect(isolateScope.loading).toBe(true);
      backendInterfaceService.setBrain.argsForCall[0][4](errorMock2); // error callback
      expect(isolateScope.loading).toBe(false);
    });

  });


  describe('Testing pynn-editor functions', function () {

    beforeEach(function () {
      // Mock functions that access elements that are not available in test environment
      isolateScope.getCM = jasmine.createSpy('getCM').andReturn(cmMock);
    });

    it('should parse a token correctly', function() {
      var token = isolateScope.parseName('Error Message: The name \'token\' is not defined');
      expect(token).toEqual('token');
    });

    it('should not parse a token of an unknown error message', function() {
      var token = isolateScope.parseName('Some other error message');
      expect(token).toBe(false);
    });

    it('should search a token', function() {
      isolateScope.pynnScript = 'search a\ntoken token\nanother line';
      var pos = isolateScope.searchToken('token');
      expect(pos.line).toBe(1);
      expect(pos.ch).toBe(0);
    });

    it('should call clear functions', function() {
      isolateScope.lineHandle = jasmine.createSpy('lineHandle');
      isolateScope.lineWidget = jasmine.createSpy('lineWidget');
      isolateScope.lineWidget.clear = jasmine.createSpy('clear');
      isolateScope.cm = cmMock;
      isolateScope.clearError();
      expect(isolateScope.lineWidget.clear).toHaveBeenCalled();
      expect(isolateScope.cm.removeLineClass).toHaveBeenCalled();
    });

  });

  describe('Testing GUI operations on brain populations', function () {

    beforeEach(function () {
      isolateScope.populations = {
            'population1': 1,
            'population2': 2,
            'population_2': 2,
            'population_6': [4, 5],
            'population_10': { 'from': 1, 'to': 10, 'step':1},
            'list_1': [1, 2, 3],
            'slice1': { 'from': 1, 'to': 10, 'step':1},
            'slice2': { 'from': 2, 'to': 10, 'step':5}
          };
    });

    it('should delete a population in the scope.populations object', function() {
      isolateScope.deletePopulation('population1');
      isolateScope.deletePopulation('slice2');
      expect(Object.keys(isolateScope.populations).length).toBe(6);
      expect(isolateScope.populations.population1).toBeUndefined();
      expect(isolateScope.populations.slice2).toBeUndefined();
    });

   it('should generate a new population name', function() {
      expect(isolateScope.populations.population_2).toBeDefined();
      var neuronName = isolateScope.generatePopulationName();
      expect(neuronName).toBe('population_0');
      expect(isolateScope.generatePopulationName()).toBe(neuronName);
      isolateScope.populations.population_0 = 15;
      expect(isolateScope.generatePopulationName()).toBe('population_1');
      isolateScope.populations.population_1 = 150;
      expect(isolateScope.generatePopulationName()).toBe('population_3');
    });

    it('should add a population in the scope.populations object', function() {
      // Add a single index that defaults to 0, with name of the form population_<number>
      expect(isolateScope.populations.population_2).toBeDefined();
      isolateScope.addIndex();
      expect(isolateScope.populations.population_0).toBe(0);
      isolateScope.addIndex();
      expect(isolateScope.populations.population_1).toBe(0);
      isolateScope.addIndex();
      expect(isolateScope.populations.population_3).toBe(0);
      expect(Object.keys(isolateScope.populations).length).toBe(11);

      // Add a list with default value [] and default name of form population_<number>
      var defaultList = [0, 1, 2];
      isolateScope.addList();
      expect(isolateScope.populations.population_4).toEqual(defaultList);
      isolateScope.addList();
      expect(isolateScope.populations.population_5).toEqual(defaultList);
      isolateScope.addList();
      expect(isolateScope.populations.population_7).toEqual(defaultList);
      expect(Object.keys(isolateScope.populations).length).toBe(14);

      // Add a slice with default value {'from': 0, 'to': 0, 'step': 0 } and default name of form population_<number>
      var defaultSlice = {
        'from': 0,
        'to': 0,
        'step': 0
      };
      isolateScope.addSlice();
      expect(isolateScope.populations.population_8).toEqual(defaultSlice);
      isolateScope.addSlice();
      expect(isolateScope.populations.population_9).toEqual(defaultSlice);
      isolateScope.addSlice();
      expect(isolateScope.populations.population_11).toEqual(defaultSlice);
      expect(Object.keys(isolateScope.populations).length).toBe(17);
    });

    it('should test whether a population is a slice or not', function() {
      expect(isolateScope.isSlice([1, 2, 3])).toBe(false);
      expect(isolateScope.isSlice(1)).toBe(false);
      expect(isolateScope.isSlice({})).toBe(true);
    });

  });

});
