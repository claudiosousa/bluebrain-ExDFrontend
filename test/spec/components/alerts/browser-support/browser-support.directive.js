(function() {
  'use strict';

  describe('Directive: browser-support-alert', function() {
    beforeEach(module('browserSupport'));
    beforeEach(module('exd.templates'));

    var scope, browserSupport, $window, $timeout;

    beforeEach(
      inject(function(
        $rootScope,
        $compile,
        _browserSupport_,
        _$window_,
        _$timeout_
      ) {
        browserSupport = _browserSupport_;
        spyOn(browserSupport, 'isSupported').and.returnValue(false);
        spyOn(browserSupport, 'getBrowserVersion').and.returnValue('unknown');
        $window = _$window_;
        $timeout = _$timeout_;
        spyOn($window.sessionStorage, 'getItem').and.returnValue(null);
        spyOn($window.sessionStorage, 'setItem');

        var element = $compile(
          '<browser-support-alert></browser-support-alert>'
        )($rootScope);
        $rootScope.$digest();
        scope = element.scope();
      })
    );

    it('should call browserSupport.isSupported()', function() {
      expect(browserSupport.isSupported.calls.count()).toBe(1);
    });

    it('should append the browser version in use to the scope', function() {
      expect(browserSupport.getBrowserVersion.calls.count()).toBe(1);
      expect(scope.browser).toBe('your browser');
    });

    it('should append a formatted list of supported browsers to the scope', function() {
      expect(scope.supportedBrowsers.length).toBeGreaterThan(0);
      expect(scope.supportedBrowsers[0]).not.toBe('');
    });

    it('should call window.sessionStorage.getItem to check if the warning about unsupported browser was dismissed', function() {
      expect($window.sessionStorage.getItem).toHaveBeenCalledWith(
        'unsupportedBrowserWarning'
      );
      expect($window.sessionStorage.getItem.calls.count()).toBe(1);
      expect(scope.dismissWarning).toBe(false);
    });

    it('should call window.sessionStorage.setItem to store the information about the dismissed warning', function() {
      scope.dismissBrowserWarning();
      $timeout.flush();
      expect($window.sessionStorage.setItem).toHaveBeenCalledWith(
        'unsupportedBrowserWarning',
        'dismissed'
      );
      expect($window.sessionStorage.setItem.calls.count()).toBe(1);
      expect(scope.dismissWarning).toBe(true);
    });
  });
})();
