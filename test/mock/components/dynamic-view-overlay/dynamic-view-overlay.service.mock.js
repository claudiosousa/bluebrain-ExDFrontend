(function () {
  'use strict';

  angular.module('dynamicViewOverlayServiceMock', [])
  .service('dynamicViewOverlayService', function () {

    this.createOverlay = jasmine.createSpy('createOverlay');
    this.removeOverlay = jasmine.createSpy('removeOverlay');
    this.getController = jasmine.createSpy('getController').and.returnValue({
      then: jasmine.createSpy('then')
    });
    this.isOverlayOpen = jasmine.createSpy('isOverlayOpen').and.returnValue({
      then: jasmine.createSpy('then')
    });
    this.getParentOverlayWrapper = jasmine.createSpy('getParentOverlayWrapper');
    this.getOverlayParentElement = jasmine.createSpy('getOverlayParentElement');
    this.closeAllOverlaysOfType = jasmine.createSpy('closeAllOverlaysOfType');
    this.createDynamicOverlay = jasmine.createSpy('createDynamicOverlay').and.returnValue({
      then: jasmine.createSpy('then').and.callFake(function(fn) {fn();})
    });
  })

  .constant('DYNAMIC_VIEW_CHANNELS', {
    BRAIN_VISUALIZER: 'brainvisualizer-panel',
    DYNAMIC_VIEW: 'dynamic-view',
    ENVIRONMENT_RENDERING: 'environment-rendering',
    JOINT_PLOT: 'joint-plot',
    SPIKE_TRAIN: 'spike-train',
    VIDEO_STREAM: 'video-streams',
    LOG_CONSOLE: 'log-console'
  });

}());
