(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('smachEditor', [
    'backendInterfaceService',
    'documentationURLs',
    function (backendInterfaceService, documentationURLs) {
      return {
        templateUrl: 'views/esv/smach-editor.html',
        restrict: 'E',
        scope: {
          control: '='
        },
        link: function (scope, element, attrs) {

          scope.control.refresh = function () {
            backendInterfaceService.getStateMachineScripts(function(response) {
              scope.smachCodes = response.data;
              if (angular.equals({}, scope.smachCodes)) {
                scope.smachCodes = undefined;
              }
            });
          };

          scope.update = function (name) {
            backendInterfaceService.setStateMachineScript(name, scope.smachCodes[name]);
          };

          documentationURLs.getDocumentationURLs().then(function(data) {
            scope.backendDocumentationURL = data.backendDocumentationURL;
          });

        }
      };
    }]);
}());
