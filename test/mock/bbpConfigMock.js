(function() {
  'use strict';

  angular.module('bbpConfigMock', []).service('bbpConfig', function() {
    this.get = jasmine.createSpy('get');
  });
})();
