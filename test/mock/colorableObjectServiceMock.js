(function () {
  'use strict';

  angular.module('colorableObjectServiceMock', [])
  .service('colorableObjectService', function () {
    this.setEntityMaterial = jasmine.createSpy('setEntityMaterial');
  });
}());
