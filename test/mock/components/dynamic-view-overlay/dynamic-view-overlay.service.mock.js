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
    BRAIN_VISUALIZER: {
      name: 'Brain Visualizer',
      directive: 'brainvisualizer-panel',
      overlayDefaultSize: {
        width: 500,
        height: 500
      },
      isResizeable: true,
    },
    ENVIRONMENT_RENDERING: {
      name: 'Environment Rendering',
      directive: 'environment-rendering',
      overlayDefaultSize: {
        width: 500,
        height: 500
      }
    },
    JOINT_PLOT: {
      name: 'Joint Plot',
      directive: 'joint-plot',
      overlayDefaultSize: {
        width: 800,
        height: 500
      }
    },
    LOG_CONSOLE: {
      name: 'Log Console',
      directive: 'log-console',
      overlayDefaultSize: {
        width: 500,
        height: 250
      }
    },
    OBJECT_INSPECTOR: {
      name: 'Object Inspector',
      directive: 'object-inspector',
      isResizeable: false, // default true
      allowMultipleViews: false, // default true
    },
  });

}());
