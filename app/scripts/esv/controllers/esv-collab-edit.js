(function () {
  'use strict';

  /* Controllers */
  /* global console: false */

  angular.module('exdFrontendApp')
    .controller('ESVCollabEditCtrl', ['$scope', '$stateParams', '$state',
                'experimentSimulationService', 'bbpConfig', 'collabConfigService',
      function ($scope, $stateParams, $state, experimentSimulationService,
                bbpConfig, collabConfigService) {
        $scope.selectedIndex = -1;
        $scope.isQueryingServersFinished = false;
        $scope.experiments = {};
        $scope.serverNames = Object.keys(bbpConfig.get('api.neurorobotics'));
        $scope.serversEnabled = experimentSimulationService.getServersEnable();

        $scope.setSelected = function (index) {
          $scope.selectedIndex = index;
        };

        experimentSimulationService.getExperiments(
          // This is the datastructure where all the templates and running experiments are stored
          $scope.experiments,
          $scope.serversEnabled,
          undefined,
          // This function is called when all servers responded to the query of running experiments
          function () {
            $scope.isQueryingServersFinished = true;
          },
          undefined);

        $scope.cloneExperiment = function (experimentId) {
          collabConfigService.clone({contextId: $stateParams.ctx}, {experimentId: experimentId}, function(response) {
            // Switch to the RUN-state and hand over the contextID
            $state.go('esv-collab-run', {ctx: $stateParams.ctx});
          });
        };
      }]);
}());
