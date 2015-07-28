(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
    .constant('HELP_BASE_URL', "https://developer.humanbrainproject.eu/docs"
  );

  angular.module('exdFrontendApp').directive('transferFunctionEditor', ['$log', 'simulationTransferFunctions', 'nrpBackendVersions', 'HELP_BASE_URL', function ($log, simulationTransferFunctions, nrpBackendVersions, HELP_BASE_URL) {
    return {
      templateUrl: 'views/esv/transfer-function-editor.html',
      restrict: 'E',
      link: function (scope, element, attrs) {
        if(!attrs.server) {
          $log.error('The server URL was not specified!');
        }

        if(!attrs.simulation) {
          $log.error('The simulationID was not specified!');
        }

        // Stop any further initialization
        if (!attrs.server || !attrs.simulation) {
          return;
        }

        var serverBaseUrl = attrs.server;
        var simulationID = attrs.simulation;

        scope.transferFunctions = {};

        scope.cleDocumentationURL = HELP_BASE_URL + "/hbp-nrp-cle/latest/";

        nrpBackendVersions(serverBaseUrl).get(function(data) {
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
              }
            }
            else {
              documentationVersion = documentationVersion.concat(data.hbp_nrp_cle_components.patch);
            }
            scope.cleDocumentationURL = HELP_BASE_URL + "/projects/hbp-nrp-cle/" + documentationVersion;
          }
        });

        simulationTransferFunctions(serverBaseUrl).transferFunctions({sim_id: simulationID}, function(data){
          for (var i = 0; i < data.length; i = i+1)
          {
            var transferFunction = {};
            transferFunction.code = data[i];
            // Kind of weird, but if we move that up it produces random bugs.
            var transferFunctionNameRegExp = /^.*def\s+(\w+)\s*\(.*/gm;
            var matches = transferFunctionNameRegExp.exec(data[i]);
            if (matches) {
              scope.transferFunctions[matches[1]] = transferFunction;
            }
          }
        });

        scope.update = function (name) {
          simulationTransferFunctions(serverBaseUrl).patch({sim_id: simulationID, transfer_function_name: name}, scope.transferFunctions[name].code);
        };
      }
    };
  }]);
}());
