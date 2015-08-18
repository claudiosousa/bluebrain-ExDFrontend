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
    $scope.control = {};
    element = $compile('<smach-editor control="control"/>')($scope);
    $scope.$digest();


  }));

  it('should init the smachCodes object', function () {
    expect(element.isolateScope().smachCodes).toEqual({});
    $scope.control.refresh();

    // Execute the registered callback
    var stateMachineCodesResponse = {'data': {'SM1': 'Code of SM', 'SM2': 'Code of SM2'}};
    backendInterfaceService.getStateMachineScripts.mostRecentCall.args[0](stateMachineCodesResponse);

    expect(element.isolateScope().smachCodes).toEqual(stateMachineCodesResponse.data);
  });

  it('should test the update function', function() {
    element.isolateScope().smachCodes.foo = 'bar';
    element.isolateScope().update('foo');
    expect(backendInterfaceService.setStateMachineScript).toHaveBeenCalledWith('foo', 'bar');
  });

});
