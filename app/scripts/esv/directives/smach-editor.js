(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('smachEditor', ['$log', 'simulationStateMachineScripts',
    function ($log, simulationStateMachineScripts) {
      return {
        templateUrl: 'views/esv/smach-editor.html',
        restrict: 'E',
        link: function (scope, element, attrs) {
          if (!attrs.server) {
            $log.error('The server URL was not specified!');
          }

          if (!attrs.simulation) {
            $log.error('The simulationID was not specified!');
          }

          // Stop any further initialization
          if (!attrs.server || !attrs.simulation) {
            return;
          }

          var serverBaseUrl = attrs.server;
          var simulationID = attrs.simulation;

          scope.smachCodes = {};

          scope.smachEditorRefresh = function () {
            simulationStateMachineScripts(serverBaseUrl).get({sim_id: simulationID}, function (response) {
              scope.smachCodes = response.data;
            });
          };

          scope.update = function (name) {
            simulationStateMachineScripts(serverBaseUrl).put({
              sim_id: simulationID,
              state_machine_name: name
            }, scope.smachCodes[name]);
          };

        }
      };
    }]);
}());
