(function () {
  'use strict';

  angular.module('splashMock', [])
  .service('splash', function () {
    var splashInstance = {
      close: jasmine.createSpy('modalInstance.close'),
      result: {
        then: jasmine.createSpy('modalInstance.result.then')
      }
    };

    this.close = jasmine.createSpy('close');
    this.closeSplash = jasmine.createSpy('closeSplash');
    this.open = jasmine.createSpy('open').and.returnValue(splashInstance);
    this.setMessage = jasmine.createSpy('setMessage');
  });
}());
