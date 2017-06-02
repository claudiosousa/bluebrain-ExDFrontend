'use strict';

describe('Directive: transferFunctionEditor', function () {

  var $rootScope, $compile, $httpBackend, $log, $timeout, $scope, isolateScope,
    transferFunctions, element, backendInterfaceService,
    currentStateMock, roslib, stateService, STATE, documentationURLs,
    SIMULATION_FACTORY_CLE_ERROR, SOURCE_TYPE, pythonCodeHelper, ScriptObject, simulationInfo,
    hbpDialogFactory, downloadFileService, DEFAULT_TF_CODE, codeEditorsServices, $q, environmentService;

  var backendInterfaceServiceMock = {
    getPopulations: jasmine.createSpy('getPopulations'),
    getTransferFunctions: jasmine.createSpy('getTransferFunctions').and.callFake(function(){return $q.when();}),
    setTransferFunction: jasmine.createSpy('setTransferFunction'),
    deleteTransferFunction: jasmine.createSpy('deleteTransferFunction'),
    getServerBaseUrl: jasmine.createSpy('getServerBaseUrl'),
    saveTransferFunctions: jasmine.createSpy('saveTransferFunctions'),
    saveCSVRecordersFiles: jasmine.createSpy('backendInterfaceServiceMock')
  };

  var autoSaveServiceMock = {
    registerFoundAutoSavedCallback: jasmine.createSpy('registerFoundAutoSavedCallback'),
    setDirty: jasmine.createSpy('setDirty'),
    clearDirty: jasmine.createSpy('clearDirty')
  };

  var saveErrorsServiceMock = {
    registerCallback: jasmine.createSpy('registerCallback'),
    saveDirtyData: jasmine.createSpy('saveDirtyData').and.callFake(function(){return $q.when();}),
    clearDirty: jasmine.createSpy('clearDirty')
  };
  var documentationURLsMock = {
    getDocumentationURLs: function() {
      return {
        cleDocumentationURL: 'cleDocumentationURL',
        backendDocumentationURL: 'backendDocumentationURL'
      };
    }
  };

  var roslibMock = {};
  var returnedConnectionObject = {};
  returnedConnectionObject.subscribe = jasmine.createSpy('subscribe');
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').and.returnValue({});
  roslibMock.createTopic = jasmine.createSpy('createTopic').and.returnValue(returnedConnectionObject);

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module('currentStateMockFactory'));
  beforeEach(module('simulationInfoMock'));
  beforeEach(module('userContextServiceMock'));
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('documentationURLs', documentationURLsMock);
    $provide.value('stateService', currentStateMock);
    $provide.value('roslib', roslibMock);
    $provide.value('autoSaveService', autoSaveServiceMock);
    $provide.value('saveErrorsService', saveErrorsServiceMock);
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
                              _SOURCE_TYPE_,
                              _pythonCodeHelper_,
                              _simulationInfo_,
                              _hbpDialogFactory_,
                              _downloadFileService_,
                              _DEFAULT_TF_CODE_,
                              _codeEditorsServices_,
                              _$q_,
                              _environmentService_) {
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
    SOURCE_TYPE = _SOURCE_TYPE_;
    stateService = _stateService_;
    backendInterfaceService = _backendInterfaceService_;
    currentStateMock = _currentStateMockFactory_.get().stateService;
    editorMock.addLineClass = jasmine.createSpy('addLineClass');
    editorMock.removeLineClass = jasmine.createSpy('removeLineClass');
    pythonCodeHelper = _pythonCodeHelper_;
    ScriptObject = pythonCodeHelper.ScriptObject;
    hbpDialogFactory = _hbpDialogFactory_;
    downloadFileService = _downloadFileService_;
    DEFAULT_TF_CODE = _DEFAULT_TF_CODE_;
    codeEditorsServices = _codeEditorsServices_;
    $q = _$q_;
    environmentService = _environmentService_;

    spyOn(codeEditorsServices, 'refreshAllEditors');
    $scope = $rootScope.$new();
    $templateCache.put('views/esv/transfer-function-editor.html', '');
    $scope.control = {};
    element = $compile('<transfer-function-editor control="control"/>')($scope);
    $scope.$digest();
    isolateScope = element.isolateScope();
    transferFunctions = isolateScope.transferFunctions;
  }));

  it('should request transferFunctions on initialization', function () {
    expect(isolateScope.transferFunctions).toEqual([]);
    expect(isolateScope.ERROR).toBeDefined();
    expect(backendInterfaceService.getTransferFunctions).toHaveBeenCalled();
    expect(isolateScope.cleDocumentationURL).toEqual('cleDocumentationURL');
  });

  it('should init the populations variable', function () {
    $scope.control.refresh();
    expect(isolateScope.populations).toEqual([]);
    expect(isolateScope.showPopulations).toBe(false);
  });

  it('should load the populations when showPopulations is True', function () {
    isolateScope.showPopulations = true;
    $scope.control.refresh();
    $scope.$digest();
    expect(isolateScope.populations).toEqual([]);
    expect(isolateScope.showPopulations).toBe(true);
    expect(backendInterfaceService.getPopulations).toHaveBeenCalled();
  });

  it('should toggle populations visibility', function () {
    isolateScope.togglePopulations();
    expect(isolateScope.showPopulations).toBe(true);
    expect(backendInterfaceService.getPopulations).toHaveBeenCalled();
  });

  it('should toggle populations correctly', function() {
    var population = { name: 'test'};
    population.showDetails = false;
    isolateScope.togglePopulationParameters(population);
    expect(population.showDetails).toBe(true);
    isolateScope.togglePopulationParameters(population);
    expect(population.showDetails).toBe(false);
  });

  it('should set the saving flag correctly if csv saving succeed', function() {
    expect(isolateScope.isSavingCSVToCollab).toBeFalsy();
    isolateScope.saveCSVIntoCollabStorage();
    expect(backendInterfaceServiceMock.saveCSVRecordersFiles).toHaveBeenCalled();
    expect(isolateScope.isSavingCSVToCollab).toBe(true);
    backendInterfaceServiceMock.saveCSVRecordersFiles.calls.mostRecent().args[1]();
    expect(isolateScope.isSavingCSVToCollab).toBe(false);
  });

  it('should set the saving flag correctly if csv saving failed', function() {
    expect(isolateScope.isSavingCSVToCollab).toBeFalsy();
    isolateScope.saveCSVIntoCollabStorage();
    expect(backendInterfaceServiceMock.saveCSVRecordersFiles).toHaveBeenCalled();
    expect(isolateScope.isSavingCSVToCollab).toBe(true);
    backendInterfaceServiceMock.saveCSVRecordersFiles.calls.mostRecent().args[1]();
    expect(isolateScope.isSavingCSVToCollab).toBe(false);
  });

  it('should set dirty status of autosaved stuff found', function() {
    var tfs = 'tfs';
    expect(autoSaveServiceMock.registerFoundAutoSavedCallback).toHaveBeenCalled();
    autoSaveServiceMock.registerFoundAutoSavedCallback.calls.mostRecent().args[1](tfs);
    expect(isolateScope.transferFunctions).toBe(tfs);
    expect(isolateScope.collabDirty).toBe(true);
  });

  it('should overwrite TFs with new error data', function() {
    var tfs = 'tfs';
    expect(saveErrorsServiceMock.registerCallback).toHaveBeenCalled();
    saveErrorsServiceMock.registerCallback.calls.mostRecent().args[1](tfs);
    expect(isolateScope.transferFunctions).toBe(tfs);
  });

   it('should refresh code editors on refresh if dirty', function() {
    expect(codeEditorsServices.refreshAllEditors.calls.count()).toBe(1);
    isolateScope.collabDirty = true;
    isolateScope.transferFunctions = [1, 2, 3];
    isolateScope.control.refresh();
    $rootScope.$digest();
    expect(codeEditorsServices.refreshAllEditors.calls.count()).toBe(2);
  });

  it('should add new populations correctly', function() {
    var population = { name: 'test'};
    expect(isolateScope.populations).toEqual([]);
    isolateScope.onPopulationsReceived(population);
    expect(isolateScope.populations).toEqual([population]);
    isolateScope.onPopulationsReceived(population);
    expect(isolateScope.populations).toEqual([population]);
  });

  describe('Retrieving transferFunctions', function () {
    var tf1Name = 'tf1';
    var tf1Code = '@customdecorator(toto)\ndef ' + tf1Name + '(var1, var2):\n\t#put your code here';
    var response = { data: {'tf1': tf1Code} };
    var expectedTf1, expected;

    beforeEach(function(){
      expectedTf1 = new ScriptObject('tf1', tf1Code);
      expected = [expectedTf1];
    });

    it('should handle the retrieved transferFunctions properly', function () {
      // call the callback given to getTransferFunctions with a response mock
      spyOn(document, 'getElementById').and.returnValue({ firstChild: { CodeMirror: editorMock}});
      backendInterfaceService.getTransferFunctions.calls.mostRecent().args[0](response);
      expect(_.findIndex(isolateScope.transferFunctions, expectedTf1)).not.toBe(-1);
      expect(isolateScope.transferFunctions.length).toBe(1);
      // This order is not guaranteed. Still, keys are printed in insertion order on all major browsers
      // See http://stackoverflow.com/questions/5525795/does-javascript-guarantee-object-property-order
      expect(isolateScope.transferFunctions).toEqual(expected);

      // The tfs should be refreshed on initialization
      expect(codeEditorsServices.refreshAllEditors).toHaveBeenCalled();
    });
  });

  describe('Saving and deleting TransferFunctions', function() {
    var tf1Name = 'tf1';
    var tf1Code = '@customdecorator(toto)\ndef ' + tf1Name + '(var1, var2):\n\t#put your code here';
    var tf2Name = 'tf2';
    var tf2Code = '@customdecorator(toto)\ndef ' + tf2Name + ' (varx):\n\t#put your code here';
    var tf3Code = '#I am not valid';
    var expectedTf1, expectedTf2, expectedTf3;
    var expected = [];

    beforeEach(function(){
      $scope.control.refresh();
      expectedTf1 = new ScriptObject('tf1', tf1Code);
      expectedTf2 = new ScriptObject('tf2', tf2Code);
      expectedTf3 = new ScriptObject('tf3', tf3Code);
      expected = [expectedTf1, expectedTf2, expectedTf3];
      transferFunctions = angular.copy(expected);
      // We now assume that the transferFunctions are already retrieved
      isolateScope.transferFunctions = angular.copy(expected);
      transferFunctions = isolateScope.transferFunctions;
    });

    it('should save back the tf properly', function () {
      var newCode = '@nrp.Robot2Neuron()\ndef toto(): \nNew code';
      var tf1 = isolateScope.transferFunctions[0];
      tf1.code = newCode;
      tf1.dirty = true;
      tf1.local = true;
      isolateScope.update(tf1);
      expect(backendInterfaceService.setTransferFunction).toHaveBeenCalledWith(
        'tf1', newCode, jasmine.any(Function), jasmine.any(Function)
      );
      backendInterfaceService.setTransferFunction.calls.mostRecent().args[2]();
      expect(tf1.dirty).toEqual(false);
      expect(tf1.local).toEqual(false);
      expect(tf1.id).toEqual('toto');
    });


    it('should restart the simulation if it was paused for update and the update succeeded', function () {
      var tf1 = isolateScope.transferFunctions[0];
      stateService.currentState = STATE.STARTED;
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.calls.mostRecent().args[2]();
      expect(stateService.setCurrentState.calls.count()).toBe(1);
      stateService.currentState = STATE.PAUSED;
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.calls.mostRecent().args[2]();
      expect(stateService.setCurrentState.calls.count()).toBe(1);
    });

    it('should restart the simulation if it was paused for update and the update failed', function () {
      var tf1 = isolateScope.transferFunctions[0];
      stateService.currentState = STATE.STARTED;
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.calls.mostRecent().args[3]();
      expect(stateService.setCurrentState.calls.count()).toBe(1);
      stateService.currentState = STATE.PAUSED;
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.calls.mostRecent().args[3]();
      expect(stateService.setCurrentState.calls.count()).toBe(1);
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
      backendInterfaceService.deleteTransferFunction.calls.mostRecent().args[1]();
      expect(stateService.setCurrentState.calls.count()).toBe(1);
      stateService.currentState = STATE.PAUSED;
      var tf2 = transferFunctions[1];
      isolateScope.delete(tf2);
      backendInterfaceService.deleteTransferFunction.calls.mostRecent().args[1]();
      expect(stateService.setCurrentState.calls.count()).toBe(1);
    });

    it('should remove tf from array for a local delete operation', function () {
      var tf1 = transferFunctions[0];
      tf1.local = true;
      isolateScope.delete(tf1);
      expect(transferFunctions.indexOf(tf1)).toBe(-1);
    });

    it('should fill the error field of the flawed transfer function', function () {
      var errorType = isolateScope.ERROR.RUNTIME;
      var msg = { functionName: 'tf1', message: 'You nearly broke the platform!', errorType: errorType, severity: 1, sourceType: SOURCE_TYPE.TRANSFER_FUNCTION };
      isolateScope.onNewErrorMessageReceived(msg);
      expect(transferFunctions[0].error[errorType]).toEqual(msg);
      msg.functionName = 'tf2';
      msg.errorType = errorType = isolateScope.ERROR.LOADING;
      isolateScope.onNewErrorMessageReceived(msg);
      expect(transferFunctions[1].error[errorType]).toEqual(msg);
    });

    it('should display error in a popup when tf editor is not shown', function () {
      var errorType = isolateScope.ERROR.RUNTIME;
      var msg = { functionName: 'tf1', message: 'You nearly broke the platform!', errorType: errorType, severity: 1, sourceType: SOURCE_TYPE.TRANSFER_FUNCTION };

      spyOn(hbpDialogFactory, 'alert');
      expect(hbpDialogFactory.alert).not.toHaveBeenCalled();

      // can't find a way to set offsetParent in phantomjs, or force element display
      // element[0].offsetParent = "toto";
      // isolateScope.onNewErrorMessageReceived(msg);
      // expect(hbpDialogFactory.alert).not.toHaveBeenCalled();

      // the editor is not visible
      element[0].style.display = 'none';
      isolateScope.onNewErrorMessageReceived(msg);
      expect(hbpDialogFactory.alert).toHaveBeenCalled();

      hbpDialogFactory.alert.calls.reset();
    });

    it('should ignore state machine errors', function () {
      var errorType = isolateScope.ERROR.RUNTIME;
      var msg = { functionName: 'tf1', message: 'You nearly broke the platform!', errorType: errorType, severity: 1, sourceType: SOURCE_TYPE.STATE_MACHINE };
      isolateScope.onNewErrorMessageReceived(msg);
      expect(transferFunctions[0].error[errorType]).toBeUndefined();
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
      spyOn(document, 'getElementById').and.returnValue({ firstChild: { CodeMirror: editorMock}});
      var editor = codeEditorsServices.getEditor(transferFunctions[0]);
      expect(editor).toBe(editorMock);
    });

    it('should report syntax error', function () {
      var firstTFName = transferFunctions[0].name;
      var errorType = isolateScope.ERROR.COMPILE;
      var msg = { functionName: firstTFName, message: 'Minor syntax error', lineNumber: 3, errorType: errorType, severity: 1, sourceType: SOURCE_TYPE.TRANSFER_FUNCTION };
      spyOn(codeEditorsServices, 'getEditor').and.returnValue(editorMock);
      isolateScope.onNewErrorMessageReceived(msg);
      expect(transferFunctions[0].error[errorType]).toEqual(msg);
      expect(editorMock.addLineClass).toHaveBeenCalled();
    });

    it('should set the tf compile error field to undefined after a successfull update', function () {
      var tf1 = isolateScope.transferFunctions[1];
      tf1.error[isolateScope.ERROR.COMPILE] = {};
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.calls.mostRecent().args[2]();
      expect(tf1.error[isolateScope.ERROR.COMPILE]).not.toBeDefined();
      tf1.error[isolateScope.ERROR.COMPILE] = {};
      isolateScope.update(tf1);
      backendInterfaceService.setTransferFunction.calls.mostRecent().args[3]();
      expect(tf1.error[isolateScope.ERROR.COMPILE]).toEqual({});
    });

    it('should highlight the error line in the transfer function editor', function () {
      var compile = isolateScope.ERROR.COMPILE;
      var msg = { functionName: 'tf1', message: 'You are in trouble!', lineNumber: 1,  errorType: compile, severity: 1, sourceType: SOURCE_TYPE.TRANSFER_FUNCTION };
      var tf1 = transferFunctions[0];
      spyOn(codeEditorsServices, 'getEditor').and.returnValue(editorMock);
      isolateScope.onNewErrorMessageReceived(msg);
      expect(codeEditorsServices.getEditor).toHaveBeenCalledWith('transfer-function-' + tf1.id);
      expect(tf1.error[compile].lineHandle).toBe(0);
    });

    it('should call the compile error clean-up callback if a new compile error is received', function () {
      var compile = isolateScope.ERROR.COMPILE;
      var msg = { functionName: 'tf1', message: 'You are in trouble!', lineNumber: 1,  errorType: compile, severity: 1, sourceType: SOURCE_TYPE.TRANSFER_FUNCTION };
      spyOn(codeEditorsServices, 'getEditor').and.returnValue(editorMock);
      spyOn(isolateScope, 'cleanCompileError');
      isolateScope.onNewErrorMessageReceived(msg);
      expect(isolateScope.cleanCompileError).toHaveBeenCalled();
      msg.errorType = isolateScope.ERROR.RUNTIME;
      isolateScope.cleanCompileError.calls.reset();
      isolateScope.onNewErrorMessageReceived(msg);
      expect(isolateScope.cleanCompileError).not.toHaveBeenCalled();
    });

    it('should retrieve the flawed TF using its ID when an error is received', function () {
      var namingError = isolateScope.ERROR.NO_OR_MULTIPLE_NAMES;
      var tf1 = transferFunctions[0];
      tf1.name = '';
      var msg = { functionName: 'tf1', message: 'Invalid def name', lineNumber: -1,  errorType: namingError, severity: 1, sourceType: SOURCE_TYPE.TRANSFER_FUNCTION };
      spyOn(_, 'find').and.returnValue(tf1);
      isolateScope.onNewErrorMessageReceived(msg);
      expect(_.find).toHaveBeenCalledWith(isolateScope.transferFunctions, { 'id': msg.functionName });
    });

    it('should retrieve the flawed TF using its name when no TF found using its ID when an error is received', function () {
      var namingError = isolateScope.ERROR.NO_OR_MULTIPLE_NAMES;
      var tf1 = transferFunctions[0];
      tf1.name = 'NewFunctionName';
      tf1.id = 'OldFunctionName';
      var msg = { functionName: 'NewFunctionName', message: 'Invalid def name', lineNumber: -1,  errorType: namingError, severity: 1, sourceType: SOURCE_TYPE.TRANSFER_FUNCTION };
      spyOn(_, 'find').and.callFake(function(arg1, arg2){
        if (Object.keys(arg2)[0] === 'id'){
          return undefined;
        }
        return tf1;
      });
      isolateScope.onNewErrorMessageReceived(msg);
      expect(Object.keys(_.find.calls.mostRecent().args[1])[0]).toBe('name');
    });

    it('should remove error highlighting in the editor of the previously flawed transfer function', function () {
      spyOn(codeEditorsServices, 'getEditor').and.returnValue(editorMock);
      var tf1 = transferFunctions[0];
      tf1.error[isolateScope.ERROR.COMPILE] = { lineHandle: {} };
      isolateScope.cleanCompileError(tf1);
      expect(editorMock.removeLineClass).toHaveBeenCalled();
      editorMock.removeLineClass.calls.reset();
      tf1.error = { lineHandle: undefined };
      isolateScope.cleanCompileError(tf1);
      expect(editorMock.removeLineClass).not.toHaveBeenCalled();
    });

    it('should remove the Compile or NoOrMultipleNames errors if the TF update is successfull', function () {
      var tf1 = transferFunctions[0];
      tf1.error[isolateScope.ERROR.COMPILE] = tf1.error[isolateScope.ERROR.NO_OR_MULTIPLE_NAMES] = {};
      isolateScope.cleanCompileError(tf1);
      expect(tf1.error[isolateScope.ERROR.COMPILE]).not.toBeDefined();
      expect(tf1.error[isolateScope.ERROR.NO_OR_MULTIPLE_NAMES]).not.toBeDefined();
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
      var expectedTF = jasmine.objectContaining({
           id: tfNewName,
           code: DEFAULT_TF_CODE.replace('{0}', tfNewName),
           dirty: true, local: true, name: tfNewName,
           error: {}
      });
      expect(transferFunctions[0]).toEqual(expectedTF);
    });

    it('should be able to create tfs at the end of the list', function () {
      var numberOfNewFunctions = 3;
      for (var i = 0; i < numberOfNewFunctions; i = i + 1) {
        isolateScope.create(true);//append at the end
      }
      var n = numberOfNewFunctions - 1;
      var tfNewName = 'transferfunction_' + n;
      var expectedTF = jasmine.objectContaining({
        id: tfNewName,
        code: DEFAULT_TF_CODE.replace('{0}', tfNewName),
        dirty: true, local: true, name: tfNewName,
        error: {}
      });
      expect(transferFunctions[transferFunctions.length-1]).toEqual(expectedTF);
    });

    it('should update a TF properly when editing it', function() {
      var tf1Code = '@nrp.customdecorator(toto)\ndef tf1(var1, var2):\n\t#put your code here';
      var tf1CodeNewCode = '@nrp.customdecorator(toto)\ndef tf_new_name(var1, var2):\n\t#put your code here';
      transferFunctions[0] = new ScriptObject('tf1', tf1Code);
      var tf1 = transferFunctions[0];
      tf1.code = tf1CodeNewCode;
      isolateScope.onTransferFunctionChange(tf1);
      expect(transferFunctions).toEqual(
        [
         jasmine.objectContaining( { code: tf1CodeNewCode, dirty: true, local: false, name: 'tf_new_name', id: 'tf1', error: {} })
        ]);
      // When updating the code of a newly created TF, we also update its ID using the computed TF name
      tf1.local = true;
      isolateScope.onTransferFunctionChange(tf1);
      expect(tf1.id).toEqual(tf1.name);

    });

    it('should be able to load tf from file', function() {
      var readAsTextSpy = jasmine.createSpy('readAsTextSpy');
      var tfNameMock = ['superPythonFn', 'anotherCoolFn'];

      var transferFunctionsCode = _.map(tfNameMock, function(fnName) {
        var code = '@decorate-my-furniture\n' +
          '@nrp.Robot2Neuron()\n' +
          'def '+fnName+' (someParam1, someParam2):\n' +
          '    insert awesome python code here\n' +
          '    and here for multiligne awesomeness';
        return code;
      });

      var tfFileMock = transferFunctionsCode.join('\n');
      var fileReaderMock = {
        readAsText: readAsTextSpy
      };
      var eventMock = {
        target : { result: tfFileMock }
      };
      spyOn(window, 'FileReader').and.returnValue(fileReaderMock);
      backendInterfaceServiceMock.setTransferFunction.and.callFake(function(a, b, cb){ cb();});
      isolateScope.loadTransferFunctions('someFile')
      .then(function(){
        transferFunctions = isolateScope.transferFunctions;
        expect(transferFunctions[0].name).toEqual(tfNameMock[0]);
        expect(transferFunctions[0].code).toEqual(transferFunctionsCode[0]);
        expect(transferFunctions[1].name).toEqual(tfNameMock[1]);
        expect(transferFunctions[1].code).toEqual(transferFunctionsCode[1]);
      });
      expect(window.FileReader).toHaveBeenCalled();
      expect(readAsTextSpy).toHaveBeenCalled();
      fileReaderMock.onload(eventMock);
      isolateScope.$digest();
      isolateScope.transferFunctions = [new ScriptObject('tf', 'some unimportant code')];
      $timeout.flush();
    });

    it('should not try to load an invalid file', function() {
      var readAsTextSpy = jasmine.createSpy('readAsTextSpy');
      var fileReaderMock = {
        readAsText: readAsTextSpy
      };
      spyOn(window, 'FileReader').and.returnValue(fileReaderMock);

      isolateScope.loadTransferFunctions({$error:'some error'});
      expect(window.FileReader).not.toHaveBeenCalled();
    });

     it('should save transfer functions to file', function () {
      spyOn(downloadFileService, 'downloadFile');
      spyOn(window, 'Blob').and.returnValue({});
      var href = 'http://some/url';
      var URLMock = {createObjectURL: jasmine.createSpy('createObjectURL').and.returnValue(href)};
      window.URL = URLMock;
      isolateScope.download(new ScriptObject('transferFunctionId', 'Some code'));
      expect(URLMock.createObjectURL).toHaveBeenCalled();
      expect(downloadFileService.downloadFile).toHaveBeenCalledWith(href, 'transferFunctions.py');
    });

    it('should initialize scope variables correctly', function () {
      expect(isolateScope.isPrivateExperiment).toEqual(environmentService.isPrivateExperiment());
    });

    it('should correctly saveTFIntoCollabStorage', function () {
      expect(isolateScope.isSavingToCollab).toEqual(false);
      isolateScope.saveTFIntoCollabStorage();
      expect(backendInterfaceService.saveTransferFunctions).toHaveBeenCalledWith(simulationInfo.contextID, _.map(isolateScope.transferFunctions, 'code'), jasmine.any(Function), jasmine.any(Function));
      expect(isolateScope.isSavingToCollab).toEqual(true);
      backendInterfaceService.saveTransferFunctions.calls.argsFor(0)[2]();
      expect(isolateScope.isSavingToCollab).toBe(false);
      isolateScope.isSavingToCollab = true;

      spyOn(hbpDialogFactory, 'alert');
      backendInterfaceService.saveTransferFunctions.calls.argsFor(0)[3]();
      expect(isolateScope.isSavingToCollab).toBe(false);
      expect(hbpDialogFactory.alert).toHaveBeenCalled();
      hbpDialogFactory.alert.calls.reset();
    });

    it('should correctly saveTFIntoCollabStorage when TFs contain errors', function () {
      var userResponse = $q.when();
      spyOn(hbpDialogFactory,'confirm').and.callFake(function(){ return userResponse;});
      backendInterfaceService.saveTransferFunctions.calls.reset();
      expect(backendInterfaceServiceMock.saveTransferFunctions).not.toHaveBeenCalled();
      isolateScope.transferFunctions = [{error: {errorMsg:'an error message'}}];
      expect(isolateScope.isSavingToCollab).toEqual(false);

      isolateScope.saveTFIntoCollabStorage();
      $rootScope.$digest();
      expect(backendInterfaceServiceMock.saveTransferFunctions).not.toHaveBeenCalled();
      expect(isolateScope.isSavingToCollab).toEqual(false);
      expect(saveErrorsServiceMock.saveDirtyData).toHaveBeenCalled();
      expect(autoSaveServiceMock.clearDirty).toHaveBeenCalled();
      isolateScope.isSavingToCollab = true;

      saveErrorsServiceMock.saveDirtyData.calls.reset();
      autoSaveServiceMock.clearDirty.calls.reset();
      backendInterfaceServiceMock.saveTransferFunctions.calls.reset();
      userResponse = $q.reject(); // no

      isolateScope.saveTFIntoCollabStorage();
      $rootScope.$digest();
      expect(backendInterfaceServiceMock.saveTransferFunctions).not.toHaveBeenCalled();
      expect(saveErrorsServiceMock.saveDirtyData).not.toHaveBeenCalled();
      expect(autoSaveServiceMock.clearDirty).not.toHaveBeenCalled();
      expect(isolateScope.isSavingToCollab).toEqual(false);

    });
  });
});

