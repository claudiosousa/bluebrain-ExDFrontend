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

          this.applyChannelDefaults();
          this.randomizePosition();
        }
      );
    }

    applyChannelDefaults() {
      if (!this.channelType) {
        return;
      }

      let overlayWrapper = this.$element[0].getElementsByClassName(this.dynamicViewOverlayService.OVERLAY_WRAPPER_CLASS)[0];
      overlayWrapper.style.width = this.channelType.overlayDefaultSize.width + 'px';
      overlayWrapper.style.height = this.channelType.overlayDefaultSize.height + 'px';
    }

    randomizePosition() {
      let overlayWrapper = this.$element[0].getElementsByClassName(this.dynamicViewOverlayService.OVERLAY_WRAPPER_CLASS)[0];
      let overlayParent = this.dynamicViewOverlayService.getOverlayParentElement()[0];

      const MARGIN = .05;
      let getRandomDimension = prop => (MARGIN + Math.random() * (1 - 2 * MARGIN)) * (overlayParent[prop] - overlayWrapper[prop]);

      angular.element(overlayWrapper).css('left', getRandomDimension('clientWidth'));
      angular.element(overlayWrapper).css('top', getRandomDimension('clientHeight'));
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
