(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('cameraView', [
      'gz3d',
      function (gz3d) {
        return {
          templateUrl: 'views/esv/camera-view.html',
          restrict: 'E',
          scope: true,
          link: function (scope, element, attrs) {
            scope.cameraName = attrs.cameraName;
            scope.showFrustum = false;

            scope.onShowFrustumChanged = function() {
              var cameraHelper = gz3d.scene.viewManager.getViewByName(scope.cameraName).camera.cameraHelper;
              if (angular.isDefined(cameraHelper)) {
                cameraHelper.visible = scope.showFrustum;
              }
            };
          }
        };
      }]);
}());
