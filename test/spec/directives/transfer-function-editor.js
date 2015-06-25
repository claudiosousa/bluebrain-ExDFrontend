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

  it('should init the transferFunctions variable', function () {
    expect($scope.transferFunctions).toBeDefined();
  });
});
