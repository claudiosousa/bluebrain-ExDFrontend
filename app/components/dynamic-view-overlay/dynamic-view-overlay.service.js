(function() {
  'use strict';

  /**
   * @ngdoc service
   * @namespace exdFrontendApp.services
   * @module jointPlotModule
   * @name jointPlotModule.jointService
   * @description Service that subscribes to the joint ros-topic
   */
  class DynamicViewOverlayService {

    static get OVERLAY_HTML() { return '<dynamic-view-overlay></dynamic-view-overlay>'; }
    get OVERLAY_PARENT_SELECTOR() { return '.experiment-view-widget-overlays'; }

    constructor($compile,
                $rootScope,
                $timeout,
                nrpAnalytics) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$timeout = $timeout;
      this.nrpAnalytics = nrpAnalytics;

      this.overlays = {};
      this.overlayIDCount = 0;
    }

    createOverlay(parentElement, componentName) {
      if (!angular.isDefined(parentElement)) {
        parentElement = document.body;
      }

      // create overlay
      let scope = this.$rootScope.$new();
      let overlay = this.$compile(DynamicViewOverlayService.OVERLAY_HTML)(scope);
      // each overlay gets a unique ID
      let htmlID = 'dynamic-view-overlay-' + this.overlayIDCount;
      overlay[0].id = htmlID;
      this.overlays[htmlID] = overlay;
      this.overlayIDCount = this.overlayIDCount + 1;

      parentElement.appendChild(overlay[0]);

      let waitForController = () => {
        let controller = overlay.controller('dynamicViewOverlay');
        if (angular.isDefined(controller)) {
          // once we have a controller, set the component
          controller.setDynamicViewComponent(componentName);
        } else {
          // check again in 100ms
          this.$timeout(waitForController, 100);
        }
      };
      waitForController();

      this.nrpAnalytics.eventTrack('Toggle-'+componentName, {
        category: 'Simulation-GUI',
        value: true,
      });

      scope.$on('$destroy', () => {
        this.nrpAnalytics.eventTrack('Toggle-'+componentName, {
          category: 'Simulation-GUI',
          value: false,
        });
      });

      return overlay;
    }

    removeOverlay(id) {
      document.getElementById(id).remove();
      delete this.overlays[id];
    }

    getOverlayParentElement() {
      return angular.element(this.OVERLAY_PARENT_SELECTOR);
    }
  }

  angular.module('dynamicViewOverlayModule')
    .factory('dynamicViewOverlayService', [
      '$compile',
      '$rootScope',
      '$timeout',
      'nrpAnalytics',
      (...args) => new DynamicViewOverlayService(...args)
    ]);

}());
