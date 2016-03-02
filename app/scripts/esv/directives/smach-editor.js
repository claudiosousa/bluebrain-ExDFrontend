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
            scope.platformDocumentationURL = data.platformDocumentationURL;
          });

          scope.refreshLayout = function(editor) {
            // This updates the layout of the editor also onLoad
            // Just a editor.refresh() does not work here, so we set a callback on the first "change" event
            // and remove the listener afterwards
            var r = function() {
              editor.refresh();
              editor.off("change", r);
            };
            editor.on("change", r);
          };

          scope.control.refresh = function () {
            backendInterfaceService.getStateMachines(
              function (response) {
                _.forEach(response.data, function(code, id) {
                  var stateMachine = new ScriptObject(id, code);
                  stateMachine.name = scope.getStateMachineName(id);
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

          scope.create = function(code) {
            var count = addedStateMachineCount;
            var defaultCode = 'import hbp_nrp_excontrol as states\n'+
              'from smach import StateMachine\n\n'+

              'FINISHED = \'FINISHED\'\n'+
              'ERROR = \'ERROR\'\n'+
              'PREEMPTED = \'PREEMPTED\'\n\n'+

              'sm = StateMachine(outcomes=[FINISHED, ERROR, PREEMPTED])\n\n'+

              'with sm:\n'+
              '    # Waits until a simulation time of 20s is reached\n'+
              '    StateMachine.add(\n'+
              '     "timeline_condition",\n'+
              '     states.WaitToClockState(20),\n'+
              '     transitions = {\'valid\': \'timeline_condition\',\n'+
              '                    \'invalid\': FINISHED,\n'+
              '                    \'preempted\': PREEMPTED}\n'+
              '    )\n'+
              '    # Uncomment this to add a state that sets the color of a material\n'+
              '    # StataMachine.add(\n'+
              '    #   "set_left_screen_red",\n'+
              '    #   states.SetMaterialColorServiceState("left_vr_screen",\n'+
              '    #                                       "body",\n'+
              '    #                                       "screen_glass",\n'+
              '    #                                       "Gazebo/Red"),\n'+
              '    #   transitions = {...}\n'+
              '    #)\n\n'+
              '    # Uncomment this to monitor the robot pose\n'+
              '    # StateMachine.add(\n'+
              '    #   "wait_for_husky_left",\n'+
              '    #   states.RobotPoseMonitorState(lambda ud, p: not ((-1 < p.position.x < 1) and\n'+
              '    #                                                   (-2.5 < p.position.y < -1.8) and\n'+
              '    #                                                   (0 < p.position.z < 1))),\n'+
              '    #   transitions = {...}\n'+
              '    # )\n\n';

            code = code ? code : defaultCode;
            var id = scope.generateID(count);
            var stateMachine = new ScriptObject(id, code);
            stateMachine.dirty = true;
            stateMachine.local = true;
            stateMachine.name = scope.getStateMachineName(id);
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

          scope.getStateMachineName = function(id) {
            var stateMachineIDRegExp = /^(statemachine_[0-9]+)_[0-9]+_front\-end_generated$/gm;
            var matches = stateMachineIDRegExp.exec(id);
            if (matches) {
              // The state machine ID was generated by the front-end.
              // Returns a simplified string ID of the form statemachine_<int>
              return matches[1];
            }
            // The state machine ID was originally set in the back-end.
            // Hopefully, it is a meaningful name
            return id;
          };

          scope.generateID = function(count) {
            return 'statemachine_' + count + '_' + Date.now() + '_front-end_generated';
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
