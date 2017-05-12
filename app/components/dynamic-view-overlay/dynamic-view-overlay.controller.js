(function() {
  'use strict';

  class DynamicViewOverlayController {

    constructor($element,
                $scope,
                dynamicViewOverlayService) {
      this.$element = $element;
      this.$scope = $scope;
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
      this.dynamicViewElement.controller('dynamicView').setViewContentViaDirective(componentName);
    }
  }

  angular.module('dynamicViewOverlayModule', ['dynamicViewModule'])
    .controller('DynamicViewOverlayController', [
      '$element',
      '$scope',
      'dynamicViewOverlayService',
      (...args) => new DynamicViewOverlayController(...args)
    ]);

})();
