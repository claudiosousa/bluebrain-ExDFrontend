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
                'slurminfoService',
                'bbpConfig',
                'collabConfigService',
                'serverError',
                'hbpIdentityUserDirectory',
      function ($scope,
                $stateParams,
                $state,
                experimentSimulationService,
                slurminfoService,
                bbpConfig,
                collabConfigService,
                serverError,
                hbpIdentityUserDirectory)
      {
        $scope.selectedIndex = -1;
        $scope.isQueryingServersFinished = false;
        $scope.isCloneRequested = false;
        $scope.experiments = {};
        experimentSimulationService.getHealthyServers().then(function (servers) {
          $scope.serverNames = servers;
        });

        $scope.serversEnabled = experimentSimulationService.getServersEnable();
        if (!bbpConfig.get('localmode.forceuser', false)) {
          $scope.clusterPartAvailInfo = slurminfoService.get();
        }

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

        hbpIdentityUserDirectory.isGroupMember('hbp-sp10-user-edit-rights').then(function (result) {
          $scope.hasEditRights = result;
        });

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
