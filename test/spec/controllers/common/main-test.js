'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var controller, scope, $window, $log, $controller;
  var browserSupport;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_browserSupport_, _$controller_, $rootScope, _$window_, _$log_) {
    browserSupport = _browserSupport_;
    spyOn(browserSupport, 'isSupported').andReturn(false);
    spyOn(browserSupport, 'getBrowserVersion').andReturn('unknown');
    $window = _$window_;
    spyOn($window.sessionStorage, 'getItem').andReturn(null);
    spyOn($window.sessionStorage, 'setItem');
    scope = $rootScope.$new();
    spyOn(scope, '$apply');
    /* global _: false */
    spyOn(_, 'defer');
    $log = _$log_;
    $controller = _$controller_;
    controller = $controller('MainCtrl', {
      $scope: scope
    });
  }));

  it('should call browserSupport.isSupported()', function () {
    expect(browserSupport.isSupported.callCount).toBe(1);
  });

  it('should append the browser version in use to the scope', function () {
    expect(browserSupport.getBrowserVersion.callCount).toBe(1);
    expect(scope.browser).toBe('your browser');
  });

  it('should append a formatted list of supported browsers to the scope', function () {
    expect(scope.supportedBrowsers).toEqual(jasmine.any(Array));
    expect(scope.supportedBrowsers.length).toBeGreaterThan(0);
    expect(scope.supportedBrowsers[0]).not.toBe('');
  });

  it('should call window.sessionStorage.getItem to check if the warning about unsupported browser and the reservation form were dismissed', function () {
    expect($window.sessionStorage.getItem).toHaveBeenCalledWith('unsupportedBrowserWarning');
    expect($window.sessionStorage.getItem).toHaveBeenCalledWith('reservationForm');
    expect($window.sessionStorage.getItem.callCount).toBe(2);
    expect(scope.dismissWarning).toBe(false);
    expect(scope.dismissReservationForm).toBe(false);
  });

  it('should call window.sessionStorage.setItem to store the information about the dismissed warning', function () {
    scope.dismissBrowserWarning();
    _.defer.mostRecentCall.args[0]();
    scope.$apply.mostRecentCall.args[0]();
    expect($window.sessionStorage.setItem).toHaveBeenCalledWith('unsupportedBrowserWarning', 'dismissed');
    expect($window.sessionStorage.setItem.callCount).toBe(1);
    expect(scope.dismissWarning).toBe(true);
  });

  it('should call window.sessionStorage.setItem to store the information about the dismissed reservation form', function () {
    scope.dismissClusterReservationForm();
    _.defer.mostRecentCall.args[0]();
    scope.$apply.mostRecentCall.args[0]();
    expect($window.sessionStorage.setItem).toHaveBeenCalledWith('reservationForm', 'dismissed');
    expect($window.sessionStorage.setItem.callCount).toBe(1);
    expect(scope.dismissReservationForm).toBe(true);
  });

  it('should call window.sessionStorage.setItem to store the reservation name', function () {
    scope.clusterReservationName = 'sp10-user-workshop';
    scope.setClusterReservation();
    expect($window.sessionStorage.setItem).toHaveBeenCalledWith('clusterReservation', scope.clusterReservationName);
  });

  it('should retrieve collabItemurl ', function () {
    var testUrl = scope.getCollabItemUrl('test');
    expect(testUrl).toBe('http://localhost/testUrl');
  });

  it('should not fail if "collab" config is missing', function () {
    delete window.bbpConfig.collab;
    spyOn($log, 'error');
    $controller('MainCtrl', {
      $scope: scope
    });
    expect($log.error).toHaveBeenCalled();
  });

});

