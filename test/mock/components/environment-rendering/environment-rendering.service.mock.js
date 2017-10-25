(function() {
  'use strict';

  angular
    .module('environmentRenderingServiceMock', [])
    .service('environmentRenderingService', function() {
      this.init = jasmine.createSpy('init');
      this.deinit = jasmine.createSpy('deinit');
      this.hasCameraView = jasmine.createSpy('hasCameraView');
      this.sceneInitialized = jasmine.createSpy('sceneInitialized');
    });
})();
