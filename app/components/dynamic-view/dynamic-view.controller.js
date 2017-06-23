(function() {
  'use strict';

  /* global console: false */

  class DynamicViewController {

    constructor($compile,
                $element,
                $rootScope,
                $scope) {
      this.$compile = $compile;
      this.$element = $element;
      this.$rootScope = $rootScope;
      this.$scope = $scope;

      $scope.$on('$destroy', () => this.onDestroy());

      /* initialization */
      this.viewContainer = this.getViewContainerElement(this.$element);

      if (this.$element[0].attributes['dynamic-view-component']) {
        this.setViewContentViaChannelType(this.$element[0].attributes['dynamic-view-component'].value);
      }
    }

    onDestroy() {
      if (this.contentScope) {
        this.contentScope.$destroy();
      }
    }

    setViewContent(content) {
      // trigger $destroy event before replacing and recompiling content
      // elements/directives set as content of this dynamic-view directive can de-initialize via $scope.$on('$destroy', ...)
      if (angular.isDefined(this.contentScope)) {
        this.contentScope.$destroy();
      }

      // content container should exist
      if (!angular.isDefined(this.viewContainer)) {
        console.warn('dynamicView.setViewContent() - viewContainer element not defined!');
        return;
      }

      // set and compile new content
      this.viewContent = content;
      this.viewContainer.innerHTML = this.viewContent;
      this.contentScope = this.$rootScope.$new();
      this.$compile(this.viewContainer)(this.contentScope);
    }

    getViewContainerElement(parentElement) {
      let containerElement = parentElement.find('[dynamic-view-container]');
      return containerElement[0];
    }

    setViewContentViaChannelType(channelType) {
      this.setViewContent('<' + channelType + '></' + channelType + '>');
    }
  }

  angular.module('dynamicViewModule', [])
    .controller('DynamicViewController', [
      '$compile',
      '$element',
      '$rootScope',
      '$scope',
      (...args) => new DynamicViewController(...args)
    ])

    .constant('DYNAMIC_VIEW_CHANNELS', {
      BRAIN_VISUALIZER: 'brainvisualizer-panel',
      DYNAMIC_VIEW: 'dynamic-view',
      ENVIRONMENT_RENDERING: 'environment-rendering',
      JOINT_PLOT: 'joint-plot',
      SPIKE_TRAIN: 'spike-train',
      VIDEO_STREAM: 'video-streams'
    });

})();
