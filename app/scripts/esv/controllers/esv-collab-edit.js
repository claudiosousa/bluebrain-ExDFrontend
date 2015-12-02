(function () {
  'use strict';

  /* Controllers */
  /* global console: false */

  angular.module('exdFrontendApp')
    .controller('ESVCollabEditCtrl', [
                '$scope',
                '$stateParams',
                '$state',
                'experimentSimulationService',
                'bbpConfig',
                'collabConfigService',
                'serverError',
      function ($scope,
                $stateParams,
                $state,
                experimentSimulationService,
                bbpConfig,
                collabConfigService,
                serverError)
      {
        $scope.selectedIndex = -1;
        $scope.isQueryingServersFinished = false;
        $scope.isCloneRequested = false;
        $scope.experiments = {};
        $scope.serverNames = Object.keys(bbpConfig.get('api.neurorobotics'));
        $scope.serversEnabled = experimentSimulationService.getServersEnable();

        $scope.goToRegisteredState = function(experimentID) {
          $state.go('registered-esv-collab-edit', {ctx: $stateParams.ctx, experimentID: experimentID});
        };

        collabConfigService.get({contextID: $stateParams.ctx},
          function(response) {
            var experimentID = response.experimentID;
            if (experimentID !== '') {
              // Collab Edit page's context is already registered in the database.
              // Redirects to a view displaying the cloned experiment.
              $scope.goToRegisteredState(experimentID);
            }

            experimentSimulationService.getExperiments($scope.experiments).then(
            // This function is called when all servers responded to the query of running experiments
              function () {
                $scope.isQueryingServersFinished = true;
              }
            );
          },
          function(data) {
            $scope.isQueryingServersFinished = true;
            $scope.experiments = {
              error: {
                name: 'Internal Error',
                description: 'Database unavailable'
              }
            };
            serverError.display(data);
          }
        );

        $scope.setSelected = function (index) {
          $scope.selectedIndex = index;
        };

        $scope.cloneExperiment = function (experimentID) {
          $scope.isCloneRequested = true;
          collabConfigService.clone({contextID: $stateParams.ctx}, {experimentID: experimentID}, function(response) {
            $scope.goToRegisteredState(experimentID);
          });
        };
      }]);
}());
