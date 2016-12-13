(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
    // constants for CLE error types
    .constant('SIMULATION_FACTORY_CLE_ERROR', {
      COMPILE: 'Compile',
      RUNTIME: 'Runtime',
      LOADING: 'Loading',
      NO_OR_MULTIPLE_NAMES: 'NoOrMultipleNames'
    });

  angular.module('exdFrontendApp.Constants')
    // Constants for CLE error source types
    .constant('SOURCE_TYPE', {
      TRANSFER_FUNCTION: 'Transfer Function',
      STATE_MACHINE: 'State Machine'
    });

  angular.module('exdFrontendApp')
  .constant('DEFAULT_TF_CODE', '@nrp.Robot2Neuron()\ndef {0}(t):\n\
    #log the first timestep (20ms), each couple of seconds\n\
    if (t%2<0.02):\n\
        clientLogger.info(\'Hello world at time \' + str(t))')
  .directive('transferFunctionEditor', [
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
      'SOURCE_TYPE',
      'simulationInfo',
      'hbpDialogFactory',
      'autoSaveService',
      'DEFAULT_TF_CODE',
      'downloadFileService',
      'RESET_TYPE',
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
        SOURCE_TYPE,
        simulationInfo,
        hbpDialogFactory,
        autoSaveService,
        DEFAULT_TF_CODE,
        downloadFileService,
        RESET_TYPE
    ) {
    var DIRTY_TYPE = 'TF';

    return {
      templateUrl: 'views/esv/transfer-function-editor.html',
      restrict: 'E',
      scope: {
        control: '='
      },
      link: function (scope, element, attrs) {

        scope.isCollabExperiment = simulationInfo.isCollabExperiment;
        scope.isSavingToCollab = false;
        scope.collabDirty = false;

        scope.editorOptions = {
          lineWrapping : true,
          lineNumbers: true,
          readOnly: false,
          indentUnit: 4,
          mode: 'text/x-python'
        };

        scope.stateService = stateService;
        scope.STATE = STATE;
        scope.ERROR = SIMULATION_FACTORY_CLE_ERROR;
        scope.SOURCE_TYPE = SOURCE_TYPE;
        var ScriptObject = pythonCodeHelper.ScriptObject;

        scope.populations = [];

        scope.showPopulations = false;
        scope.togglePopulations = function() {
          scope.showPopulations = !scope.showPopulations;
          refreshPopulations();
        };
        scope.togglePopulationParameters = function(population) {
          population.showDetails = !population.showDetails;
        };
        scope.onPopulationsReceived = function(population) {
          var p = _.find(scope.populations, {'name': population.name});
          var found = angular.isDefined(p);
          if (!found) {
            population.showDetails = false;
            scope.populations.unshift(population);
          }
        };

        var refreshPopulations = function() {
          if (scope.showPopulations) {
            scope.populations = [];
            backendInterfaceService.getPopulations(function(response) {
              _.forEach(response.populations, scope.onPopulationsReceived);
            });
          }
        };

        scope.transferFunctions = [];
        var addedTransferFunctionCount = 0;

        var docs = documentationURLs.getDocumentationURLs();
        scope.cleDocumentationURL = docs.cleDocumentationURL;
        scope.platformDocumentationURL = docs.platformDocumentationURL;

        scope.getTransferFunctionEditor = function(transferFunction) {
          var id = 'transfer-function-' + transferFunction.id;
          var codeMirrorDiv = document.getElementById(id).firstChild;
          return codeMirrorDiv.CodeMirror;
        };

        scope.onNewErrorMessageReceived = function(msg) {
          if (msg.severity < 2 && msg.sourceType === scope.SOURCE_TYPE.TRANSFER_FUNCTION) {
            // Error message is not critical and can be fixed
            var flawedTransferFunction = _.find(scope.transferFunctions, {'id': msg.functionName});
            if (flawedTransferFunction === undefined){
                // if we couldn't find the tf from the id, try against the name
                flawedTransferFunction = _.find(scope.transferFunctions, {'name': msg.functionName});
            }
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
            if (_.isNull(element[0].offsetParent)) {
              // the editor is currently hidden: we have to display the error in a popup
              var nrpError = {
                title: 'Transfer function error',
                template: msg.functionName + ':' + msg.lineNumber + ": " + msg.message,
                label: 'OK'
              };
              serverError.displayError(nrpError);
            }
          }
        };

        var rosConnection = roslib.getOrCreateConnectionTo(attrs.server);
        scope.errorTopicSubscriber = roslib.createTopic(rosConnection, attrs.topic, 'cle_ros_msgs/CLEError');
        scope.errorTopicSubscriber.subscribe(scope.onNewErrorMessageReceived, true);

        function refreshAllEditors() {
          $timeout(function() {
            _.forEach(scope.transferFunctions, function(tf) {
              scope.getTransferFunctionEditor(tf).refresh();
            });
          }, 200);
        }

        scope.resetListenerUnbindHandler = scope.$on('RESET', function (event, resetType)
        {
          if (resetType === RESET_TYPE.RESET_FULL)
          {
            scope.collabDirty = false;
            scope.transferFunctions = [];
          }
        });

        scope.control.refresh = function () {
          if (scope.collabDirty){
            refreshAllEditors();
            return;
          }
          backendInterfaceService.getTransferFunctions(
            function (response) {
              _.forEach(response.data, function(code, id) {
                var transferFunction = new ScriptObject(id, code);
                // If we already have local changes, we do not update
                var tf = _.find(scope.transferFunctions, {'name':  id});
                var found = angular.isDefined(tf);
                if (found && !tf.dirty) {
                  tf.code = transferFunction.code;
                  var curEditor = scope.getTransferFunctionEditor(transferFunction);
                  curEditor.clearHistory();
                  curEditor.markClean();
                } else if (!found) {
                  scope.transferFunctions.unshift(transferFunction);
                }
             });
             refreshAllEditors();
          });
          refreshPopulations();
        };

        // initialize transfer functions
        scope.control.refresh();

        scope.cleanCompileError = function(transferFunction) {
          var compileError = transferFunction.error[scope.ERROR.COMPILE];
          var lineHandle = compileError ? compileError.lineHandle : undefined;
          if (angular.isDefined(lineHandle)) {
            var editor = scope.getTransferFunctionEditor(transferFunction);
            editor.removeLineClass(lineHandle, 'background', 'alert-danger');
          }
          delete transferFunction.error[scope.ERROR.COMPILE];
          delete transferFunction.error[scope.ERROR.NO_OR_MULTIPLE_NAMES];
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
                  transferFunction.id = pythonCodeHelper.getFunctionName(transferFunction.code);
                  scope.cleanCompileError(transferFunction);
                  if (restart) {
                    stateService.setCurrentState(STATE.STARTED);
                  }
                },
                function(data) {
                  serverError.displayHTTPError(data);
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
          scope.collabDirty = scope.isCollabExperiment;
          autoSaveService.setDirty(DIRTY_TYPE, scope.transferFunctions);
          if (transferFunction.local) {
            transferFunction.id = transferFunction.name;
          }
        };

        scope.delete = function (transferFunction) {
          if (transferFunction === undefined) return;
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

        scope.create = function (appendAtEnd) {
          var id = "transferfunction_" + addedTransferFunctionCount;
          var code = DEFAULT_TF_CODE.replace('{0}', id);
          var transferFunction = new ScriptObject(id, code);
          transferFunction.dirty = true;
          transferFunction.local = true;
          if (appendAtEnd) {
            scope.transferFunctions.push(transferFunction);
          } else {
            scope.transferFunctions.unshift(transferFunction);
          }
          addedTransferFunctionCount = addedTransferFunctionCount + 1;
          scope.collabDirty = scope.isCollabExperiment;
          autoSaveService.setDirty(DIRTY_TYPE, scope.transferFunctions);
        };

        scope.buildTransferFunctionFile = function(transferFunctions) {
          return _.map(transferFunctions, 'code').join('\n');
        };

        var insertIfTransferFunction = function(list, tf_code) {
          // check whether code contains a tf definition
          var isTFRegex = /^(@nrp[^\n]+\s+)+(#[^\n]*\n|\/\*(.|\n)*\*\/|\s)*def \w+/m;
          if (isTFRegex.exec(tf_code) !== null) {
           list.push(new ScriptObject('', tf_code));
          }
        };

        var splitCodeFile = function(content) {
          // matches a python unindent
          var regexCode = /^\s{2}[^\n]*\n+(?:\S)/gm;

          // slice the codefile into separate functions
          var match = regexCode.exec(content);
          var previousMatchIdx = 0;
          var loadedTransferFunctions = [];
          while (match !== null) {
            // regular expressions in JavaScript are completely messed up
            insertIfTransferFunction(loadedTransferFunctions, content.slice(previousMatchIdx, regexCode.lastIndex - 1).trim());
            previousMatchIdx = regexCode.lastIndex - 1;
            match = regexCode.exec(content);
          }
          // get the last code match
          insertIfTransferFunction(loadedTransferFunctions, content.slice(previousMatchIdx).trim());

          return loadedTransferFunctions;
        };

        scope.download = function () {
          var file = new Blob([
            scope.buildTransferFunctionFile(scope.transferFunctions)
          ], { type: "plain/text", endings: 'native' });
          var href = URL.createObjectURL(file);
          downloadFileService.downloadFile(href, 'transferFunctions.py');
        };

        scope.saveTFIntoCollabStorage = function () {
          scope.isSavingToCollab = true;
          backendInterfaceService.saveTransferFunctions(
            simulationInfo.contextID,
            _.map(scope.transferFunctions, 'code'),
            function() { // Success callback
              scope.isSavingToCollab = false;
              scope.collabDirty = false;
              autoSaveService.clearDirty(DIRTY_TYPE);
              if (stateService.currentState !== STATE.STOPPED) {
                // update all transfer functions
                _.forEach(scope.transferFunctions, scope.update);
              }
            },function() { // Failure callback
              hbpDialogFactory.alert({
                title: "Error.",
                template: "Error while saving transfer functions to Collab storage."
              });
              scope.isSavingToCollab = false;
            }
          );
        };

        scope.saveCSVIntoCollabStorage = function () {
          scope.isSavingCSVToCollab = true;
          backendInterfaceService.saveCSVRecordersFiles(
            simulationInfo.contextID,
            function () { // Success callback
              scope.isSavingCSVToCollab = false;
            }, function () { // Failure callback
              hbpDialogFactory.alert({
                title: "Error.",
                template: "Error while saving recorded CSV files to Collab storage."
              });
              scope.isSavingCSVToCollab = false;
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

        autoSaveService.registerFoundAutoSavedCallback(DIRTY_TYPE, function(autoSaved){
          scope.collabDirty = true;
          scope.transferFunctions = autoSaved;
        });
      }
    };
  }]);
}());
