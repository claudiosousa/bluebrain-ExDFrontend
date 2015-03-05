(function () {
  'use strict';

  /* Controllers */

  angular.module('exdFrontendApp')
  .filter('name_snippet', function() {
    return function (input, filter) {
      var output = {};
      var reFilter = new RegExp(filter, 'i');
      angular.forEach(input, function (exp, id) {
        if (exp.name.search(reFilter) !== -1 || exp.snippet.search(reFilter) !== -1 ) {
          output[id] = exp;
        }
      });
      return output;
    };
  })
  .controller('experimentCtrl', ['$scope', '$rootScope', '$timeout', '$window', 'simulationService', 'experimentSimulationService', function ($scope, $rootScope, $timeout, $window, simulationService,experimentSimulationService) {
    $rootScope.selectedIndex = -1;
    $rootScope.joinSelectedIndex = -1;
    $rootScope.startNewExperimentSelectedIndex = -1;

    $scope.setSelected = function(index) {
      if ($rootScope.startNewExperimentSelectedIndex !== -1) {
        return;
      }
      if (index !== $rootScope.selectedIndex) {
        $rootScope.selectedIndex = index;
        $rootScope.joinSelectedIndex = -1;
        $rootScope.startNewExperimentSelectedIndex = -1;
      }
    };

    $scope.setJoinableVisible = function(index) {
      $rootScope.joinSelectedIndex = index;
      $rootScope.startNewExperimentSelectedIndex = -1;
    };

    $scope.setProgressbarVisible = function(index) {
      $rootScope.joinSelectedIndex = -1;
      $rootScope.startNewExperimentSelectedIndex = index;
    };

    $scope.setProgressMessage = function(msg){
      // $timeout is used to use apply() even if apply is already in progress
      $timeout(function(){
        $scope.$apply(function () {
          $scope.progressMessageMain = msg.main ? msg.main : '';
          $scope.progressMessageSub = msg.sub ? msg.sub : '';
        });
      });
    };

    $scope.startNewExperiment = function(id) {
      experimentSimulationService.startNewExperiments(id);
    };

    $scope.joinExperiment = function(url) {
      $scope.setProgressMessage({main: url});
      // Due to reconnection issues in gz3d, we do force a reload here.
      $window.location.href = url;
      $window.location.reload();

    };

    experimentSimulationService.setInitializedCallback($scope.joinExperiment);

    experimentSimulationService.getExperiments($scope.setProgressMessage, function (data) {
      $scope.experiments = data;
      $scope.owners = simulationService().owners;
    });
  }]);
}());
