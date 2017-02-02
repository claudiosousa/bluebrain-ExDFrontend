(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('environmentRendering', [
      function () {
        return {
          templateUrl: 'views/esv/gz3d-view.html',
          restrict: 'E',
          scope: true,
          controller: 'Gz3dViewCtrl'
        };
      }]);
}());
