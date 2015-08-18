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
    function ($log, backendInterfaceService, nrpBackendVersions, STATE, stateService, pythonCodeHelper, HELP_BASE_URL) {
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

        scope.transferFunctions = {};
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

        scope.control.refresh = function () {
          backendInterfaceService.getTransferFunctions(
            function (data) {
              for (var i = 0; i < data.length; i = i + 1) {
                var transferFunction = {};
                transferFunction.code = data[i];
                transferFunction.dirty = false;
                transferFunction.local = false;
                var functionName = pythonCodeHelper.getFunctionName(data[i]);
                if (functionName) {
                  // If we already have local changes, we do not update
                  if (!(scope.transferFunctions[functionName] && scope.transferFunctions[functionName].dirty))
                  {
                    scope.transferFunctions[functionName] = transferFunction;
                    scope.transferFunctions[functionName].functionName = functionName;
                  }
                }
              }
          });
        };

        scope.update = function (name) {
          stateService.ensureStateBeforeExecuting(
            STATE.PAUSED,
            function() {
                backendInterfaceService.setTransferFunction(name, scope.transferFunctions[name].code, function(){
                  scope.transferFunctions[name].dirty = false;
                });
            }
          );
        };

        scope.onTransferFunctionChange = function (name) {
          scope.transferFunctions[name].functionName = pythonCodeHelper.getFunctionName(scope.transferFunctions[name].code);
          scope.transferFunctions[name].dirty = true;
        };

        scope.delete = function (name) {
          if (scope.transferFunctions[name].local) {
            delete scope.transferFunctions[name];
          } else {
            stateService.ensureStateBeforeExecuting(
              STATE.PAUSED,
              function () {
                backendInterfaceService.deleteTransferFunction(name);
                delete scope.transferFunctions[name];
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
          scope.transferFunctions[name] = transferFunction;
          addedTransferFunctionCount = addedTransferFunctionCount + 1;
        };

      }
    };
  }]);
}());
