(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('contextMenu', [
      function () {
        return {
          templateUrl: 'views/esv/context-menu.html',
          restrict: 'E',
          scope: true
        };
      }]);
}());
