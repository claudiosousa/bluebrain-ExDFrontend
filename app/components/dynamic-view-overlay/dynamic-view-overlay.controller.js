(function() {
  'use strict';

  class DynamicViewOverlayController {

    constructor($element,
                $scope,
                $timeout,
                dynamicViewOverlayService) {
      this.$element = $element;
      this.$scope = $scope;
      this.$timeout = $timeout;
      this.dynamicViewOverlayService = dynamicViewOverlayService;

      this.dynamicViewElement = angular.element(this.$element[0].getElementsByTagName('dynamic-view')[0]);

      $scope.$on('$destroy', () => this.onDestroy());
    }

    onDestroy() {
      this.dynamicViewElement.controller('dynamicView').onDestroy();
    }

    closeOverlay() {
      this.onDestroy();
      this.dynamicViewOverlayService.removeOverlay(this.$element[0].id);
    }

    setDynamicViewComponent(componentName) {
      let waitForController = () => {
        let controller = this.dynamicViewElement.controller('dynamicView');
        if (angular.isDefined(controller)) {
          // once we have a controller, set the component
          controller.setViewContentViaDirective(componentName);
        } else {
          // check again in 100ms
          this.$timeout(waitForController, 100);
        }
      };
      waitForController();
    }
  }

  angular.module('dynamicViewOverlayModule', ['dynamicViewModule'])
    .controller('DynamicViewOverlayController', [
      '$element',
      '$scope',
      '$timeout',
      'dynamicViewOverlayService',
      (...args) => new DynamicViewOverlayController(...args)
    ]);

})();
