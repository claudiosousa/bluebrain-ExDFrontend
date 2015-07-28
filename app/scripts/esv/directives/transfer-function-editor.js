(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('transferFunctionEditor', ['$log', 'simulationTransferFunctions', function ($log, simulationTransferFunctions) {
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
