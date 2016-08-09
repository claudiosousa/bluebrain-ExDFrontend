(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('brainvisualizerPanel', [
      function () {
        return {
          templateUrl: 'views/esv/brainvisualizer-panel.html',
          restrict: 'E',
          scope: true  // create a child scope for the directive and inherits the parent scope properties
        };
      }
    ]);
}());
