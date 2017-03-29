/**
 * Created by Bernd Eckstein on 16.10.15.
 */
'use strict';

describe('Directive: pynnEditor', function () {

  String.prototype.repeat = function(num) {
    return new Array( num + 1 ).join( this );
  };

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
    hbpDialogFactory,
    codeEditorsServices;

  var backendInterfaceServiceMock = {
    getBrain:  jasmine.createSpy('getBrain'),
    setBrain:  jasmine.createSpy('setBrain'),
    saveBrain: jasmine.createSpy('saveBrain')
  };

  var simulationInfoMock = {
    contextID: '97923877-13ea-4b43-ac31-6b79e130d344',
    simulationID : 'mocked_simulation_id',
    isPrivateExperiment: true,
    experimentDetails: {
      brainProcesses: 1
    }
  };

  var autoSaveServiceMock = {
    registerFoundAutoSavedCallback: jasmine.createSpy('registerFoundAutoSavedCallback'),
    clearDirty: jasmine.createSpy('clearDirty')
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

  var tokenMock = {
    type: 'variable',
    string: 'token'
  };

  var lineMock = {};

  var cmMock = {
    getTokenAt: function() {return tokenMock; },
    addLineClass: function(/*line, str, str2*/) { return lineMock; },
    addLineWidget: function(/*line, node, boolean*/) {},
    scrollIntoView: function(/*line*/) {},
    removeLineClass: jasmine.createSpy('removeLineClass'),
    clearHistory: jasmine.createSpy('clearHistory'),
    markClean: jasmine.createSpy('markClean')
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

  var downloadFileServiceMock = {
    downloadFile : jasmine.createSpy('downloadFile')
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('documentationURLs', documentationURLsMock);
    $provide.value('simulationInfo' , simulationInfoMock);
    $provide.value('downloadFileService' , downloadFileServiceMock);
    $provide.value('autoSaveService' , autoSaveServiceMock);
  }));

  beforeEach(inject(function (_$rootScope_,
                              _$httpBackend_,
                              _$compile_,
                              _backendInterfaceService_,
                              $templateCache,
                              _pythonCodeHelper_,
                              _$timeout_,
                              _hbpDialogFactory_,
                              _codeEditorsServices_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $compile = _$compile_;
    backendInterfaceService = _backendInterfaceService_;
    pythonCodeHelper = _pythonCodeHelper_;
    ScriptObject = pythonCodeHelper.ScriptObject;
    $timeout = _$timeout_;
    hbpDialogFactory = _hbpDialogFactory_;
    codeEditorsServices = _codeEditorsServices_;

    autoSaveServiceMock.registerFoundAutoSavedCallback.calls.reset();
    $scope = $rootScope.$new();
    $templateCache.put('views/esv/pynn-editor.html', '');
    $scope.control = {};
    element = $compile('<pynn-editor control="control"/>')($scope);
    $scope.$digest();
    isolateScope = element.isolateScope();
  }));

  describe('Get/Set brain, PyNN script', function () {
    var data = {
      'brain_type': 'py',
      'data': '// A PyNN script',
      'data_type': 'text',
      'filename': '/path/filename.py',
      'additional_populations': [
        { list: '1,2,3', name: 'list1', id: 1 },
        { list: '9', name: 'index1', id: 2 },
        { name: 'slice0', from: 0, to: 10, step: 1, id: 3 }
      ]
    };
    var data2 = {
      'brain_type': 'h5',
      'data': '// binary h5 data',
      'data_type': 'base64',
      'filename': '/path/filename.h5',
      'additional_populations': {'short_list': [0]}
    };
    var expected_script = data.data;
    var expected_populations;

    beforeEach(function () {
      // Mock functions that access elements that are not available in test environment
      codeEditorsServices.getEditor = jasmine.createSpy('getEditor').and.returnValue(cmMock);
      backendInterfaceService.getBrain.calls.reset();
      backendInterfaceService.setBrain.calls.reset();
      expected_populations = data.additional_populations;
    });

    it('should handle the retrieved populations and pynn script properly', function () {
      // Mock getBrain Callback with data as return value
      backendInterfaceService.getBrain.and.callFake(function(f) { f(data); });
      $scope.control.refresh();
      expect(backendInterfaceService.getBrain).toHaveBeenCalled();
      expect(isolateScope.pynnScript).toEqual(expected_script);
      expect(isolateScope.populations).toEqual(expected_populations);
    });

    it('should not load a h5 brain', function () {
      // Mock getBrain Callback with data2 as return value
      backendInterfaceService.getBrain.and.callFake(function(f) { f(data2); });
      $scope.control.refresh();
      expect(backendInterfaceService.getBrain).toHaveBeenCalled();
      expect(isolateScope.pynnScript).toBeUndefined();
    });

    it('should apply changes made on the pynn script and the brain population properly', function () {
      isolateScope.pynnScript = expected_script;
      isolateScope.populations = [{name: 'index', list: '1'}];
      isolateScope.apply(0);
      expect(backendInterfaceService.setBrain).toHaveBeenCalledWith(
        isolateScope.pynnScript,
        {index: [1]},
        'py',
        'text',
        0,
        jasmine.any(Function),
        jasmine.any(Function)
      );
      expect(isolateScope.loading).toBe(true);
      backendInterfaceService.setBrain.calls.argsFor(0)[5](); // success callback
      expect(isolateScope.loading).toBe(false);
    });

    it('should set brain with change_population parameter', function () {
      isolateScope.pynnScript = expected_script;
      isolateScope.populations = [{name: 'index', list: '1'}];
      isolateScope.apply(1);
      expect(backendInterfaceService.setBrain).toHaveBeenCalledWith(
        isolateScope.pynnScript,
        {index: [1]},
        'py',
        'text',
        1,
        jasmine.any(Function),
        jasmine.any(Function)
      );
      expect(isolateScope.loading).toBe(true);
      backendInterfaceService.setBrain.calls.argsFor(0)[5](); // success callback
      expect(isolateScope.loading).toBe(false);
    });

    it('should check set brain agree helper', function () {
      spyOn(isolateScope, 'apply');
      isolateScope.agreeAction();
      expect(isolateScope.apply).toHaveBeenCalledWith(1);
    });

    it('should check set brain disagree helper', function () {
      spyOn(isolateScope, 'apply');
      isolateScope.doNotAgreeAction();
      expect(isolateScope.apply).toHaveBeenCalledWith(2);
    });

    it('should save the pynn script and the neuron populations properly', function () {
      isolateScope.pynnScript = '# some dummy pynn script';
      isolateScope.populations = {'dummy_population': {list: ' 1, 2, 3 '}};
      expect(isolateScope.isSavingToCollab).toBe(false);
      isolateScope.saveIntoCollabStorage();
      expect(backendInterfaceService.saveBrain).toHaveBeenCalledWith(
        simulationInfoMock.contextID,
        isolateScope.pynnScript,
        {'dummy_population': [1, 2, 3]},
        jasmine.any(Function),
        jasmine.any(Function)
      );
      expect(isolateScope.isSavingToCollab).toBe(true);
      backendInterfaceService.saveBrain.calls.argsFor(0)[3]();
      expect(isolateScope.isSavingToCollab).toBe(false);
      isolateScope.isSavingToCollab = true;
      spyOn(hbpDialogFactory, 'alert');
      backendInterfaceService.saveBrain.calls.argsFor(0)[4]();
      expect(isolateScope.isSavingToCollab).toBe(false);
      expect(hbpDialogFactory.alert).toHaveBeenCalled();
    });

    it('should be able to repeat the same test twice', function () {
      isolateScope.apply();
      expect(backendInterfaceService.setBrain).toHaveBeenCalled();
      expect(isolateScope.loading).toBe(true);
      backendInterfaceService.setBrain.calls.argsFor(0)[5](); // success callback
      expect(isolateScope.loading).toBe(false);
    });

    it('should handle an error when sending a pynn script properly (1)', function () {
      isolateScope.apply();
      expect(backendInterfaceService.setBrain).toHaveBeenCalled();
      expect(isolateScope.loading).toBe(true);
      backendInterfaceService.setBrain.calls.argsFor(0)[6](errorMock1); // error callback
      expect(isolateScope.loading).toBe(false);
    });

    it('should handle an error when sending a pynn script properly (2)', function () {
      isolateScope.apply();
      expect(backendInterfaceService.setBrain).toHaveBeenCalled();
      expect(isolateScope.loading).toBe(true);
      isolateScope.pynnScript = 'some pynn script';
      backendInterfaceService.setBrain.calls.argsFor(0)[6](errorMock2); // error callback
      expect(isolateScope.loading).toBe(false);
    });

    it('should not issue any getBrain request after a $destroy event of the parent scope', function() {
      isolateScope.$parent.$destroy();
      expect(isolateScope.control.refresh).toBeUndefined();
    });
  });

  describe('Testing pynn-editor functions', function () {

    beforeEach(function () {
      // Mock functions that access elements that are not available in test environment
      codeEditorsServices.getEditor = jasmine.createSpy('getEditor').and.returnValue(cmMock);
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

    it('should check markError function with NaNs', function () {
      isolateScope.clearError();
      isolateScope.markError(NaN, NaN, NaN);
      expect(isolateScope.lineHandle).toBeUndefined();
    });

    it('should check markError function with zeros', function () {
      isolateScope.clearError();
      isolateScope.markError('', 0, 0);
      expect(isolateScope.lineHandle).toBeUndefined();
    });
  });

  describe('Testing GUI operations on brain populations', function () {

    beforeEach(function () {
      isolateScope.populations = [
        { name: 'population_1', list: '2' },
        { name: 'population_2', list: '2,2' },
        { name: 'population_3', list: '2,1' },
        { name: 'population_4', list: '4,5' },
        { name: 'population_5', from: 1, to: 10 },
        { name: 'population_6', list: '1,2,3' },
        { name: 'population_7', from: 1, to: 10 },
        { name: 'population_8', from: 2, to: 10 }
      ];
    });

    it('should delete a population in the scope.populations object', function() {
      isolateScope.deletePopulation(0);
      isolateScope.deletePopulation(1);
      expect(Object.keys(isolateScope.populations).length).toBe(6);
      expect(isolateScope.populations[0].name).toEqual('population_2');
      expect(isolateScope.populations[1].name).toEqual('population_4');
    });

   it('should generate a new population name', function() {
      expect(isolateScope.populations[0]).toBeDefined();
      var neuronName = isolateScope.generatePopulationName();
      expect(neuronName).toBe('population_0');
      expect(isolateScope.generatePopulationName()).toBe(neuronName);
    });

    it('should add a population in the scope.populations object', function() {
      // Add a list with default value {list: '0, 1, 2'} and default name of form population_<number>
      var defaultList = {list: '0, 1, 2'};
      isolateScope.addList();
      expect(isolateScope.populations[isolateScope.populations.length - 1].list).toEqual(defaultList.list);
      expect(isolateScope.populations.length).toBe(9);

      // Add a slice with default value {'from': 0, 'to': 1, 'step': 1} and default name of form population_<number>
      var expectedSlice = {
        name: 'population_9',
        from: 0,
        to: 1,
        step: 1,
        id: 10
      };
      isolateScope.addSlice();
      expect(isolateScope.populations[isolateScope.populations.length - 1].name).toEqual(expectedSlice.name);
      expect(isolateScope.populations.length).toBe(10);
    });

    it('should test whether a population is a slice or not', function() {
      // A slice is discriminated by means of its properties 'from' and 'to'.
      // Thus isSlice(population) is false if population is a list (JS array or {list: '1,2,3'} object).
      expect(isolateScope.isSlice({list: '1, 2, 3', name: 'test_population'})).toBe(false);
      expect(isolateScope.isSlice({})).toBe(false);
      expect(isolateScope.isSlice({'from': 0})).toBe(false);
      expect(isolateScope.isSlice({'to': 10, 'step': 3})).toBe(false);
      expect(isolateScope.isSlice({'from': 0, 'to': 10})).toBe(true);
      expect(isolateScope.isSlice({'from': 0, 'to': 10, 'step': 3})).toBe(true);
      var slice = {'from': 0, 'to': 5};
      expect(isolateScope.isSlice(slice)).toBe(true);
      slice.from = undefined;
      expect(isolateScope.isSlice(slice)).toBe(true);
      delete slice.from;
      expect(isolateScope.isSlice(slice)).toBe(false);
    });

    it('should test whether step default values are added in populations of type slice', function() {
      var populations = { 'slice1': { from: 0, to: 1 },
                         'slice2': { from: 0, to: 1}
                        };
      populations = isolateScope.preprocessPopulations(populations);
      angular.forEach(populations, function(population){
        if (isolateScope.isSlice(population)) {
          expect(population.step).toBeGreaterThan(0);
        }
      });
    });

    it('should test whether populations of type list have been converted into strings', function() {
      var populations = { 'list_1': { list: [1, 2, 3] },
                          'list_2': { list: [4, 5, 6] }
                        };
      populations = isolateScope.preprocessPopulations(populations);
      angular.forEach(populations, function(population){
        expect(typeof(population.list)).toBe('string');
      });
    });

    it('should set pyNN script & population when auto saved data found', function() {
      isolateScope.agreeAction = jasmine.createSpy('agreeAction');
      expect(isolateScope.collabDirty).toBe(false);
      expect(autoSaveServiceMock.registerFoundAutoSavedCallback.calls.count()).toBe(1);

      var autosavedData = ['pynnScript', 'population'];

      autoSaveServiceMock.registerFoundAutoSavedCallback.calls.mostRecent().args[1](autosavedData, false);
      expect(isolateScope.agreeAction).not.toHaveBeenCalled();
      expect(isolateScope.collabDirty).toBe(true);
      expect(isolateScope.pynnScript).toBe(autosavedData[0]);
      expect(isolateScope.populations).toBe(autosavedData[1]);

      autoSaveServiceMock.registerFoundAutoSavedCallback.calls.mostRecent().args[1](autosavedData, true);
      expect(isolateScope.agreeAction).toHaveBeenCalled();
    });
  });

  describe('Pynn-editor Upload & download', function () {

    beforeEach(function () {
      // Mock functions that access elements that are not available in test environment
      //editorsServices.getEditor = jasmine.createSpy('getEditor').and.returnValue(cmMock);
    });

    it('should call downloadFileService.downloadFile with the right parameters when downloading a file', function() {
      isolateScope.download();
      expect(downloadFileServiceMock.downloadFile.calls.mostRecent().args[0]).toMatch(/^blob:/);
      expect(downloadFileServiceMock.downloadFile.calls.mostRecent().args[1]).toEqual('pynnBrain.py');
    });

    it('should set the pynnScript when one uploads a file', function(done) {
      var new_pynn_script = 'new_pynn_script';
      isolateScope.uploadFile(new Blob([new_pynn_script]));
      setTimeout(function(){
        expect(isolateScope.pynnScript).toBe(new_pynn_script);
        done();
      });
    });
  });
});
