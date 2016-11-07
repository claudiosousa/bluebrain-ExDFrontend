(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('smachEditor', [
    'backendInterfaceService',
    'pythonCodeHelper',
    'documentationURLs',
    'roslib',
    'STATE',
    'stateService',
    'SIMULATION_FACTORY_CLE_ERROR',
    'SOURCE_TYPE',
    '$timeout',
    'simulationInfo',
    'hbpDialogFactory',
    function (backendInterfaceService,
              pythonCodeHelper,
              documentationURLs,
              roslib,
              STATE,
              stateService,
              SIMULATION_FACTORY_CLE_ERROR,
              SOURCE_TYPE,
              $timeout,
              simulationInfo,
              hbpDialogFactory) {
      return {
        templateUrl: 'views/esv/smach-editor.html',
        restrict: 'E',
        scope: {
          control: '='
        },
        link: function (scope, element, attrs) {
          scope.isCollabExperiment = simulationInfo.isCollabExperiment;
          scope.isSavingToCollab = false;

          scope.STATE = STATE;
          scope.ERROR = SIMULATION_FACTORY_CLE_ERROR;
          scope.SOURCE_TYPE = SOURCE_TYPE;
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
            stateService.ensureStateBeforeExecuting(
              STATE.PAUSED,
              function () {
                delete stateMachine.error[scope.ERROR.RUNTIME];
                delete stateMachine.error[scope.ERROR.LOADING];
                backendInterfaceService.setStateMachine(
                  stateMachine.id,
                  stateMachine.code,
                  function(){
                    stateMachine.dirty = false;
                    stateMachine.local = false;
                    scope.cleanCompileError(stateMachine);
                  });
              }
            );
          };

          scope.onStateMachineChange = function (stateMachine) {
            stateMachine.dirty = true;
          };

          scope.create = function(code) {
            var count = addedStateMachineCount;
            var defaultCode = 'import hbp_nrp_excontrol.nrp_states as states\n'+
              'from smach import StateMachine\n\n'+

              'FINISHED = \'FINISHED\'\n'+
              'ERROR = \'ERROR\'\n'+
              'PREEMPTED = \'PREEMPTED\'\n\n'+

              'sm = StateMachine(outcomes=[FINISHED, ERROR, PREEMPTED])\n\n'+

              'import hbp_nrp_excontrol.nrp_states as states\n'+
              '\n'+
              'with sm:\n'+
              '    # Waits until a simulation time of 20s is reached\n'+
              '    StateMachine.add(\n'+
              '     "timeline_condition",\n'+
              '     states.WaitToClockState(20),\n'+
              '     transitions = {"valid": "timeline_condition",\n'+
              '                    "invalid": "set_left_screen_red",\n'+
              '                    "preempted": PREEMPTED}\n'+
              '    )\n'+
              '    StateMachine.add(\n'+
              '      "set_left_screen_red",\n'+
              '      states.SetMaterialColorServiceState("left_vr_screen",\n'+
              '                                          "body",\n'+
              '                                          "screen_glass",\n'+
              '                                          "Gazebo/RedGlow"),\n'+
              '      transitions = {"succeeded": "delay_set_left_screen_blue",\n'+
              '                     "aborted": FINISHED,\n'+
              '                     "preempted": "set_left_screen_green"}\n'+
              '    )\n'+
              '    StateMachine.add(\n'+
              '      "set_left_screen_blue",\n'+
              '      states.SetMaterialColorServiceState("left_vr_screen",\n'+
              '                                          "body",\n'+
              '                                          "screen_glass",\n'+
              '                                          "Gazebo/BlueGlow"),\n'+
              '      transitions = {"succeeded": "delay_set_left_screen_red",\n'+
              '                     "aborted": FINISHED,\n'+
              '                     "preempted": "set_left_screen_green"}\n'+
              '    )\n'+
              '    StateMachine.add(\n'+
              '      "delay_set_left_screen_blue",\n'+
              '      states.ClockDelayState(5),\n'+
              '      transitions = {"invalid": "set_left_screen_blue",\n'+
              '                     "valid": "delay_set_left_screen_blue",\n'+
              '                     "preempted": "set_left_screen_green"}\n'+
              '    )\n'+
              '    StateMachine.add(\n'+
              '      "delay_set_left_screen_red",\n'+
              '      states.ClockDelayState(5),\n'+
              '      transitions = {"invalid": "set_left_screen_red",\n'+
              '                     "valid": "delay_set_left_screen_red",\n'+
              '                     "preempted": "set_left_screen_green"}\n'+
              '    )\n'+
              '    StateMachine.add(\n'+
              '      "set_left_screen_green",\n'+
              '      states.SetMaterialColorServiceState("left_vr_screen",\n'+
              '                                          "body",\n'+
              '                                          "screen_glass",\n'+
              '                                          "Gazebo/GreenGlow"),\n'+
              '      transitions = {"succeeded": FINISHED,\n'+
              '                     "aborted": FINISHED,\n'+
              '                     "preempted": PREEMPTED}\n'+
              '    )\n\n';

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

          scope.saveSMIntoCollabStorage = function () {
            scope.isSavingToCollab = true;
            var stateMachines = {};
            _.forEach(scope.stateMachines, function(stateMachine){
              stateMachines[stateMachine.id] = stateMachine.code;
            });
            backendInterfaceService.saveStateMachines(
              simulationInfo.contextID,
              stateMachines,
              function() { // Success callback
                scope.isSavingToCollab = false;
              },function() { // Failure callback
                scope.isSavingToCollab = false;
              }
            );
          };

          scope.getStateMachineEditor = function(stateMachine) {
            var id = 'state-machine-' + stateMachine.id;
            var codeMirrorDiv = document.getElementById(id).firstChild;
            return codeMirrorDiv.CodeMirror;
          };

          scope.onNewErrorMessageReceived = function(msg) {
            if (msg.severity < 2 && msg.sourceType === scope.SOURCE_TYPE.STATE_MACHINE) {
              // Error message is not critical and can be fixed
              var flawedStateMachine = _.find(scope.stateMachines, {'id': msg.functionName});
              if (flawedStateMachine === undefined){
                  // if we couldn't find the sm from the id, try against the name
                  flawedStateMachine = _.find(scope.stateMachines, {'name': msg.functionName});
              }
              // Remove error line highlighting if a new compile error is received
              if (msg.errorType === scope.ERROR.COMPILE) {
                scope.cleanCompileError(flawedStateMachine);
              }
              flawedStateMachine.error[msg.errorType] = msg;
              if (msg.lineNumber >= 0) { // Python Syntax Error
                // Error line highlighting
                var editor = scope.getStateMachineEditor(flawedStateMachine);
                var codeMirrorLineNumber = msg.lineNumber - 1;// 0-based line numbering
                msg.lineHandle = editor.getLineHandle(codeMirrorLineNumber);
                editor.addLineClass(codeMirrorLineNumber, 'background', 'alert-danger');
              }
            }
          };

          scope.cleanCompileError = function(stateMachine) {
            var compileError = stateMachine.error[scope.ERROR.COMPILE];
            var lineHandle = compileError ? compileError.lineHandle : undefined;
            if (angular.isDefined(lineHandle)) {
              var editor = scope.getStateMachineEditor(stateMachine);
              editor.removeLineClass(lineHandle, 'background', 'alert-danger');
            }
            delete stateMachine.error[scope.ERROR.COMPILE];
          };

          var rosConnection = roslib.getOrCreateConnectionTo(attrs.server);
          scope.errorTopicSubscriber = roslib.createTopic(rosConnection, attrs.topic, 'cle_ros_msgs/CLEError');
          scope.errorTopicSubscriber.subscribe(scope.onNewErrorMessageReceived);
        }
      };
    }
  ]);
})();
