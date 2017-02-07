(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('smachEditor', [
    'backendInterfaceService',
    'pythonCodeHelper',
    'documentationURLs',
    'roslib',
    'serverError',
    'STATE',
    'stateService',
    'SIMULATION_FACTORY_CLE_ERROR',
    'SOURCE_TYPE',
    '$timeout',
    'simulationInfo',
    'hbpDialogFactory',
    'autoSaveService',
    'downloadFileService',
    'RESET_TYPE',
    'editorsServices',
    'saveErrorsService',
    function (backendInterfaceService,
              pythonCodeHelper,
              documentationURLs,
              roslib,
              serverError,
              STATE,
              stateService,
              SIMULATION_FACTORY_CLE_ERROR,
              SOURCE_TYPE,
              $timeout,
              simulationInfo,
              hbpDialogFactory,
              autoSaveService,
              downloadFileService,
              RESET_TYPE,
              editorsServices,
              saveErrorsService) {

      var DIRTY_TYPE = 'SM';

      return {
        templateUrl: 'views/esv/smach-editor.html',
        restrict: 'E',
        scope: {
          control: '='
        },
        link: function (scope, element, attrs) {
          scope.isCollabExperiment = simulationInfo.isCollabExperiment;
          scope.isSavingToCollab = false;
          scope.collabDirty = false;

          scope.editorOptions = editorsServices.getDefaultEditorOptions();

          scope.STATE = STATE;
          scope.ERROR = SIMULATION_FACTORY_CLE_ERROR;
          scope.SOURCE_TYPE = SOURCE_TYPE;
          scope.stateMachines = [];
          var ScriptObject = pythonCodeHelper.ScriptObject;
          var addedStateMachineCount = 0;

          var docs = documentationURLs.getDocumentationURLs();
          scope.backendDocumentationURL = docs.backendDocumentationURL;
          scope.platformDocumentationURL = docs.platformDocumentationURL;

          scope.control.refresh = function () {
            if (scope.collabDirty) {
              editorsServices.refreshAllEditors(scope.stateMachines.map(function(sm) {return 'state-machine-' + sm.id;}));
              return;
            }
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
                editorsServices.refreshAllEditors(scope.stateMachines.map(function(sm) {return 'state-machine-' + sm.id;}));
              });
          };

          scope.update = function (stateMachine) {
            var restart = stateService.currentState === STATE.STARTED;
            stateService.ensureStateBeforeExecuting(
              STATE.PAUSED,
              function () {
                delete stateMachine.error[scope.ERROR.RUNTIME];
                delete stateMachine.error[scope.ERROR.LOADING];
                backendInterfaceService.setStateMachine(
                  stateMachine.id,
                  stateMachine.code,
                  function () {
                    stateMachine.dirty = false;
                    stateMachine.local = false;
                    scope.cleanCompileError(stateMachine);
                    if (restart) {
                      stateService.setCurrentState(STATE.STARTED);
                    }
                  }, function (data) {
                    serverError.displayHTTPError(data);
                    if (restart) {
                      stateService.setCurrentState(STATE.STARTED);
                    }
                  });
              }
            );
          };

          scope.resetListenerUnbindHandler = scope.$on('RESET', function (event, resetType)
          {
            if (resetType === RESET_TYPE.RESET_FULL)
            {
              scope.collabDirty = false;
              scope.stateMachines = [];
            }
          });

          scope.onStateMachineChange = function (stateMachine) {
            stateMachine.dirty = true;
            scope.collabDirty = scope.isCollabExperiment;
            autoSaveService.setDirty(DIRTY_TYPE, scope.stateMachines);
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
            scope.collabDirty = scope.isCollabExperiment;
            autoSaveService.setDirty(DIRTY_TYPE, scope.stateMachines);

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
            var stateMachineIDRegExp = /^(statemachine_[0-9]+)_[0-9]+_front\-?end_generated$/;
            var matches = stateMachineIDRegExp.exec(id);
            if (matches) {
              // The state machine ID was generated by the frontend.
              // Returns a simplified string ID of the form statemachine_<int>
              return matches[1];
            }
            // The state machine ID was originally set in the backend.
            // Hopefully, it is a meaningful name
            return id;
          };

          scope.generateID = function(count) {
            return 'statemachine_' + count + '_' + Date.now() + '_frontend_generated';
          };

          scope.save = function() {
            var stateMachinesCodeText = _.flatMap(scope.stateMachines, function (stateMachine) {
              return [stateMachine.code];
            });
            var file = new Blob(stateMachinesCodeText, { type: "plain/text", endings: 'native' });
            var href = URL.createObjectURL(file);
            downloadFileService.downloadFile(href, 'stateMachines.py');
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
            var errors = false;
            var stateMachines = {};
            _.forEach(scope.stateMachines, function(stateMachine){
              stateMachines[stateMachine.id] = stateMachine.code;
              if(Object.keys(stateMachine.error).length !== 0){
                errors = true;
              }
            });
            if(errors){
              hbpDialogFactory.confirm({
                  title: "State Machine  errors.",
                  template: "There are errors inside your State Machines. Are you sure you want to save?",
                  confirmLabel: "Yes",
                  cancelLabel: 'No',
                  closable: false
                }).then(function(){
                  return saveErrorsService.saveDirtyData(DIRTY_TYPE, scope.stateMachines)
                  .then(function(){
                    return autoSaveService.clearDirty(DIRTY_TYPE);
                  });
                })
                .finally(function(){
                  scope.isSavingToCollab = false;
                });
              return;
            }
            backendInterfaceService.saveStateMachines(
              simulationInfo.contextID,
              stateMachines,
              function() { // Success callback
                scope.isSavingToCollab = false;
                scope.collabDirty = false;
                autoSaveService.clearDirty(DIRTY_TYPE);
                saveErrorsService.clearDirty(DIRTY_TYPE);
              },function() { // Failure callback
                scope.isSavingToCollab = false;
              }
            );
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
                var editor = editorsServices.getEditor('state-machine-' + flawedStateMachine.id);
                var codeMirrorLineNumber = msg.lineNumber - 1;// 0-based line numbering
                msg.lineHandle = codeMirrorLineNumber;
                editor.addLineClass(codeMirrorLineNumber, 'background', 'alert-danger');
              }
            }
          };

          scope.cleanCompileError = function(stateMachine) {
            var compileError = stateMachine.error[scope.ERROR.COMPILE];
            var lineHandle = compileError ? compileError.lineHandle : undefined;
            if (angular.isDefined(lineHandle)) {
              var editor = editorsServices.getEditor('state-machine-' + stateMachine.id);
              editor.removeLineClass(lineHandle, 'background', 'alert-danger');
            }
            delete stateMachine.error[scope.ERROR.COMPILE];
          };

          var rosConnection = roslib.getOrCreateConnectionTo(attrs.server);
          scope.errorTopicSubscriber = roslib.createTopic(rosConnection, attrs.topic, 'cle_ros_msgs/CLEError');
          scope.errorTopicSubscriber.subscribe(scope.onNewErrorMessageReceived);

        saveErrorsService.registerCallback(DIRTY_TYPE, function(newSMs){
          scope.stateMachines = newSMs;
        });
          autoSaveService.registerFoundAutoSavedCallback(DIRTY_TYPE, function(autoSaved) {
            scope.collabDirty = true;
            scope.stateMachines = autoSaved;
          });
        }
      };
    }
  ]);
})();
