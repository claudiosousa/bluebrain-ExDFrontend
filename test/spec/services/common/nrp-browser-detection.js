'use strict';
describe('Services: nrp-browser-detection', function () {
  var browserSupport, $window;
  var windowMock = { navigator: { userAgent: ' ' } };
  beforeEach(module('nrpBrowserDetection', function ($provide) {
    $provide.value('$window', windowMock);
  }));
  
  var supportedBrowserVersions = {
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36' : 
        { browserName: 'Chrome', version: '41'},
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:36.0) Gecko/20100101 Firefox/36.0' :
        { browserName: 'Firefox', version: '36'},
      'Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en) AppleWebKit/124 (KHTML, like Gecko) Safari/125' :
        { browserName: 'Safari', version: '125'},
      'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_5; fr-fr) AppleWebKit/525.18 (KHTML, like Gecko) Version/3.1.2 Safari/525.20.1' :
        { browserName: 'Safari', version: '3'}
  };
  var unsupportedBrowserVersions = {
      'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.9.8 Safari/534.34' :
        { browserName: 'PhantomJS', version: '1'},
      '12.04 - Opera/9.80 (X11; Linux x86_64; U; Ubuntu; fr) Presto/2.10.289 Version/12.01':
        { browserName: 'Opera', version: '12'},
      'Opera/9.80 (X11; Linux x86_64; U; fr) Presto/2.2.15 Version/10.00':
        { browserName: 'Opera', version: '10'},
      'Opera/9.80 (X11; Linux x86_64; U; Ubuntu; fr) Presto/2.10.289 Version/12.01':
        { browserName: 'Opera', version: '12'},
      'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)':
        { browserName: 'MSIE', version: '9'},
      'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko':
        { browserName: 'IE', version: '11'},
      'Nokia6681/2.0 (5.37.01) SymbianOS/8.0 Series60/2.6 Profile/MIDP-2.0 Configuration/CLDC-1.1' : // unrecognised browser
        { browserName: 'unknown', version: 'unknown' },
  };
  var testSet = angular.extend({}, unsupportedBrowserVersions, supportedBrowserVersions);

  beforeEach(inject(function(_$window_, _browserSupport_){
    browserSupport = _browserSupport_;
    $window = _$window_;
  }));

  describe('Function: getBrowserVersion', function() {
    angular.forEach(testSet, function(value, key) {
      var expectedVersion; 
      if (value.browserName !== 'unknown' ) {
        expectedVersion = value.browserName + ' ' + value.version;
      } else {
        expectedVersion = 'unknown';
      }
      it('should return ' + expectedVersion, function() {
        $window.navigator.userAgent = key;
        expect(browserSupport.getBrowserVersion()).toBe(expectedVersion);
      });
    });
  });
  
  describe('Function: isSupportedBrowser', function() {
    angular.forEach(supportedBrowserVersions, function(value, key) {
      var browserVersion = value.browserName + ' ' + value.version;
      it('should return true for ' + browserVersion, function() {
        $window.navigator.userAgent = key;
        expect(browserSupport.isSupported()).toBe(true);
      });
    });
    
    angular.forEach(unsupportedBrowserVersions, function(value, key) {
      var browserVersion = value.browserName + ' ' + value.version;
      it('should return false for ' + browserVersion, function() {
        $window.navigator.userAgent = key;
        expect(browserSupport.isSupported()).toBe(false);
      });
    });
  });

  describe('Member variables', function() {
    it('should set the SUPPORTED_BROWSERS variable with a non empty array', function() {
      expect(browserSupport.SUPPORTED_BROWSERS).toEqual(jasmine.any(Array));
      expect(browserSupport.SUPPORTED_BROWSERS.length).toBeGreaterThan(0);
    });
  });

});



