(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('smachEditor', [
    'backendInterfaceService',
    'pythonCodeHelper',
    'documentationURLs',
    'STATE',
    function (backendInterfaceService,
      pythonCodeHelper,
      documentationURLs,
      STATE) {
      return {
        templateUrl: 'views/esv/smach-editor.html',
        restrict: 'E',
        scope: {
          control: '='
        },
        link: function (scope, element, attrs) {

          scope.STATE = STATE;
          scope.stateMachines = [];
          var ScriptObject = pythonCodeHelper.ScriptObject;

          scope.control.refresh = function () {
            backendInterfaceService.getStateMachines(
              function (response) {
                _.forEach(response.data, function(code, id) {
                  var stateMachine = new ScriptObject(id, code);
                  // If we already have local changes, we do not update
                  var sm = _.find(scope.stateMachines, {'id':  id});
                  var found = angular.isDefined(sm);
                  if (found && !sm.dirty)
                  {
                    sm = stateMachine;
                  } else if (!found) {
                    scope.stateMachines.unshift(stateMachine);
                  }
               });
            });
          };

          scope.update = function(stateMachine) {
            backendInterfaceService.setStateMachine(
              stateMachine.id,
              stateMachine.code,
              function(){
                stateMachine.dirty = false;
                stateMachine.local = false;
            });
          };

          scope.onStateMachineChange = function (stateMachine) {
            stateMachine.dirty = true;
          };

          scope.delete = function (stateMachine) {
            var index = scope.stateMachines.indexOf(stateMachine);
            if (stateMachine.local) {
              scope.stateMachines.splice(index, 1);
            } else {
              backendInterfaceService.deleteStateMachine(stateMachine.id,
                function() {
                  scope.stateMachines.splice(index, 1);
                }
              );
            }
          };

          documentationURLs.getDocumentationURLs().then(function(data) {
            scope.backendDocumentationURL = data.backendDocumentationURL;
          });

        }
      };
    }]);
}());