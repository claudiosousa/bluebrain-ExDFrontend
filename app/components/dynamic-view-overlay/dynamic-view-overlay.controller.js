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

    setDynamicViewChannel(channelType) {
      this.dynamicViewOverlayService.getController(this.dynamicViewElement, 'dynamicView').then(
        (controller) => {
          controller.setViewContentViaChannelType(channelType);
          this.channelType = channelType;
        }
      );
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
