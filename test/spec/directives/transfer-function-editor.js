'use strict';

describe('Directive: transferFunctionEditor', function () {

  var $rootScope, $compile, $httpBackend, $log, $scope, element, backendInterfaceService,
    nrpBackendVersions, currentStateMock;

  var backendInterfaceServiceMock = {
    getTransferFunctions: jasmine.createSpy('getTransferFunctions'),
    setTransferFunction: jasmine.createSpy('setTransferFunction'),
    deleteTransferFunction: jasmine.createSpy('deleteTransferFunction'),
    getServerBaseUrl: jasmine.createSpy('getServerBaseUrl')
  };

  var nrpBackendVersionsGetMock = jasmine.createSpy('get');
  var nrpBackendVersionsMock = jasmine.createSpy('nrpBackendVersions').andReturn({get: nrpBackendVersionsGetMock});

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('currentStateMockFactory'));
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('nrpBackendVersions', nrpBackendVersionsMock);
    $provide.value('stateService', currentStateMock);
  }));
  beforeEach(inject(function (_$rootScope_,
                              _$compile_,
                              _$httpBackend_,
                              _$log_,
                              _backendInterfaceService_,
                              _nrpBackendVersions_,
                              $templateCache,
                              _currentStateMockFactory_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $httpBackend = _$httpBackend_;
    $log = _$log_;
    backendInterfaceService = _backendInterfaceService_;
    nrpBackendVersions = _nrpBackendVersions_;
    currentStateMock = _currentStateMockFactory_.get().stateService;

    $scope = $rootScope.$new();
    $templateCache.put('views/esv/transfer-function-editor.html', '');
    $scope.control = {};
    element = $compile('<transfer-function-editor control="control"/>')($scope);
    $scope.$digest();
  }));

  it('should init the transferFunctions variable', function () {
    $scope.control.refresh();
    expect(element.isolateScope().transferFunctions).toBeDefined();
    expect(backendInterfaceService.getServerBaseUrl).toHaveBeenCalled();
    expect(nrpBackendVersions).toHaveBeenCalled();
    expect(backendInterfaceService.getTransferFunctions).toHaveBeenCalled();
  });

  describe('Retrieving, saving and deleting transferFunctions', function () {
    var tf1Name = 'tf1';
    var tf1Code = '@customdecorator(toto)\ndef ' + tf1Name + '(var1, var2):\n\t#put your code here';
    var tf2Name = 'tf2';
    var tf2Code = '@customdecorator(toto)\ndef ' + tf2Name + ' (varx):\n\t#put your code here';
    var tf3Code = '#I am not valid';
    var transferFunctionsReturned = [tf1Code, tf2Code, tf3Code];

    beforeEach(function(){
      $scope.control.refresh();
      backendInterfaceService.getTransferFunctions.mostRecentCall.args[0](transferFunctionsReturned);
    });

    it('should handle the retrieved transferFunctions properly', function () {

      var expectedTf1 = {code: tf1Code, dirty: false, local: false, functionName: 'tf1', id: 'tf1'};
      var expectedTf2 = {code: tf2Code, dirty: false, local: false, functionName: 'tf2', id: 'tf2'};
      var expected = [expectedTf2, expectedTf1];
      expect(element.isolateScope().transferFunctions).toEqual(expected);
    });

    it('should save back the tf properly', function () {
      var newCode = 'New code';
      element.isolateScope().transferFunctions[1].code = newCode;
      element.isolateScope().transferFunctions[1].dirty = true;
      element.isolateScope().update(element.isolateScope().transferFunctions[1]);
      // The next line is ignored by jshint. The reason is that we cannot change "transfer_function" to "transferFunctions"
      // since this dictionnary key is serialized from python on the Backend and Python hint prefer this syntax...
      expect(backendInterfaceService.setTransferFunction).toHaveBeenCalledWith('tf1', newCode, jasmine.any(Function));
      backendInterfaceService.setTransferFunction.mostRecentCall.args[2]();
      expect(element.isolateScope().transferFunctions[1].dirty).toEqual(false);
    });

    it('should delete a tf properly', function() {
      element.isolateScope().delete(element.isolateScope().transferFunctions[1]);
      expect(backendInterfaceService.deleteTransferFunction).toHaveBeenCalledWith('tf1', jasmine.any(Function));
      expect(element.isolateScope().transferFunctions[1]).not.toBeDefined();
      expect(element.isolateScope().transferFunctions[0]).toBeDefined();

      element.isolateScope().transferFunctions[0].local = true;
      element.isolateScope().delete(tf2Name);
      expect(element.isolateScope().transferFunctions[0]).not.toBeDefined();
      // Since the tf is local, we should not call back the server
      expect(backendInterfaceService.deleteTransferFunction).toHaveBeenCalledWith('tf1', jasmine.any(Function));
    });
  });

  describe('Editing transferFunctions', function () {

    it('should create a tf properly', function() {
      element.isolateScope().create();
      var expected = [{id: 'transferfunction_0', code: '@nrp.Robot2Neuron()\ndef transferfunction_0(t):\n    print \"Hello world at time \" + str(t)', dirty: true, local: true, functionName: 'transferfunction_0'}];
      expect(element.isolateScope().transferFunctions).toEqual(expected);
    });

    it('should update a TF properly when editing it', function() {
      var tf1Code = '@customdecorator(toto)\ndef tf1(var1, var2):\n\t#put your code here';
      var tf1CodeNewCode = '@customdecorator(toto)\ndef tf_new_name(var1, var2):\n\t#put your code here';
      element.isolateScope().transferFunctions[0] = {code: tf1Code, dirty: false, local: false, functionName: 'tf1'};
      element.isolateScope().transferFunctions[0].code = tf1CodeNewCode;
      element.isolateScope().onTransferFunctionChange(element.isolateScope().transferFunctions[0]);
      expect(element.isolateScope().transferFunctions).toEqual([{code: tf1CodeNewCode, dirty: true, local: false, functionName: 'tf_new_name'}]);
    });

  });

  it('should provide the correct help urls', function () {
    expect(element.isolateScope().transferFunctions).toBeDefined();
    expect(nrpBackendVersionsMock).toHaveBeenCalled();
    nrpBackendVersionsGetMock.mostRecentCall.args[0]({
      hbp_nrp_cle_components: { // jshint ignore:line
        major: 1,
        minor: 2,
        patch: 3,
        dev: 'dev3'
      }
    });
    expect(element.isolateScope().cleDocumentationURL).toBe('https://developer.humanbrainproject.eu/docs/projects/hbp-nrp-cle/1.2.2');
  });

  it('should provide the correct help urls with a released version', function () {
    expect(element.isolateScope().transferFunctions).toBeDefined();
    expect(nrpBackendVersionsMock).toHaveBeenCalled();
    nrpBackendVersionsGetMock.mostRecentCall.args[0]({
      hbp_nrp_cle_components: { // jshint ignore:line
        major: 1,
        minor: 2,
        patch: 3,
      }
    });
    expect(element.isolateScope().cleDocumentationURL).toBe('https://developer.humanbrainproject.eu/docs/projects/hbp-nrp-cle/1.2.3');
  });

  it('should deal with uncorrect version for the HELP url', function () {
    expect(element.isolateScope().transferFunctions).toBeDefined();
    expect(nrpBackendVersionsMock).toHaveBeenCalled();
    nrpBackendVersionsGetMock.mostRecentCall.args[0]({
      hbp_nrp_cle_components: { // jshint ignore:line
        major: 1,
        minor: 2,
        patch: 0,
        dev: 'dev3'
      }
    });
    expect(element.isolateScope().cleDocumentationURL).toBe('https://developer.humanbrainproject.eu/docs/projects/hbp-nrp-cle/latest');
  });

});
