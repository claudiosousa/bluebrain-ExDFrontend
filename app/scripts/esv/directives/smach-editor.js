(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('smachEditor', [
    'backendInterfaceService',
    'pythonCodeHelper',
    'documentationURLs',
    'STATE',
    '$timeout',
    function (backendInterfaceService,
      pythonCodeHelper,
      documentationURLs,
      STATE,
      $timeout) {
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
          var addedStateMachineCount = 0;

          documentationURLs.getDocumentationURLs().then(function(data) {
            scope.backendDocumentationURL = data.backendDocumentationURL;
          });

          scope.control.refresh = function () {
            backendInterfaceService.getStateMachines(
              function (response) {
                _.forEach(response.data, function(code, id) {
                  var stateMachine = new ScriptObject(id, code);
                  stateMachine.name = scope.getStateMachinePythonClassName(code);
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
            stateMachine.name = scope.getStateMachinePythonClassName(stateMachine.code);
            stateMachine.dirty = true;
          };

          scope.create = function(code) {
            var count = addedStateMachineCount;
            var defaultCode = 'import smach_ros\n'+
                'from hbp_nrp_backend.exd_config.default_state_machine import DefaultStateMachine\n\n' +
                'def create_state_machine():\n'+
                '    return MyStateMachine_' + count + '()\n\n' +
                'class MyStateMachine_' + count + '(DefaultStateMachine):\n'+
                '    @staticmethod\n'+
                '    def populate():\n'+
                '        state_list = []\n'+
                '        # Define states and transitions here\n'+
                '        return state_list';
            code = code ? code : defaultCode;
            var id = 'statemachine_' + count + '_' + Date.now();
            var stateMachine = new ScriptObject(id, code);
            stateMachine.dirty = true;
            stateMachine.local = true;
            stateMachine.name = scope.getStateMachinePythonClassName(code);
            scope.stateMachines.unshift(stateMachine);
            addedStateMachineCount = addedStateMachineCount + 1;
            return stateMachine;
          };

          scope.delete = function(stateMachine) {
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

          scope.getStateMachinePythonClassName = function(code) {
            var stateMachineClassRegExp = /^.*class\s+(\w+)\s*\(\s*DefaultStateMachine\s*\).*/gm;
            var matches = stateMachineClassRegExp.exec(code);
            if (matches) {
              return matches[1];
            }
            return undefined;
          };

          scope.save = function (stateMachine) {
            var file = new Blob([stateMachine.code], {type: "plain/text", endings: 'native'});
            var button = angular.element(document.querySelector('#save-state-machine-to-file-' + stateMachine.id));
            button.attr("href", URL.createObjectURL(file));
          };

          scope.loadStateMachine = function(file) {
            if (file && !file.$error) {
              var textReader = new FileReader();
              textReader.onload = function(e) {
                $timeout(function() {
                  var code = e.target.result;
                  var sm = scope.create(code);
                  scope.update(sm);
                });
              };

              textReader.readAsText(file);
            }
          };
       }
    };
  }
  ]);

})();
