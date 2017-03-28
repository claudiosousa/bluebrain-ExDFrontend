'use strict';

describe('Directive: simulation-timeout-extender', function () {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  
  var $rootScope, $q, $compile,
    hbpDialogFactoryConfirmResponse, backendInterfaceServiceExtendResponse;

  var backendInterfaceService = { extendTimeout: jasmine.createSpy('extendTimeout').and.callFake(function () { return backendInterfaceServiceExtendResponse; }) };

  var hbpDialogFactory = {
    confirm: jasmine.createSpy('confirm').and.callFake(function () { return hbpDialogFactoryConfirmResponse; }),
    alert: jasmine.createSpy('extendTimeout')
  };

  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceService);
    $provide.value('hbpDialogFactory', hbpDialogFactory);

    backendInterfaceService.extendTimeout.calls.reset();
    hbpDialogFactory.confirm.calls.reset();
  }));

  beforeEach(inject(function (_$rootScope_, $httpBackend, _$compile_, _$q_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;
    $rootScope.simTimeoutText = 300;
    hbpDialogFactoryConfirmResponse = $q.when();
    backendInterfaceServiceExtendResponse = $q.when();
    $compile('<simulation-timeout-extender extent-timeout-condition="{{simTimeoutText < 300}}"></simulation-timeout-extender>')($rootScope);
  }));

  it('should an exception if extend-timeout-condition undefined', function () {
    expect(function () { $compile('<simulation-timeout-extender></simulation-timeout-extender>')($rootScope); })
      .toThrow();
  });

  it('should not trigger user prompt if timeout condition has not been met', function () {
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).not.toHaveBeenCalled();
  });

  it('should trigger user prompt if timeout condition has been met', function () {
    $rootScope.simTimeoutText = 299;
    // hbpDialogFactoryConfirmResponse = $q.when();//positive response
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
  });

  it('should call backendInterfaceService.extend when user requests timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    //  hbpDialogFactoryConfirmResponse = $q.when();//positive response
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).toHaveBeenCalled();
  });

  it('should show alert if failed to extend timeout', function () {
    $rootScope.simTimeoutText = 299;
    //hbpDialogFactoryConfirmResponse = $q.when();//positive response
    backendInterfaceServiceExtendResponse = $q.reject({ status: 402 });
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).toHaveBeenCalled();
    expect(hbpDialogFactory.alert).toHaveBeenCalled();
  });

  it('should NOT call backendInterfaceService.extend when user refuses timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    hbpDialogFactoryConfirmResponse = $q.reject();//negative response
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    expect(hbpDialogFactory.alert).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).not.toHaveBeenCalled();
  });

  it('should NOT reprompt the user if we previously refused timeout extension', function () {
    $rootScope.simTimeoutText = 299;
    hbpDialogFactoryConfirmResponse = $q.reject();//negative response
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    expect(backendInterfaceService.extendTimeout).not.toHaveBeenCalled();
    hbpDialogFactory.confirm.calls.reset();
    $rootScope.simTimeoutText = 300;
    $rootScope.$digest();
    $rootScope.simTimeoutText = 299;
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).not.toHaveBeenCalled();
  });

});