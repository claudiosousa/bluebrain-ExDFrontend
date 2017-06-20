'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('nrpUserMock'));

  var controller, scope, $window, $log, $controller, $rootScope;
  var browserSupport, nrpUser;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_browserSupport_, _$controller_, _$window_, _$log_, _$rootScope_, _nrpUser_) {
    browserSupport = _browserSupport_;
    spyOn(browserSupport, 'isSupported').and.returnValue(false);
    spyOn(browserSupport, 'getBrowserVersion').and.returnValue('unknown');
    $window = _$window_;
    spyOn($window.sessionStorage, 'getItem').and.returnValue(null);
    spyOn($window.sessionStorage, 'setItem');
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    spyOn(scope, '$apply');
    /* global _: false */
    spyOn(_, 'defer');
    $log = _$log_;
    $controller = _$controller_;
    controller = $controller('MainCtrl', {
      $scope: scope
    });

    nrpUser = _nrpUser_;
  }));

  it('should call nrpUser.getCurrentUserInfo() once', function () {
    expect(nrpUser.isMemberOfClusterReservationGroup.calls.count()).toBe(1);
    expect(nrpUser.getCurrentUserInfo.calls.count()).toBe(1);
    $rootScope.$digest();
  });

  it('should call browserSupport.isSupported()', function () {
    expect(browserSupport.isSupported.calls.count()).toBe(1);
  });

  it('should append the browser version in use to the scope', function () {
    expect(browserSupport.getBrowserVersion.calls.count()).toBe(1);
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
    expect($window.sessionStorage.getItem.calls.count()).toBe(2);
    expect(scope.dismissWarning).toBe(false);
    expect(scope.dismissReservationForm).toBe(false);
  });

  it('should call window.sessionStorage.setItem to store the information about the dismissed warning', function () {
    scope.dismissBrowserWarning();
    _.defer.calls.argsFor(_.defer.calls.count()-1)[0]();
    scope.$apply.calls.argsFor(scope.$apply.calls.count()-1)[0]();
    expect($window.sessionStorage.setItem).toHaveBeenCalledWith('unsupportedBrowserWarning', 'dismissed');
    expect($window.sessionStorage.setItem.calls.count()).toBe(1);
    expect(scope.dismissWarning).toBe(true);
  });

  it('should call window.sessionStorage.setItem to store the information about the dismissed reservation form', function () {
    scope.dismissClusterReservationForm();
    _.defer.calls.mostRecent().args[0]();
    scope.$apply.calls.mostRecent().args[0]();
    expect($window.sessionStorage.setItem).toHaveBeenCalledWith('reservationForm', 'dismissed');
    expect($window.sessionStorage.setItem.calls.count()).toBe(1);
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

