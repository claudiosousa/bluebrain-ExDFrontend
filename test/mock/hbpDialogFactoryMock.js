(function () {
  'use strict';

  angular.module('hbpDialogFactoryMock', [])
  .service('hbpDialogFactory', function () {
    this.confirm = jasmine.createSpy('confirm').and.returnValue({
      then: jasmine.createSpy('then')
    });
    this.alert = jasmine.createSpy('alert');

  });
}());
