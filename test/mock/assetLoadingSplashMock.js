(function() {
  'use strict';

  angular
    .module('assetLoadingSplashMock', [])
    .service('assetLoadingSplash', function() {
      var assetLoadingSplashInstance = {
        close: jasmine.createSpy('close')
      };
      this.open = jasmine
        .createSpy('open')
        .and.returnValue(assetLoadingSplashInstance);
      this.close = jasmine.createSpy('close');

      this.setProgress = jasmine.createSpy('setProgress');
    });
})();
