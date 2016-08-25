(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('environmentSettingsPanel', [
      function () {
        return {
          templateUrl: 'views/esv/environment-settings-panel.html',
          restrict: 'E',
          scope: true  // create a child scope for the directive and inherits the parent scope properties
        };
      }
    ]);
}());
