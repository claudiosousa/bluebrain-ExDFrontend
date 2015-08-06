(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('smachEditor', ['backendInterfaceService',
    function (backendInterfaceService) {
      return {
        templateUrl: 'views/esv/smach-editor.html',
        restrict: 'E',
        link: function (scope, element, attrs) {

          scope.smachCodes = {};

          scope.smachEditorRefresh = function () {
            backendInterfaceService.getStateMachineScripts(function(response) {
              scope.smachCodes = response.data;
            });
          };

          scope.update = function (name) {
            backendInterfaceService.setStateMachineScript(name, scope.smachCodes[name]);
          };

        }
      };
    }]);
}());
