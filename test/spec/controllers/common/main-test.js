'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var controller, scope, $window;
  var browserSupport;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_browserSupport_, $controller, $rootScope, _$window_) {
    browserSupport = _browserSupport_;
    spyOn(browserSupport, 'isSupported').andReturn(false);
    spyOn(browserSupport, 'getBrowserVersion').andReturn('unknown');
    $window = _$window_;
    spyOn($window.sessionStorage,'getItem').andReturn(null);
    spyOn($window.sessionStorage,'setItem');
    scope = $rootScope.$new();
    spyOn(scope, '$apply');
    /* global _: false */
    spyOn(_, 'defer');
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

  it('should call window.sessionStorage.getItem to check if the warning about unsupported browser was dismissed', function () {
    expect($window.sessionStorage.getItem).toHaveBeenCalledWith('unsupportedBrowserWarning');
    expect($window.sessionStorage.getItem.callCount).toBe(1);
    expect(scope.dismissWarning).toBe(false);
  });

   it('should call window.sessionStorage.setItem to store the information about the dismissed warning', function () {
    scope.dismissBrowserWarning();
    _.defer.mostRecentCall.args[0]();
    scope.$apply.mostRecentCall.args[0]();
    expect($window.sessionStorage.setItem).toHaveBeenCalledWith('unsupportedBrowserWarning', 'dismissed');
    expect($window.sessionStorage.setItem.callCount).toBe(1);
    expect(scope.dismissWarning).toBe(true);
  });

});
