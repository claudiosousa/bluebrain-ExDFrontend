'use strict';

describe('Directive: transferFunctionEditor', function () {

  beforeEach(module('exdFrontendApp'));

  var $rootScope, $compile, $httpBackend, $log, $scope, element;

  var SERVER_URL = 'http://bbpce014.epfl.ch:8080';
  var SIMULATION_ID = 1;

  beforeEach(inject(function (_$rootScope_,
                              _$compile_,
                              _$httpBackend_,
                              _$log_,
                              $templateCache) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $httpBackend = _$httpBackend_;
    $log = _$log_;

    $scope = $rootScope.$new();
    $templateCache.put('views/esv/transfer-function-editor.html', '<h3>Test</h3>');
    $httpBackend.expectGET('views/esv/transfer-function-editor.html');
    spyOn($log, 'error');

    var transferFunctionsReturned = {'transfer_functions': ['some code', 'more code']};
    $httpBackend.whenGET(SERVER_URL + '/simulation/1/transfer-functions').respond(transferFunctionsReturned);

    element = $compile('<transfer-function-editor server="' + SERVER_URL + '" simulation="' + SIMULATION_ID + '"></transfer-function-editor>')($scope);
    $scope.$digest();
  }));

  it('should output an error if no serverUrl or simulationID was provided', function () {
    expect($log.error.callCount).toEqual(0);
    element = $compile('<transfer-function-editor server="" simulation=""></transfer-function-editor>')($scope);
    $scope.$digest();
    expect($log.error.callCount).toEqual(2);
  });

  it('should not output an error', function () {
    expect($log.error.callCount).toEqual(0);
  });

  it('replaces the element with the appropriate content', function () {
    // Compile a piece of HTML containing the directive
    expect(element.prop('outerHTML')).toContain('<transfer-function-editor server="' + SERVER_URL + '" simulation="' + SIMULATION_ID + '" class="ng-scope"><h3>Test</h3></transfer-function-editor>');
  });

});

describe('Directive: transferFunctionEditor', function () {

  beforeEach(module('exdFrontendApp'));

  var $rootScope, $compile, $httpBackend, $log, $scope, element, simulationTransferFunctions;

  var transferFunctionsMock = jasmine.createSpy('transferFunctions');
  var patchMock = jasmine.createSpy('patch');
  var simulationTransferFunctionsMock = jasmine.createSpy('simulationTransferFunctions').andReturn({transferFunctions: transferFunctionsMock, patch: patchMock});
  var tf1Name = 'tf1';
  var tf1Code = '@customdecorator(toto)\ndef ' + tf1Name + '(var1, var2):\n\t#put your code here';
  var tf2Name = 'tf2';
  var tf2Code = '@customdecorator(toto)\ndef ' + tf2Name + ' (varx):\n\t#put your code here';
  var tf3Code = '#I am not valid';
  var transferFunctionsReturned = [tf1Code, tf2Code, tf3Code];

  var SERVER_URL = 'https://neurorobotics-dev.humanbrainproject.eu/cle/1/api';
  var SIMULATION_ID = 1;

  beforeEach(module(function ($provide) {
    $provide.value('simulationTransferFunctions', simulationTransferFunctionsMock);
  }));
  beforeEach(inject(function (_$rootScope_,
                              _$compile_,
                              _$httpBackend_,
                              _$log_,
                              _simulationTransferFunctions_,
                              $templateCache) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $httpBackend = _$httpBackend_;
    $log = _$log_;
    simulationTransferFunctions = _simulationTransferFunctions_;

    $scope = $rootScope.$new();
    $templateCache.put('views/esv/transfer-function-editor.html', '<h3>Test</h3>');

    element = $compile('<transfer-function-editor server="' + SERVER_URL + '" simulation="' + SIMULATION_ID + '"></transfer-function-editor>')($scope);
    $scope.$digest();
  }));

  it('should init the transferFunctions variable', function () {
    expect($scope.transferFunctions).toBeDefined();
    expect(simulationTransferFunctionsMock).toHaveBeenCalled();
    transferFunctionsMock.mostRecentCall.args[1](transferFunctionsReturned);
    var expected = {};
    var expectedTf1 = {code: tf1Code};
    var expectedTf2 = {code: tf2Code};
    expected[tf1Name] = expectedTf1;
    expected[tf2Name] = expectedTf2;
    expect($scope.transferFunctions).toEqual(expected);
  });

  it('should save back the tf properly', function () {
    expect($scope.transferFunctions).toBeDefined();
    expect(simulationTransferFunctionsMock).toHaveBeenCalled();
    transferFunctionsMock.mostRecentCall.args[1](transferFunctionsReturned);
    var newCode = 'New code';
    $scope.transferFunctions[tf1Name].code = newCode;
    $scope.update(tf1Name);
    // The next line is ignored by jshint. The reason is that we cannot change "transfer_function" to "transferFunctions"
    // since this dictionnary key is serialized from python on the Backend and Python hint prefer this syntax...
    expect(patchMock).toHaveBeenCalledWith({ sim_id : '1', transfer_function_name : 'tf1' }, newCode); // jshint ignore:line
  });


});
