(function () {
  'use strict';

  angular.module('nrpBackendVersionsMock', [])
  .factory('nrpBackendVersions', function () {
    return jasmine.createSpy('nrpBackendVersions').and.returnValue({
      get: jasmine.createSpy('get')
    });
  });
}());
