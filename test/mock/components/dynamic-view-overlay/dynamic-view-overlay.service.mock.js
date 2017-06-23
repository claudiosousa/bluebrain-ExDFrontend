(function () {
  'use strict';

  angular.module('dynamicViewOverlayServiceMock', [])
  .service('dynamicViewOverlayService', function () {

    this.createOverlay = jasmine.createSpy('createOverlay');
    this.removeOverlay = jasmine.createSpy('removeOverlay');
    this.getController = jasmine.createSpy('getController').and.returnValue({
      then: jasmine.createSpy('then')
    });
  });
}());