describe('Directive: transferFunctionEditor refresh populations', function () {

  var $rootScope, $compile, $scope, $q, isolateScope,
    element;

  var backendInterfaceServiceMock = {};
  backendInterfaceServiceMock.getPopulations = function () {
    isolateScope.onPopulationsReceived(shownPopulation);
  };

  backendInterfaceServiceMock.getTransferFunctions = function () {
    return $q.when();
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

  var roslibMock = {};
  var returnedConnectionObject = {};
  returnedConnectionObject.subscribe = jasmine.createSpy('subscribe');
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').and.returnValue({});
  roslibMock.createTopic = jasmine.createSpy('createTopic').and.returnValue(returnedConnectionObject);

  var shownPopulation = { name: 'test2', showDetails : false};

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module('currentStateMockFactory'));
  beforeEach(module('simulationInfoMock'));
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('documentationURLs', documentationURLsMock);
    $provide.value('roslib', roslibMock);
  }));

  beforeEach(inject(function (_$rootScope_,
                              _$q_,
                              _$compile_,
                              $templateCache) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;

    $scope = $rootScope.$new();
    $templateCache.put('views/esv/transfer-function-editor.html', '');
    $scope.control = {};
    element = $compile('<transfer-function-editor control="control"/>')($scope);
    $scope.$digest();
    isolateScope = element.isolateScope();
  }));

  it('should refresh correctly', function() {
    var population = { name: 'test', showDetails : false};

    isolateScope.onPopulationsReceived(population);
    expect(isolateScope.populations).toEqual([population]);

    isolateScope.togglePopulations();
    expect(isolateScope.populations).toEqual([shownPopulation]);
  });
});
