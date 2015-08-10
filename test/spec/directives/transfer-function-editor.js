'use strict';

describe('Directive: transferFunctionEditor', function () {

  var $rootScope, $compile, $httpBackend, $log, $scope, element, backendInterfaceService, nrpBackendVersions;

  var backendInterfaceServiceMock = {
    getTransferFunctions: jasmine.createSpy('getTransferFunctions'),
    setTransferFunction: jasmine.createSpy('setTransferFunction'),
    getServerBaseUrl: jasmine.createSpy('getServerBaseUrl')
  };

  var nrpBackendVersionsGetMock = jasmine.createSpy('get');
  var nrpBackendVersionsMock = jasmine.createSpy('nrpBackendVersions').andReturn({get: nrpBackendVersionsGetMock});

  beforeEach(module('exdFrontendApp'));
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('nrpBackendVersions', nrpBackendVersionsMock);
  }));
  beforeEach(inject(function (_$rootScope_,
                              _$compile_,
                              _$httpBackend_,
                              _$log_,
                              _backendInterfaceService_,
                              _nrpBackendVersions_,
                              $templateCache) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $httpBackend = _$httpBackend_;
    $log = _$log_;
    backendInterfaceService = _backendInterfaceService_;
    nrpBackendVersions = _nrpBackendVersions_;

    $scope = $rootScope.$new();
    $templateCache.put('views/esv/transfer-function-editor.html', '');
    element = $compile('<transfer-function-editor />')($scope);
    $scope.$digest();
  }));

  it('should init the transferFunctions variable', function () {
    expect($scope.transferFunctions).toBeDefined();
    expect(backendInterfaceService.getServerBaseUrl).toHaveBeenCalled();
    expect(nrpBackendVersions).toHaveBeenCalled();
    expect(backendInterfaceService.getTransferFunctions).toHaveBeenCalled();
  });

  describe('Retrieving and saving transferFunctions', function () {
    var tf1Name = 'tf1';
    var tf1Code = '@customdecorator(toto)\ndef ' + tf1Name + '(var1, var2):\n\t#put your code here';
    var tf2Name = 'tf2';
    var tf2Code = '@customdecorator(toto)\ndef ' + tf2Name + ' (varx):\n\t#put your code here';
    var tf3Code = '#I am not valid';
    var transferFunctionsReturned = [tf1Code, tf2Code, tf3Code];

    beforeEach(function(){
      backendInterfaceService.getTransferFunctions.mostRecentCall.args[0](transferFunctionsReturned);
    });

    it('should handle the retrieved transferFunctions properly', function () {
      var expected = {};
      var expectedTf1 = {code: tf1Code};
      var expectedTf2 = {code: tf2Code};
      expected[tf1Name] = expectedTf1;
      expected[tf2Name] = expectedTf2;
      expect($scope.transferFunctions).toEqual(expected);
    });

    it('should save back the tf properly', function () {
      var newCode = 'New code';
      $scope.transferFunctions[tf1Name].code = newCode;
      $scope.update(tf1Name);
      // The next line is ignored by jshint. The reason is that we cannot change "transfer_function" to "transferFunctions"
      // since this dictionnary key is serialized from python on the Backend and Python hint prefer this syntax...
      expect(backendInterfaceService.setTransferFunction).toHaveBeenCalledWith('tf1', newCode);
    });
  });

  it('should provide the correct help urls', function () {
    expect($scope.transferFunctions).toBeDefined();
    expect(nrpBackendVersionsMock).toHaveBeenCalled();
    nrpBackendVersionsGetMock.mostRecentCall.args[0]({
      hbp_nrp_cle_components: { // jshint ignore:line
        major: 1,
        minor: 2,
        patch: 3,
        dev: 'dev3'
      }
    });
    expect($scope.cleDocumentationURL).toBe('https://developer.humanbrainproject.eu/docs/projects/hbp-nrp-cle/1.2.2');
  });

});
