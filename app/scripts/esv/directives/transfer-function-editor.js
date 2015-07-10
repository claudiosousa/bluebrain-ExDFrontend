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

        scope.transferFunctions = [];

        simulationTransferFunctions(serverBaseUrl).transferFunctions({sim_id: simulationID}, function(data){
          scope.transferFunctions = data.transfer_functions;
        });

      }
    };
  }]);
}());
