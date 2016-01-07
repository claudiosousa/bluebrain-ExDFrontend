(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
    // constants for CLE error types
    .constant('SIMULATION_FACTORY_CLE_ERROR', {
      COMPILE: 'Compile',
      RUNTIME: 'Runtime',
      LOADING: 'Loading',
    });

  angular.module('exdFrontendApp').directive('transferFunctionEditor', [
      '$log',
      'backendInterfaceService',
      'STATE',
      'stateService',
      'pythonCodeHelper',
      'roslib',
      'serverError',
      '$timeout',
      'documentationURLs',
      'SIMULATION_FACTORY_CLE_ERROR',
      'simulationInfo',
      'hbpDialogFactory',
    function (
        $log,
        backendInterfaceService,
        STATE,
        stateService,
        pythonCodeHelper,
        roslib,
        serverError,
        $timeout,
        documentationURLs,
        SIMULATION_FACTORY_CLE_ERROR,
        simulationInfo,
        hbpDialogFactory
    ) {
    return {
      templateUrl: 'views/esv/transfer-function-editor.html',
      restrict: 'E',
      scope: {
        control: '='
      },
      link: function (scope, element, attrs) {

        scope.isCollabExperiment = simulationInfo.isCollabExperiment;
        scope.isSavingToCollab = false;
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

        scope.editorOptions = {
          onLoad: scope.refreshLayout,
          lineWrapping : true,
          lineNumbers: true,
          readOnly: false,
          indentUnit: 4,
          mode: 'text/x-python'
        };

        scope.stateService = stateService;
        scope.STATE = STATE;
        scope.ERROR = SIMULATION_FACTORY_CLE_ERROR;
        var ScriptObject = pythonCodeHelper.ScriptObject;

        scope.transferFunctions = [];
        var addedTransferFunctionCount = 0;

        documentationURLs.getDocumentationURLs().then(function(data) {
          scope.cleDocumentationURL = data.cleDocumentationURL;
        });

        scope.getTransferFunctionEditor = function(transferFunction) {
          var id = 'transfer-function-' + transferFunction.id;
          var codeMirrorDiv = document.getElementById(id).firstChild;
          return codeMirrorDiv.CodeMirror;
        };

        scope.onNewErrorMessageReceived = function(msg) {
          var flawedTransferFunction = _.find(scope.transferFunctions, {'name':  msg.functionName});
          // Remove error line highlighting if a new compile error is received
          if (msg.errorType === scope.ERROR.COMPILE) {
            scope.cleanCompileError(flawedTransferFunction);
          }
          flawedTransferFunction.error[msg.errorType] = msg;
          if (msg.lineNumber >= 0) { // Python Syntax Error
            // Error line highlighting
            var editor = scope.getTransferFunctionEditor(flawedTransferFunction);
            var codeMirrorLineNumber = msg.lineNumber - 1;// 0-based line numbering
            flawedTransferFunction.error[scope.ERROR.COMPILE].lineHandle = editor.getLineHandle(codeMirrorLineNumber);
            editor.addLineClass(codeMirrorLineNumber, 'background', 'alert-danger');
          }
        };

        var rosConnection = roslib.getOrCreateConnectionTo(attrs.server);
        scope.errorTopicSubscriber = roslib.createTopic(rosConnection, attrs.topic, 'cle_ros_msgs/CLEError');
        scope.errorTopicSubscriber.subscribe(scope.onNewErrorMessageReceived);


        scope.control.refresh = function () {
          backendInterfaceService.getTransferFunctions(
            function (response) {
              _.forEach(response.data, function(code, id) {
                var transferFunction = new ScriptObject(id, code);
                // If we already have local changes, we do not update
                var tf = _.find(scope.transferFunctions, {'name':  id});
                var found = angular.isDefined(tf);
                if (found && !tf.dirty)
                {
                  tf = transferFunction;
                } else if (!found) {
                  scope.transferFunctions.unshift(transferFunction);
                }
             });
          });
        };

        scope.cleanCompileError = function(transferFunction) {
          var compileError = transferFunction.error[scope.ERROR.COMPILE];
          var lineHandle = compileError ? compileError.lineHandle : undefined;
          if (angular.isDefined(lineHandle)) {
            var editor = scope.getTransferFunctionEditor(transferFunction);
            editor.removeLineClass(lineHandle, 'background', 'alert-danger');
          }
          delete transferFunction.error[scope.ERROR.COMPILE];
        };

        scope.update = function(transferFunction) {
          var restart = stateService.currentState === STATE.STARTED;
          stateService.ensureStateBeforeExecuting(
            STATE.PAUSED,
            function() {
              delete transferFunction.error[scope.ERROR.RUNTIME];
              delete transferFunction.error[scope.ERROR.LOADING];
              backendInterfaceService.setTransferFunction(transferFunction.id, transferFunction.code,
                function(){
                  transferFunction.dirty = false;
                  transferFunction.local = false;
                  scope.cleanCompileError(transferFunction);
                  if (restart) {
                    stateService.setCurrentState(STATE.STARTED);
                  }
                },
                function(data) {
                  serverError.display(data);
                  if (restart) {
                    stateService.setCurrentState(STATE.STARTED);
                  }
                }
              );
            }
          );
        };

        scope.onTransferFunctionChange = function (transferFunction) {
          transferFunction.name = pythonCodeHelper.getFunctionName(transferFunction.code);
          transferFunction.dirty = true;
        };

        scope.delete = function (transferFunction) {
          var index = scope.transferFunctions.indexOf(transferFunction);
          if (transferFunction.local) {
            scope.transferFunctions.splice(index, 1);
          } else {
            var restart = stateService.currentState === STATE.STARTED;
            stateService.ensureStateBeforeExecuting(
              STATE.PAUSED,
              function () {
                backendInterfaceService.deleteTransferFunction(transferFunction.id, function() {
                  if (restart) {
                    stateService.setCurrentState(STATE.STARTED);
                  }
                });
                scope.transferFunctions.splice(index, 1);
              }
            );
          }
        };

        scope.create = function () {
          var id = "transferfunction_" + addedTransferFunctionCount;
          var code = "@nrp.Robot2Neuron()\ndef " + id + "(t):\n    print \"Hello world at time \" + str(t)";
          var transferFunction = new ScriptObject(id, code);
          transferFunction.dirty = true;
          transferFunction.local = true;
          scope.transferFunctions.unshift(transferFunction);
          addedTransferFunctionCount = addedTransferFunctionCount + 1;
        };

        scope.buildTransferFunctionFile = function(transferFunctions) {
          return _.pluck(transferFunctions, 'code').join('\n');
        };

        var splitCodeFile = function(content) {
          // matches decorators and function declaration:
          var regexCode = /((^@.*)\n)*^.*def\s+\w+\s*\(.*/gm;

          // slice the codefile into separate functions
          var match = regexCode.exec(content);
          var previousMatchIdx = match.index;
          match = regexCode.exec(content);

          var loadedTransferFunctions = [];
          while (match !== null) {
            loadedTransferFunctions.push(new ScriptObject('', content.slice(previousMatchIdx, match.index)));
            previousMatchIdx = match.index;
            match = regexCode.exec(content);
          }
          // get the last code match
          loadedTransferFunctions.push(new ScriptObject('', content.slice(previousMatchIdx)));

          return loadedTransferFunctions;
        };

        scope.download = function () {
          var file = new Blob([
            scope.buildTransferFunctionFile(scope.transferFunctions)
          ], {type: "plain/text", endings: 'native'});

          var button = angular.element(document.querySelector('#download-transfer-functions'));
          button.attr("href", URL.createObjectURL(file));
        };
        scope.saveTFIntoCollabStorage = function () {
          scope.isSavingToCollab = true;
          // update all transfer functions
          _.forEach(scope.transferFunctions, scope.update);
          backendInterfaceService.saveTransferFunctions(
            simulationInfo.contextID,
            _.pluck(scope.transferFunctions, 'code'),
            function() { // Success callback
              scope.isSavingToCollab = false;
            },function() { // Failure callback
              hbpDialogFactory.alert({
                title: "Error.",
                template: "Error while saving transfer functions to Collab storage."
              });
              scope.isSavingToCollab = false;
            }
          );
        };

        scope.loadTransferFunctions = function(file) {
          if (file && !file.$error) {
            var textReader = new FileReader();
            textReader.onload = function(e) {
              $timeout(function() {
                var content = e.target.result;
                var loadedTransferFunctions = splitCodeFile(content);
                // Removes all TFs
                _.forEach(scope.transferFunctions, scope.delete);
                // Upload new TFs to back-end
                scope.transferFunctions = loadedTransferFunctions;
                scope.transferFunctions.forEach(function(tf) {
                  scope.onTransferFunctionChange(tf);
                  tf.id = tf.name;
                  tf.local = true;
                  scope.update(tf);
                });
              });
            };
            textReader.readAsText(file);
          }
        };
      }
    };
  }]);
}());
