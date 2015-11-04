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

        experimentSimulationService.getExperiments($scope.experiments).then(
          // This function is called when all servers responded to the query of running experiments
          function () {
            $scope.isQueryingServersFinished = true;
          }
        );

        $scope.cloneExperiment = function (experimentId) {
          collabConfigService.clone({contextId: $stateParams.ctx}, {experimentId: experimentId}, function(response) {
            // Switch to the RUN-state and hand over the contextID
            $state.go('esv-collab-run', {ctx: $stateParams.ctx});
          });
        };
      }]);
}());
