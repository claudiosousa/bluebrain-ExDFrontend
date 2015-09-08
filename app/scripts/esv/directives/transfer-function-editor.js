(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
    .constant('HELP_BASE_URL', "https://developer.humanbrainproject.eu/docs"
  );

  angular.module('exdFrontendApp').directive('transferFunctionEditor', [
      '$log',
      'backendInterfaceService',
      'nrpBackendVersions',
      'STATE',
      'stateService',
      'pythonCodeHelper',
      'HELP_BASE_URL',
      'roslib',
    function (
        $log, 
        backendInterfaceService, 
        nrpBackendVersions, 
        STATE, stateService, 
        pythonCodeHelper, 
        HELP_BASE_URL,
        roslib
    ) {
    return {
      templateUrl: 'views/esv/transfer-function-editor.html',
      restrict: 'E',
      scope: {
        control: '='
      },
      link: function (scope, element, attrs) {

        scope.editorOptions = {
          lineWrapping : true,
          lineNumbers: true,
          readOnly: false,
          mode: 'text/x-python'
        };

        scope.stateService = stateService;
        scope.STATE = STATE;

        scope.transferFunctions = [];
        var addedTransferFunctionCount = 0;

        scope.cleDocumentationURL = HELP_BASE_URL + "/hbp-nrp-cle/latest/";

        nrpBackendVersions(backendInterfaceService.getServerBaseUrl()).get(function(data) {
          var documentationVersion = "";
          if ("hbp_nrp_cle_components" in data) {
            documentationVersion = data.hbp_nrp_cle_components.major + "." + data.hbp_nrp_cle_components.minor + ".";
            // dev version, we take the previous patch version
            // WARNING: This does not work if the patch version is 0. We assume that X.X.0.devX will never exists
            // (in other words if the minor change, then the first dev version has to be X.X.1.dev0).
            if ("dev" in data.hbp_nrp_cle_components) {
              if (data.hbp_nrp_cle_components.patch !== 0) {
                documentationVersion = documentationVersion.concat((parseInt(data.hbp_nrp_cle_components.patch) - 1).toString());
              }
              else {
                $log.error("Help URL cannot be computed for dev version" + data.hbp_nrp_cle);
                documentationVersion = "latest";
              }
            }
            else {
              documentationVersion = documentationVersion.concat(data.hbp_nrp_cle_components.patch);
            }
            scope.cleDocumentationURL = HELP_BASE_URL + "/projects/hbp-nrp-cle/" + documentationVersion;
          }
        });

        scope.onNewErrorMessageReceived = function(msg) {
          var flawedTransferFunction = _.find(scope.transferFunctions, {'functionName':  msg.functionName});
          flawedTransferFunction.error = { message: msg.message };
          if (msg.lineNumber >= 0) { // Python Syntax Error
            var codeMirrorCollection = document.getElementsByClassName('CodeMirror');
            var transferFunctionDivs = _.filter(codeMirrorCollection, 
              function(e){
                 return e.nodeName === 'DIV';
              }
            );
            // Error line highlighting
            var flawedTransferFunctionIndex = _.indexOf(scope.transferFunctions, flawedTransferFunction);
            var codeMirrorDiv = transferFunctionDivs[flawedTransferFunctionIndex];
            var editor = codeMirrorDiv.CodeMirror;
            var codeMirrorLineNumber = msg.lineNumber - 1;// 0-based line numbering
            flawedTransferFunction.error.lineHandle = editor.getLineHandle(codeMirrorLineNumber);
            editor.addLineClass(codeMirrorLineNumber, 'background', 'alert alert-danger');
            flawedTransferFunction.editor = editor;
          }
        };

        var rosConnection = roslib.getOrCreateConnectionTo(attrs.server);
        scope.errorTopicSubscriber = roslib.createTopic(rosConnection, attrs.topic, 'cle_ros_msgs/CLEError');
        scope.errorTopicSubscriber.subscribe(scope.onNewErrorMessageReceived);



        scope.control.refresh = function () {
          backendInterfaceService.getTransferFunctions(
            function (data) {
              for (var i = 0; i < data.length; i = i + 1) {
                var transferFunction = {};
                transferFunction.code = data[i];
                transferFunction.dirty = false;
                transferFunction.local = false;
                transferFunction.functionName = transferFunction.id = pythonCodeHelper.getFunctionName(data[i]);
                if (transferFunction.functionName) {
                  // If we already have local changes, we do not update
                  var foundIndex = -1;
                  for (var j = 0, len = scope.transferFunctions.length; j < len; j = j + 1) {
                    if (scope.transferFunctions[j].id === transferFunction.functionName) {
                      foundIndex = j;
                      break;
                    }
                  }
                  if (foundIndex >= 0 && !scope.transferFunctions[foundIndex].dirty)
                  {
                    scope.transferFunctions[foundIndex] = transferFunction;
                  } else if (foundIndex < 0) {
                    scope.transferFunctions.unshift(transferFunction);
                  }
                }
              }
          });
        };

        scope.cleanError = function(transferFunction) {     
          var editor = transferFunction.editor;
          var lineHandle = transferFunction.error.lineHandle;
          if (angular.isDefined(editor) && angular.isDefined(lineHandle)) {
            editor.removeLineClass(lineHandle, 'background', 'alert alert-danger');
          }
          transferFunction.error = undefined;
        };

        scope.update = function (transferFunction) {
          var restart = stateService.currentState === STATE.STARTED;
          stateService.ensureStateBeforeExecuting(
            STATE.PAUSED,
            function() {
                backendInterfaceService.setTransferFunction(transferFunction.id, transferFunction.code, function(){
                  transferFunction.dirty = false;
                  if (angular.isDefined(transferFunction.error)) { 
                    scope.cleanError(transferFunction);
                  }
                  if (restart) {
                    stateService.setCurrentState(STATE.STARTED);
                  }
                }
              );
            }
          );
        };

        scope.onTransferFunctionChange = function (transferFunction) {
          transferFunction.functionName = pythonCodeHelper.getFunctionName(transferFunction.code);
          transferFunction.dirty = true;
        };

        scope.delete = function (transferFunction) {
          if (transferFunction.local) {
            var index = scope.transferFunctions.indexOf(transferFunction);
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
                var index = scope.transferFunctions.indexOf(transferFunction);
                scope.transferFunctions.splice(index, 1);
              }
            );
          }
        };


        scope.create = function () {
          var transferFunction = {};
          var name = "transferfunction_" + addedTransferFunctionCount;
          transferFunction.code = "@nrp.Robot2Neuron()\ndef " + name + "(t):\n    print \"Hello world at time \" + str(t)";
          transferFunction.functionName = name;
          transferFunction.dirty = true;
          transferFunction.local = true;
          transferFunction.id = name;
          scope.transferFunctions.unshift(transferFunction);
          addedTransferFunctionCount = addedTransferFunctionCount + 1;
        };

      }
    };
  }]);
}());
