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
    get OVERLAY_PARENT_SELECTOR() { return '.editor-display'; }
    get OVERLAY_WRAPPER_CLASS_SELECTOR() { return '.dynamic-view-overlay-wrapper'; }

    constructor($compile,
                $q,
                $rootScope,
                $timeout,
                nrpAnalytics) {
      this.$compile = $compile;
      this.$q = $q;
      this.$rootScope = $rootScope;
      this.$timeout = $timeout;
      this.nrpAnalytics = nrpAnalytics;

      this.overlays = {};
      this.overlayIDCount = 0;
    }

    createOverlay(parentElement, dynamicViewChannel) {
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

      this.getController(overlay, 'dynamicViewOverlay').then(
        (controller) => controller.setDynamicViewChannel(dynamicViewChannel)
      );

      this.nrpAnalytics.eventTrack('Toggle-'+dynamicViewChannel, {
        category: 'Simulation-GUI',
        value: true,
      });

      scope.$on('$destroy', () => {
        this.nrpAnalytics.eventTrack('Toggle-'+dynamicViewChannel, {
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

    getParentOverlayWrapper(element) {
      return element.parents(this.OVERLAY_WRAPPER_CLASS_SELECTOR)[0];
    }

    getController(element, controllerType) {
      let deferredController = this.$q.defer();
      let waitForController = () => {
        let controller = element.controller(controllerType);
        if (angular.isDefined(controller)) {
          // once we have a controller, resolve
          deferredController.resolve(controller);
        } else {
          // check again in 100ms
          this.$timeout(waitForController, 100);
        }
      };
      waitForController();

      return deferredController.promise;
    }

    isOverlayOpen(type)
    {
      let arrayIndex = 0;
      let deferredIsOpen = this.$q.defer();
      const array = Object.values(this.overlays);

      if(array.length === 0) {
        deferredIsOpen.resolve(false);
      }
      else {
        array.forEach((overlay) => {
          this.getController(overlay, 'dynamicViewOverlay').then(
              (controller) => {
                if (controller.channelType && controller.channelType === type) {
                  deferredIsOpen.resolve(true);
                }
                else if (arrayIndex === array.length - 1) {
                  deferredIsOpen.resolve(false);
                }
                arrayIndex++;
              });
        });
      }
      return deferredIsOpen.promise;
    }
  }


  angular.module('dynamicViewOverlayModule')
    .factory('dynamicViewOverlayService', [
      '$compile',
      '$q',
      '$rootScope',
      '$timeout',
      'nrpAnalytics',
      (...args) => new DynamicViewOverlayService(...args)
    ]);

}());
