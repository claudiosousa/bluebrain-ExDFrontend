(function () {
  'use strict';

  angular.module('hbpIdentityUserDirectoryMock', [])
  .service('hbpIdentityUserDirectory', function () {
    this.getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue({
      then: jasmine.createSpy('then')
    });
    this.get = jasmine.createSpy('get').and.returnValue({
      then: jasmine.createSpy('then')
    });
  });
}());
