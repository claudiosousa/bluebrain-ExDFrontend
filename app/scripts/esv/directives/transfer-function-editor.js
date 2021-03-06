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
      'editorsServices',
      '$q',
      'saveErrorsService',
      'environmentService',
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
        RESET_TYPE,
        editorsServices,
        $q,
        saveErrorsService,
        environmentService) {
    var DIRTY_TYPE = 'TF';

    return {
      templateUrl: 'views/esv/transfer-function-editor.html',
      restrict: 'E',
      scope: {
        control: '='
      },
      link: function (scope, element, attrs) {

        scope.isPrivateExperiment = environmentService.isPrivateExperiment();
        scope.isSavingToCollab = false;
        scope.collabDirty = false;

        scope.editorOptions = editorsServices.getDefaultEditorOptions();

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
              var editor = editorsServices.getEditor('transfer-function-' + flawedTransferFunction.id);
              var codeMirrorLineNumber = msg.lineNumber - 1;// 0-based line numbering
              flawedTransferFunction.error[scope.ERROR.COMPILE].lineHandle = codeMirrorLineNumber;
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

        scope.resetListenerUnbindHandler = scope.$on('RESET', function (event, resetType) {
          if (resetType === RESET_TYPE.RESET_FULL)
          {
            scope.collabDirty = false;
            scope.transferFunctions = [];
          }
        });

        scope.control.refresh = function () {
          if (scope.collabDirty) {
            editorsServices.refreshAllEditors(scope.transferFunctions.map(function(tf) {return 'transfer-function-' + tf.id;}));
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
                  editorsServices.resetEditor(editorsServices.getEditor('transfer-function-' + transferFunction.id));
                } else if (!found) {
                  scope.transferFunctions.unshift(transferFunction);
                }
              });
              editorsServices.refreshAllEditors(scope.transferFunctions.map(function(tf) {return 'transfer-function-' + tf.id;}));
            });
            refreshPopulations();
        };

        // initialize transfer functions
        scope.control.refresh();

        function ensurePauseStateAndExecute(fn){
          var deferred = $q.defer();

          var restart = stateService.currentState === STATE.STARTED;
          stateService.ensureStateBeforeExecuting(STATE.PAUSED,
            function(){
              fn(function(){
                if (restart) {
                  return stateService.setCurrentState(STATE.STARTED);
                }
                deferred.resolve();
              });
            });

          return deferred.promise;
        }

        scope.cleanCompileError = function(transferFunction) {
          var compileError = transferFunction.error[scope.ERROR.COMPILE];
          var lineHandle = compileError ? compileError.lineHandle : undefined;
          if (angular.isDefined(lineHandle)) {
            var editor = editorsServices.getEditor('transfer-function-' + transferFunction.id);
            editor.removeLineClass(lineHandle, 'background', 'alert-danger');
          }
          delete transferFunction.error[scope.ERROR.COMPILE];
          delete transferFunction.error[scope.ERROR.NO_OR_MULTIPLE_NAMES];
        };

        scope.update = function(transferFunction) {
          return ensurePauseStateAndExecute(function(cb) {
            delete transferFunction.error[scope.ERROR.RUNTIME];
            delete transferFunction.error[scope.ERROR.LOADING];
            backendInterfaceService.setTransferFunction(transferFunction.id, transferFunction.code,
              function(){
                transferFunction.dirty = false;
                transferFunction.local = false;
                transferFunction.id = pythonCodeHelper.getFunctionName(transferFunction.code);
                scope.cleanCompileError(transferFunction);
                cb();
              },
              function(data) {
                serverError.displayHTTPError(data);
                cb();
              }
            );
          });
        };

        scope.onTransferFunctionChange = function (transferFunction) {
          transferFunction.name = pythonCodeHelper.getFunctionName(transferFunction.code);
          transferFunction.dirty = true;
          scope.collabDirty = environmentService.isPrivateExperiment();
          autoSaveService.setDirty(DIRTY_TYPE, scope.transferFunctions);
          if (transferFunction.local) {
            transferFunction.id = transferFunction.name;
          }
        };

        scope.delete = function (transferFunction) {
          if (transferFunction === undefined) return;
          var index = scope.transferFunctions.indexOf(transferFunction);
          if (transferFunction.local) {
            return scope.transferFunctions.splice(index, 1);
          } else {
            return ensurePauseStateAndExecute(function(cb) {
                backendInterfaceService.deleteTransferFunction(transferFunction.id, function() {
                  cb();
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
          scope.collabDirty = environmentService.isPrivateExperiment();
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
          var errors = false;
          scope.transferFunctions.forEach(function(tf) {
            if (Object.keys(tf.error).length !== 0){
              errors = true;
            }
          });
          if (errors){
            hbpDialogFactory.confirm({
                  title: "Transfer Function errors.",
                  template: "There are errors inside your Transfer Functions. Are you sure you want to save?",
                  confirmLabel: "Yes",
                  cancelLabel: 'No',
                  closable: false
                }).then(function(){
                  return saveErrorsService.saveDirtyData(DIRTY_TYPE, scope.transferFunctions)
                  .then(function(){
                    return autoSaveService.clearDirty(DIRTY_TYPE);
                  });
                })
                .finally(function(){
                  scope.isSavingToCollab = false;
                });
              return;
          }
          backendInterfaceService.saveTransferFunctions(
            simulationInfo.contextID,
            _.map(scope.transferFunctions, 'code'),
            function() { // Success callback
              scope.isSavingToCollab = false;
              scope.collabDirty = false;
              autoSaveService.clearDirty(DIRTY_TYPE);
              saveErrorsService.clearDirty(DIRTY_TYPE);
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
            var deferred = $q.defer();
            var textReader = new FileReader();
            textReader.onload = function(e) {
              ensurePauseStateAndExecute(function(cb) {
                  var content = e.target.result;
                  var loadedTransferFunctions = splitCodeFile(content);
                  // Removes all TFs
                  return $q.all(_.map(scope.transferFunctions, scope.delete))
                    .then(function(){
                      // Upload new TFs to back-end
                      scope.transferFunctions = loadedTransferFunctions;
                      return $q.all(scope.transferFunctions.map(function(tf) {
                        scope.onTransferFunctionChange(tf);
                        tf.id = tf.name;
                        tf.local = true;
                        return scope.update(tf);
                      }));
                    })
                  .then(cb);
                  })
                .then(deferred.resolve);
            };
            textReader.readAsText(file);
            return deferred.promise;
          }
        };

        saveErrorsService.registerCallback(DIRTY_TYPE, function(newTFs){
          scope.transferFunctions = newTFs;
        });

        autoSaveService.registerFoundAutoSavedCallback(DIRTY_TYPE, function(autoSaved){
          scope.collabDirty = true;
          scope.transferFunctions = autoSaved;
        });
      }
    };
  }]);
}());
