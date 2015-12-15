'use strict';

describe('Directive: transferFunctionEditor', function () {

  var $rootScope, $compile, $httpBackend, $log, $timeout, $scope, isolateScope,
    transferFunctions, element, backendInterfaceService,
    currentStateMock, roslib, stateService, STATE, documentationURLs,
    SIMULATION_FACTORY_CLE_ERROR, pythonCodeHelper, ScriptObject, simulationInfo;

  var backendInterfaceServiceMock = {
    getTransferFunctions: jasmine.createSpy('getTransferFunctions'),
    setTransferFunction: jasmine.createSpy('setTransferFunction'),
    deleteTransferFunction: jasmine.createSpy('deleteTransferFunction'),
    getServerBaseUrl: jasmine.createSpy('getServerBaseUrl'),
    saveTF: jasmine.createSpy('saveTF')
  };

  var documentationURLsMock =
  {
    getDocumentationURLs: function() {
      return {
        then: function(callback) {
          return callback({cleDocumentationURL: 'cleDocumentationURL',
            backendDocumentationURL: 'backendDocumentationURL'});}
      };
    }
  };

  var simulationInfoMock = {
    contextID: '97923877-13ea-4b43-ac31-6b79e130d344',
    simulationID : 'mocked_simulation_id',
    isCollabExperiment: true
  };

  var roslibMock = {};
  var returnedConnectionObject = {};
  returnedConnectionObject.subscribe = jasmine.createSpy('subscribe');
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn({});
  roslibMock.createTopic = jasmine.createSpy('createTopic').andReturn(returnedConnectionObject);

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module('currentStateMockFactory'));
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('documentationURLs', documentationURLsMock);
    $provide.value('stateService', currentStateMock);
    $provide.value('roslib', roslibMock);
    $provide.value('simulationInfo', simulationInfoMock);
  }));

  var editorMock = {};
  beforeEach(inject(function (_$rootScope_,
                              _$compile_,
                              _$httpBackend_,
                              _$log_,
                              _$timeout_,
                              _backendInterfaceService_,
                              $templateCache,
                              _currentStateMockFactory_,
                              _documentationURLs_,
                              _roslib_,
                              _stateService_,
                              _STATE_,
                              _SIMULATION_FACTORY_CLE_ERROR_,
                              _pythonCodeHelper_,
                              _simulationInfo_) {
    simulationInfo = _simulationInfo_;
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $httpBackend = _$httpBackend_;
    $log = _$log_;
    $timeout = _$timeout_;
    documentationURLs = _documentationURLs_;
    roslib = _roslib_;
    STATE = _STATE_;
    SIMULATION_FACTORY_CLE_ERROR = _SIMULATION_FACTORY_CLE_ERROR_;
    stateService = _stateService_;
    backendInterfaceService = _backendInterfaceService_;
    currentStateMock = _currentStateMockFactory_.get().stateService;
    editorMock.getLineHandle = jasmine.createSpy('getLineHandle').andReturn(0);
    editorMock.addLineClass = jasmine.createSpy('addLineClass');
    editorMock.removeLineClass = jasmine.createSpy('removeLineClass');
    pythonCodeHelper = _pythonCodeHelper_;
    ScriptObject = pythonCodeHelper.ScriptObject;

    $scope = $rootScope.$new();
    $templateCache.put('views/esv/transfer-function-editor.html', '');
    $scope.control = {};
    element = $compile('<transfer-function-editor control="control"/>')($scope);
    $scope.$digest();
    isolateScope = element.isolateScope();
    transferFunctions = isolateScope.transferFunctions;
  }));

  it('should init the transferFunctions variable', function () {
    $scope.control.refresh();
    expect(isolateScope.transferFunctions).toEqual([]);
    expect(isolateScope.ERROR).toBeDefined();
    expect(backendInterfaceService.getTransferFunctions).toHaveBeenCalled();
    expect(isolateScope.cleDocumentationURL).toEqual('cleDocumentationURL');
  });

  describe('Retrieving, saving and deleting transferFunctions', function () {
    var tf1Name = 'tf1';
    var tf1Code = '@customdecorator(toto)\ndef ' + tf1Name + '(var1, var2):\n\t#put your code here';
    var tf2Name = 'tf2';
    var tf2Code = '@customdecorator(toto)\ndef ' + tf2Name + ' (varx):\n\t#put your code here';
    var tf3Code = '#I am not valid';
    var response = { data: {'tf3': tf3Code, 'tf2' : tf2Code, 'tf1': tf1Code} };
    var expectedTf1, expectedTf2, expectedTf3;
    var expected = [];

    beforeEach(function(){
      $scope.control.refresh();
      expectedTf1 = new ScriptObject('tf1', tf1Code);
      expectedTf2 = new ScriptObject('tf2', tf2Code);
      expectedTf3 = new ScriptObject('tf3', tf3Code);
      expected = [expectedTf1, expectedTf2, expectedTf3];
      isolateScope.transferFunctions = angular.copy(expected);
      transferFunctions = isolateScope.transferFunctions;
    });

    it('should handle the retrieved transferFunctions properly', function () {
      backendInterfaceService.getTransferFunctions.mostRecentCall.args[0](response);
      expect(_.findIndex(transferFunctions, expectedTf1)).not.toBe(-1);
      expect(_.findIndex(transferFunctions, expectedTf2)).not.toBe(-1);
      expect(_.findIndex(transferFunctions, expectedTf3)).not.toBe(-1);
      expect(transferFunctions.length).toBe(3);
      // This order is not guaranteed. Still, keys are printed in insertion order on all major browsers
      // See http://stackoverflow.com/questions/5525795/does-javascript-guarantee-object-property-order
      expect(transferFunctions).toEqual(expected);
    });

    it('should call the refresh function', function() {
      var callback;
      var editor = {
        'refresh': jasmine.createSpy('refresh'),
        'on': function(name, cb) {callback = cb;},
        'off': function() {callback = undefined;}
      };
      isolateScope.refreshLayout(editor);
      expect(callback).toBeDefined();
      callback();
      expect(editor.refresh).toHaveBeenCalled();
      expect(callback).not.toBeDefined();
    });

    it('should save back the tf properly', function () {
      var newCode = 'New code';
      var tf1 = isolateScope.transferFunctions[0];
      tf1.code = newCode;
      tf1.dirty = true;
      tf1.local = true;
      isolateScope.update(tf1);
      expect(backendInterfaceService.setTransferFunction).toHaveBeenCalledWith(
        'tf1', newCode, jasmine.any(Function), jasmine.any(Function)
      );
      backendInterfaceService.setTransferFunction.mostRecentCall.args[2]();
      expect(tf1.dirty).toEqual(false);
      expect(tf1.local).toEqual(false);
    });


    it('should restart the simulation if it was paused for update and the update succeeded', function () {
      var tf1 = isolateScope.transferFunctions[0];
      stateService.currentState = STATE.STARTED;
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.mostRecentCall.args[2]();
      expect(stateService.setCurrentState.callCount).toBe(1);
      stateService.currentState = STATE.PAUSED;
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.mostRecentCall.args[2]();
      expect(stateService.setCurrentState.callCount).toBe(1);
    });

    it('should restart the simulation if it was paused for update and the update failed', function () {
      var tf1 = isolateScope.transferFunctions[0];
      stateService.currentState = STATE.STARTED;
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.mostRecentCall.args[3]();
      expect(stateService.setCurrentState.callCount).toBe(1);
      stateService.currentState = STATE.PAUSED;
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.mostRecentCall.args[3]();
      expect(stateService.setCurrentState.callCount).toBe(1);
    });

    it('should delete a tf properly', function() {
      var tf1 = transferFunctions[0];
      isolateScope.delete(tf1);
      expect(backendInterfaceService.deleteTransferFunction).toHaveBeenCalledWith('tf1', jasmine.any(Function));
      expect(transferFunctions.indexOf(tf1)).toBe(-1);

      var tf2 = transferFunctions[0];
      tf2.local = true;
      isolateScope.delete(tf2);
      expect(transferFunctions.indexOf(tf2)).toBe(-1);
      // Since the tf is local, we should not call back the server
      expect(backendInterfaceService.deleteTransferFunction).not.toHaveBeenCalledWith('tf2', jasmine.any(Function));
    });

    it('should restart the simulation if it was paused for a delete operation', function () {
      var tf1 = transferFunctions[0];
      stateService.currentState = STATE.STARTED;
      isolateScope.delete(tf1);
      backendInterfaceService.deleteTransferFunction.mostRecentCall.args[1]();
      expect(stateService.setCurrentState.callCount).toBe(1);
      stateService.currentState = STATE.PAUSED;
      var tf2 = transferFunctions[1];
      isolateScope.delete(tf2);
      backendInterfaceService.deleteTransferFunction.mostRecentCall.args[1]();
      expect(stateService.setCurrentState.callCount).toBe(1);
    });

    it('should remove tf from array for a local delete operation', function () {
      var tf1 = transferFunctions[0];
      tf1.local = true;
      isolateScope.delete(tf1);
      expect(transferFunctions.indexOf(tf1)).toBe(-1);
    });

    it('should fill the error field of the flawed transfer function', function () {
      var errorType = isolateScope.ERROR.RUNTIME;
      var msg = { functionName: 'tf1', message: 'You nearly broke the platform!', errorType: errorType };
      isolateScope.onNewErrorMessageReceived(msg);
      expect(transferFunctions[0].error[errorType]).toEqual(msg);
      msg.functionName = 'tf2';
      msg.errorType = errorType = isolateScope.ERROR.LOADING;
      isolateScope.onNewErrorMessageReceived(msg);
      expect(transferFunctions[1].error[errorType]).toEqual(msg);
    });

    it('should set to undefined the runtime and loading error fields of a tf if the state reset succeeds', function () {
      var tf1 = isolateScope.transferFunctions[0];
      tf1.error[isolateScope.ERROR.RUNTIME] = {};
      tf1.error[isolateScope.ERROR.LOADING] = {};
      isolateScope.update(tf1);
      expect(tf1.error[isolateScope.ERROR.RUNTIME]).not.toBeDefined();
      expect(tf1.error[isolateScope.ERROR.LOADING]).not.toBeDefined();
    });

    it('should retrieve tf editor', function () {
      spyOn(document, 'getElementById').andReturn({ firstChild: { CodeMirror: editorMock}});
      var editor = isolateScope.getTransferFunctionEditor(transferFunctions[0]);
      expect(editor).toBe(editorMock);
    });

    it('should report syntax error', function () {
      var firstTFName = transferFunctions[0].name;
      var errorType = isolateScope.ERROR.COMPILE;
      var msg = { functionName: firstTFName, message: 'Minor syntax error', lineNumber: 3, errorType: errorType };
      spyOn(isolateScope, 'getTransferFunctionEditor').andReturn(editorMock);
      isolateScope.onNewErrorMessageReceived(msg);
      expect(transferFunctions[0].error[errorType]).toEqual(msg);
      expect(editorMock.getLineHandle).toHaveBeenCalled();
      expect(editorMock.addLineClass).toHaveBeenCalled();
    });

    it('should set the tf compile error field to undefined after a successfull update', function () {
      var tf1 = isolateScope.transferFunctions[1];
      tf1.error[isolateScope.ERROR.COMPILE] = {};
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.mostRecentCall.args[2]();
      expect(tf1.error[isolateScope.ERROR.COMPILE]).not.toBeDefined();
      tf1.error[isolateScope.ERROR.COMPILE] = {};
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.mostRecentCall.args[3]();
      expect(tf1.error[isolateScope.ERROR.COMPILE]).toEqual({});
    });

    it('should highlight the error line in the transfer function editor', function () {
      var compile = isolateScope.ERROR.COMPILE;
      var msg = { functionName: 'tf1', message: 'You are in trouble!', lineNumber: 1,  errorType: compile };
      var tf1 = transferFunctions[0];
      spyOn(isolateScope, 'getTransferFunctionEditor').andReturn(editorMock);
      isolateScope.onNewErrorMessageReceived(msg);
      expect(isolateScope.getTransferFunctionEditor).toHaveBeenCalledWith(tf1);
      expect(tf1.error[compile].lineHandle).toBe(0);
    });

    it('should call the compile error clean-up callback if a new compile error is received', function () {
      var compile = isolateScope.ERROR.COMPILE;
      var msg = { functionName: 'tf1', message: 'You are in trouble!', lineNumber: 1,  errorType: compile };
      spyOn(isolateScope, 'getTransferFunctionEditor').andReturn(editorMock);
      spyOn(isolateScope, 'cleanCompileError');
      isolateScope.onNewErrorMessageReceived(msg);
      expect(isolateScope.cleanCompileError).toHaveBeenCalled();
      msg.errorType = isolateScope.ERROR.RUNTIME;
      isolateScope.cleanCompileError.reset();
      isolateScope.onNewErrorMessageReceived(msg);
      expect(isolateScope.cleanCompileError).not.toHaveBeenCalled();
    });

    it('should remove error highlighting in the editor of the previously flawed transfer function', function () {
      spyOn(isolateScope, 'getTransferFunctionEditor').andReturn(editorMock);
      var tf1 = transferFunctions[0];
      tf1.error[isolateScope.ERROR.COMPILE] = { lineHandle: {} };
      isolateScope.cleanCompileError(tf1);
      expect(editorMock.removeLineClass).toHaveBeenCalled();
      editorMock.removeLineClass.reset();
      tf1.error = { lineHandle: undefined };
      isolateScope.cleanCompileError(tf1);
      expect(editorMock.removeLineClass).not.toHaveBeenCalled();
    });

  });

  describe('Editing transferFunctions', function () {

    it('should create a tf properly', function() {
      var numberOfNewFunctions = 3;
      for (var i = 0; i < numberOfNewFunctions; i = i + 1) {
        isolateScope.create();
      }
      var n = numberOfNewFunctions - 1;
      var tfNewName = 'transferfunction_' + n;
      var expectedTF = {
           id: tfNewName,
           code: '@nrp.Robot2Neuron()\ndef ' + tfNewName + '(t):\n    print \"Hello world at time \" + str(t)',
           dirty: true, local: true, name: tfNewName,
           error: {}
      };
      expect(transferFunctions[0]).toEqual(expectedTF);
    });

    it('should update a TF properly when editing it', function() {
      var tf1Code = '@customdecorator(toto)\ndef tf1(var1, var2):\n\t#put your code here';
      var tf1CodeNewCode = '@customdecorator(toto)\ndef tf_new_name(var1, var2):\n\t#put your code here';
      transferFunctions[0] = new ScriptObject('tf1', tf1Code);
      var tf1 = transferFunctions[0];
      tf1.code = tf1CodeNewCode;
      isolateScope.onTransferFunctionChange(tf1);
      expect(transferFunctions).toEqual(
        [
          { code: tf1CodeNewCode, dirty: true, local: false, name: 'tf_new_name', id: 'tf1', error: {} }
        ]);
    });

    it('should be able to load tf from file', function() {
      var readAsTextSpy = jasmine.createSpy('readAsTextSpy');
      var tfNameMock = ['superPythonFn', 'anotherCoolFn'];

      var transferFunctionsCode = _.map(tfNameMock, function(fnName) {
        var code = '@decorate-my-furniture\n' +
          '@beautiful(decorator)\n' +
          'def '+fnName+' (someParam1, someParam2):\n' +
          '\tinsert awesome python code here\n' +
          '\tand here for multiligne awesomeness\n';
        return code;
      });

      var tfFileMock = transferFunctionsCode.join('');
      var fileReaderMock = {
        readAsText: readAsTextSpy
      };
      var eventMock = {
        target : { result: tfFileMock }
      };
      spyOn(window, 'FileReader').andReturn(fileReaderMock);

      isolateScope.loadTransferFunctions('someFile');
      expect(window.FileReader).toHaveBeenCalled();
      expect(readAsTextSpy).toHaveBeenCalled();
      fileReaderMock.onload(eventMock);
      isolateScope.transferFunctions = [new ScriptObject('tf', 'some unimportant code')];
      $timeout.flush();
      transferFunctions = isolateScope.transferFunctions;
      expect(transferFunctions[0].name).toEqual(tfNameMock[0]);
      expect(transferFunctions[0].code).toEqual(transferFunctionsCode[0]);
      expect(transferFunctions[1].name).toEqual(tfNameMock[1]);
      expect(transferFunctions[1].code).toEqual(transferFunctionsCode[1]);
    });

    it('should not try to load an invalid file', function() {
      var readAsTextSpy = jasmine.createSpy('readAsTextSpy');
      var fileReaderMock = {
        readAsText: readAsTextSpy
      };
      spyOn(window, 'FileReader').andReturn(fileReaderMock);

      isolateScope.loadTransferFunctions({$error:'some error'});
      expect(window.FileReader).not.toHaveBeenCalled();
    });


    it('should save transfer functions to file', function() {
      spyOn(window, 'Blob');
      spyOn(document, 'querySelector');
      var button = { attr: jasmine.createSpy('attr')};
      spyOn(angular, 'element').andReturn(button);
      isolateScope.download();
      expect(button.attr).toHaveBeenCalled();
    });

    it('should initialize scope variables correctly', function () {
      expect(isolateScope.isCollabExperiment).toEqual(simulationInfo.isCollabExperiment);
    });

    it('should correctly saveTFIntoCollabStorage', function () {
      isolateScope.saveTFIntoCollabStorage();
      expect(backendInterfaceService.saveTF).toHaveBeenCalledWith(simulationInfo.contextID, isolateScope.transferFunctions);
    });

  });

});
