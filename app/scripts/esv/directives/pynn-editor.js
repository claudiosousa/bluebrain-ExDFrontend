(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('pynnEditor', [
    'backendInterfaceService',
    'documentationURLs',
    function (backendInterfaceService, documentationURLs) {
      return {
        templateUrl: 'views/esv/pynn-editor.html',
        restrict: 'E',
        scope: {
          control: '='
        },
        link: function (scope, element, attrs) {

          scope.control.refresh = function () {
            backendInterfaceService.getBrain(function(response) {
              if (response.brain_type === "py") {
                scope.pynnScript = response.data;
              } else {
                scope.pynnScript = undefined;
              }
            });
          };

          documentationURLs.getDocumentationURLs().then(function(data) {
            scope.backendDocumentationURL = data.backendDocumentationURL;
          });

        }
      };
    }]);
}());
