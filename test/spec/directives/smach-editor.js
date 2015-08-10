'use strict';

describe('Directive: smachEditor', function () {

  var VIEW = 'views/esv/smach-editor.html';

  var $rootScope,
    $compile,
    $httpBackend,
    $scope,
    element,
    backendInterfaceService;

  var backendInterfaceServiceMock = {
    getStateMachineScripts: jasmine.createSpy('getStateMachineScripts'),
    setStateMachineScript: jasmine.createSpy('setStateMachineScript')
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
  }));

  beforeEach(inject(function (_$rootScope_,
                              _$httpBackend_,
                              _$compile_,
                              _backendInterfaceService_,
                              $templateCache) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $httpBackend = _$httpBackend_;
    $httpBackend.whenGET(VIEW).respond('');
    $templateCache.put(VIEW, '');
    backendInterfaceService = _backendInterfaceService_;

    $scope = $rootScope.$new();
    element = $compile('<smach-editor />')($scope);
    $scope.$digest();
  }));

  it('should init the smachCodes object', function () {
    expect($scope.smachCodes).toEqual({});
    $scope.smachEditorRefresh();

    // Execute the registered callback
    var stateMachineCodesResponse = {'data': {'SM1': 'Code of SM', 'SM2': 'Code of SM2'}};
    backendInterfaceService.getStateMachineScripts.mostRecentCall.args[0](stateMachineCodesResponse);

    expect($scope.smachCodes).toEqual(stateMachineCodesResponse.data);
  });

  it('should test the update function', function() {
    $scope.smachCodes.foo = 'bar';
    $scope.update('foo');
    expect(backendInterfaceService.setStateMachineScript).toHaveBeenCalledWith('foo', 'bar');
  });

});
