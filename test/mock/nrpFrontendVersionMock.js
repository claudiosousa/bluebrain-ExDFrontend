(function () {
  'use strict';

  angular.module('nrpFrontendVersionMock', [])
  .service('nrpFrontendVersion', function () {

    this.get = jasmine.createSpy('get');
  });
}());
