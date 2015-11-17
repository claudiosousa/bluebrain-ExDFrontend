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
            window.parent.postMessage({
              apiVersion: 0,
              eventName: 'workspace.switchMode',
              data: {
                mode: 'run'
              }
            }, "*");
          });
        };
      }]);
}());
