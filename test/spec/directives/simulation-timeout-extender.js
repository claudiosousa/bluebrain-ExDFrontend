'use strict';

describe('Directive: simulation-timeout-extender', function () {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  
  var $rootScope, $q, $compile,
    clbConfirmResponse, backendInterfaceServiceExtendResponse;

  var backendInterfaceService = { extendTimeout: jasmine.createSpy('extendTimeout').and.callFake(function () { return backendInterfaceServiceExtendResponse; }) };

  var clbConfirm = {
    open: jasmine.createSpy('open').and.callFake(function () { return clbConfirmResponse; })
  };
  var clbErrorDialog = {
    open: jasmine.createSpy('extendTimeout')
  };
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceService);
    $provide.value('clbConfirm', clbConfirm);
    $provide.value('clbErrorDialog', clbErrorDialog);

    backendInterfaceService.extendTimeout.calls.reset();
    clbConfirm.open.calls.reset();
    clbErrorDialog.open.calls.reset();
  }));

  beforeEach(inject(function (_$rootScope_, $httpBackend, _$compile_, _$q_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;
    $rootScope.simTimeoutText = 300;
    clbConfirmResponse = $q.when();
    backendInterfaceServiceExtendResponse = $q.when();
    $compile('<simulation-timeout-extender extent-timeout-condition="{{simTimeoutText < 300}}"></simulation-timeout-extender>')($rootScope);
  }));

  it('should an exception if extend-timeout-condition undefined', function () {
    expect(function () { $compile('<simulation-timeout-extender></simulation-timeout-extender>')($rootScope); })
      .toThrow();
  });

  it('should not trigger user prompt if timeout condition has not been met', function () {
    $rootScope.$digest();
    expect(clbConfirm.open).not.toHaveBeenCalled();
  });

  it('should trigger user prompt if timeout condition has been met', function () {
    $rootScope.simTimeoutText = 299;
    // clbConfirmResponse = $q.when();//positive response
    $rootScope.$digest();
    expect(clbConfirm.open).toHaveBeenCalled();
  });

  it('should call backendInterfaceService.extend when user requests timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    //  clbConfirmResponse = $q.when();//positive response
    $rootScope.$digest();
    expect(clbConfirm.open).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).toHaveBeenCalled();
  });

  it('should show alert if failed to extend timeout', function () {
    $rootScope.simTimeoutText = 299;
    //clbConfirmResponse = $q.when();//positive response
    backendInterfaceServiceExtendResponse = $q.reject({ status: 402 });
    $rootScope.$digest();
    expect(clbConfirm.open).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).toHaveBeenCalled();
    expect(clbErrorDialog.open).toHaveBeenCalled();
  });

  it('should NOT call backendInterfaceService.extend when user refuses timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    clbConfirmResponse = $q.reject();//negative response
    $rootScope.$digest();
    expect(clbConfirm.open).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).not.toHaveBeenCalled();
  });

  it('should NOT reprompt the user if we previously refused timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    clbConfirmResponse = $q.reject();//negative response
    $rootScope.$digest();
    expect(clbConfirm.open).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).not.toHaveBeenCalled();
    clbConfirm.open.calls.reset();
    $rootScope.simTimeoutText = 300;
    $rootScope.$digest();
    $rootScope.simTimeoutText = 299;
    $rootScope.$digest();
    expect(clbConfirm.open).not.toHaveBeenCalled();
  });

});