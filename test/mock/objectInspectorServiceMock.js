(function() {
  'use strict';

  angular
    .module('objectInspectorServiceMock', [])
    .service('objectInspectorService', function() {
      this.toggleView = jasmine.createSpy('toggleView');
      this.update = jasmine.createSpy('update');
      this.removeEventListeners = jasmine.createSpy('removeEventListeners');
    });
})();
