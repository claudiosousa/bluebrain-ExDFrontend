(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('transferFunctionEditorButtons', [function () {
      return {
        templateUrl: 'views/esv/transfer-function-editor-buttons.html',
        restrict: 'E',
        scope: true,
        link: function (scope, element, attrs) {

          scope.createTf = function () {
            scope.create(attrs.appendAtEnd);
          };

        }
      };
    }]);
})();