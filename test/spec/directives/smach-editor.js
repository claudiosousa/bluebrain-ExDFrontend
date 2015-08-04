'use strict';

describe('Directive: smachEditor', function () {

  beforeEach(module('exdFrontendApp'));

  var $rootScope, $compile, $httpBackend, $log, $scope, element;
  var SERVER_URL = 'http://bbpce014.epfl.ch:8080';
  var SIMULATION_ID = 1;
  var stateMachineCodesResponse = { 'data' : { 'SM1' : 'Code of SM' , 'SM2' : 'Code of SM2' }};

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
    $templateCache.put('views/esv/smach-editor.html', '<h3>Test</h3>');
    $httpBackend.whenGET('views/esv/smach-editor.html').respond('<h3>Test</h3>');
    $httpBackend.whenGET(/^http:\/\/bbpce014\.epfl\.ch:8080\/simulation\/\d\/state-machines$/).respond(stateMachineCodesResponse);
    $httpBackend.whenGET('views/common/home.html').respond({}); // Templates are requested via HTTP and processed locally.
    spyOn($log, 'error');

    element = $compile('<smach-editor server="' + SERVER_URL + '" simulation="' + SIMULATION_ID + '"></smach-editor>')($scope);
    $scope.$digest();
  }));

  it('should output an error if no serverUrl or simulationID was provided', function () {
    expect($log.error.callCount).toEqual(0);
    element = $compile('<smach-editor server="" simulation=""></smach-editor>')($scope);
    $scope.$digest();
    expect($log.error.callCount).toEqual(2);
  });

  it('should not output an error', function () {
    expect($log.error.callCount).toEqual(0);
  });

  it('replaces the element with the appropriate content', function () {
    // Compile a piece of HTML containing the directive
    expect(element.prop('outerHTML')).toContain('<smach-editor server="' + SERVER_URL + '" simulation="' + SIMULATION_ID + '" class="ng-scope"><h3>Test</h3></smach-editor>');
  });

  it('should init the smachCodes object', function () {
    expect($scope.smachCodes).toEqual({});
    $scope.smachEditorRefresh();
    $httpBackend.flush();
    expect($scope.smachCodes).toEqual(stateMachineCodesResponse.data);
  });
});
