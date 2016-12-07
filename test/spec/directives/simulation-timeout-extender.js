'use strict';

describe('Directive: simulation-timeout-extender', function () {

  beforeEach(module('exdFrontendApp'));
  var $rootScope, $q,
    hbpDialogFactoryConfirmResponse;

  var backendInterfaceService = { extendTimeout: jasmine.createSpy('extendTimeout').andCallFake(function () { return $q.when(); }) };
  var hbpDialogFactory = { confirm: jasmine.createSpy('confirm').andCallFake(function () { return hbpDialogFactoryConfirmResponse; }) };

  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceService);
    $provide.value('hbpDialogFactory', hbpDialogFactory);

    backendInterfaceService.extendTimeout.reset();
    hbpDialogFactory.confirm.reset();
  }));

  beforeEach(inject(function (_$rootScope_, $httpBackend, $compile, _$q_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    $rootScope.simTimeoutText = 300;
    hbpDialogFactoryConfirmResponse = $q.when(true);
    $httpBackend.whenGET(new RegExp('.*')).respond(200);
    $compile('<simulation-timeout-extender extent-timeout-condition="{{simTimeoutText < 300}}"></simulation-timeout-extender>')($rootScope);
  }));

  it('should not trigger user prompt if timeout condition has not been met', function () {
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).not.toHaveBeenCalled();
  });

  it('should trigger user prompt if timeout condition has been met', function () {
    $rootScope.simTimeoutText = 299;
    hbpDialogFactoryConfirmResponse = $q.when();//positive response
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
  });

  it('should call backendInterfaceService.extend when user requests timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    hbpDialogFactoryConfirmResponse = $q.when();//positive response
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).toHaveBeenCalled();
  });

  it('should NOT call backendInterfaceService.extend when user refuses timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    hbpDialogFactoryConfirmResponse = $q.reject();//negative response
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();

    expect(backendInterfaceService.extendTimeout).not.toHaveBeenCalled();
  });

  it('should NOT reprompt the user if we previously refused timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    hbpDialogFactoryConfirmResponse = $q.reject();//negative response
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).not.toHaveBeenCalled();
    hbpDialogFactory.confirm.reset();
    $rootScope.simTimeoutText = 300;
    $rootScope.$digest();
    $rootScope.simTimeoutText = 299;
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).not.toHaveBeenCalled();
  });

});