(function() {
  'use strict';

  angular
    .module('experimentProxyServiceMock', [])
    .service('experimentProxyService', function() {
      this.getExperiments = jasmine
        .createSpy('getExperiments')
        .and.returnValue({
          then: jasmine.createSpy('then')
        });
    });
})();
