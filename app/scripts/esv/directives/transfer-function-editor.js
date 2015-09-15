(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('transferFunctionEditor', [
      '$log',
      'backendInterfaceService',
      'STATE',
      'stateService',
      'pythonCodeHelper',
      'HELP_BASE_URL',
      'roslib',
      'serverError',
      '$timeout',
      'documentationURLs',
    function (
        $log,
        backendInterfaceService,
        STATE,
        stateService,
        pythonCodeHelper,
        HELP_BASE_URL,
        roslib,
        serverError,
        $timeout,
        documentationURLs
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

        documentationURLs.getDocumentationURLs().then(function(data) {
          scope.cleDocumentationURL = data.cleDocumentationURL;
        });

        scope.getTransferFunctionEditor = function(transferFunction) {
          if (angular.isDefined(transferFunction.editor)) {
            return transferFunction.editor;
          }
          var codeMirrorCollection = document.getElementsByClassName('CodeMirror');
          var transferFunctionDivs = _.filter(codeMirrorCollection,
            function(e){
               return e.nodeName === 'DIV';
            }
          );
          var transferFunctionIndex = _.indexOf(scope.transferFunctions, transferFunction);
          var codeMirrorDiv = transferFunctionDivs[transferFunctionIndex];
          transferFunction.editor = codeMirrorDiv.CodeMirror;
          return transferFunction.editor;
        };

        scope.onNewErrorMessageReceived = function(msg) {
          var flawedTransferFunction = _.find(scope.transferFunctions, {'functionName':  msg.functionName});
          flawedTransferFunction.error = { message: msg.message };
          if (msg.lineNumber >= 0) { // Python Syntax Error
            // Error line highlighting
            var editor = scope.getTransferFunctionEditor(flawedTransferFunction);
            var codeMirrorLineNumber = msg.lineNumber - 1;// 0-based line numbering
            flawedTransferFunction.error.lineHandle = editor.getLineHandle(codeMirrorLineNumber);
            editor.addLineClass(codeMirrorLineNumber, 'background', 'alert alert-danger');
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
                transferFunction.editor = undefined;
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
          var editor = scope.getTransferFunctionEditor(transferFunction);
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
              backendInterfaceService.setTransferFunction(transferFunction.id, transferFunction.code,
                function(){
                  transferFunction.dirty = false;
                  if (angular.isDefined(transferFunction.error)) {
                    scope.cleanError(transferFunction);
                  }
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

        var tfCodeMarkupBegin = "#--code-begin--\n";
        var tfCodeMarkupEnd = "#--code-end--\n";
        var buildTransferFunctionFile = function(transferFunctions) {
          var codeText = "";
          transferFunctions.forEach(function(tf) {
            codeText = codeText.concat(tfCodeMarkupBegin);
            codeText = codeText.concat(tf.code + "\n");
            codeText = codeText.concat(tfCodeMarkupEnd + "\n");
          });
          return codeText;
        };

        scope.save = function () {
          var file = new Blob([
            buildTransferFunctionFile(scope.transferFunctions)
          ], {type: "plain/text", endings: 'native'});

          var button = angular.element(document.querySelector('#save-transfer-functions'));
          button.attr("href", URL.createObjectURL(file));
        };

        scope.loadTransferFunctions = function(file) {
          if (file && !file.$error) {
            var textReader = new FileReader();
            textReader.onload = function(e) {
              $timeout(function() {
                var contents = e.target.result;
                var regexCode = new RegExp(tfCodeMarkupBegin + "([^]*?)" + tfCodeMarkupEnd,"g");

                var tfCode = contents.match(regexCode);

                var loadedTransferFunctions = _.map(tfCode, function(code, idx) {
                  var codeLength = tfCode[idx].length - tfCodeMarkupBegin.length - tfCodeMarkupEnd.length;
                  return {
                    code: tfCode[idx].substr(tfCodeMarkupBegin.length, codeLength),
                    dirty: true,
                    local: true
                  };
                });

                if (scope.transferFunction) {
                  scope.transferFunctions.forEach(function(tf) {
                    scope.delete(tf);
                  });
                }

                scope.transferFunctions = loadedTransferFunctions;
                scope.transferFunctions.forEach(function(tf) {
                  scope.onTransferFunctionChange(tf);
                  tf.id = tf.functionName;
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
