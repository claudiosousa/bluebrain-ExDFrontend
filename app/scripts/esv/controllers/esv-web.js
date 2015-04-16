(function () {
  'use strict';

  /* Controllers */

  angular.module('exdFrontendApp')
  .filter('name_snippet', function() {
    return function (input, filter) {
      var output = [];
      var reFilter = new RegExp(filter, 'i');
      angular.forEach(input, function (exp) {
        if (exp.name.search(reFilter) !== -1 || exp.snippet.search(reFilter) !== -1 ) {
          output.push(exp);
        }
      });
      return output;
    };
  })
  .filter('convertToArray', function() {
    return function(items) {
      var output = [];
      angular.forEach(items, function(item, id) {
        item.id = id;
        output.push(item);
      });
      return output;
    };
  })
  .controller('experimentCtrl', ['$scope', '$rootScope', '$timeout', '$window', '$interval', 'simulationService', 'experimentSimulationService', 'STATE',
      function ($scope, $rootScope, $timeout, $window, $interval, simulationService,experimentSimulationService, STATE) {
    $rootScope.selectedIndex = -1;
    $rootScope.joinSelectedIndex = -1;
    $rootScope.startNewExperimentSelectedIndex = -1;
    $rootScope.isServerAvailable = false;
    $rootScope.isQueryingServersFinished = false;
    $rootScope.STATE = STATE;
    $rootScope.updatePromise = undefined;

    var ESV_UPDATE_RATE = 30 * 1000; //Update ESV-Web page every 30 seconds
    var UPTIME_UPDATE_RATE = 1000; //Update the uptime every second

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

    $scope.setProgressbarInvisible = function() {
      $rootScope.joinSelectedIndex = -1;
      $rootScope.startNewExperimentSelectedIndex = -1;
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
      experimentSimulationService.startNewExperiments(id, $scope.setProgressbarInvisible);
    };

    $scope.joinExperiment = function(url) {
      var message = 'Joining experiment ' + url;
      $scope.setProgressMessage({main: message});
      // Due to reconnection issues in gz3d, we do force a reload here.
      $window.location.href = url;
      $window.location.reload();
    };

    experimentSimulationService.setInitializedCallback($scope.joinExperiment);

    var setIsServerAvailable = function(isAvailable){
      $rootScope.isServerAvailable = isAvailable;
    };

    experimentSimulationService.getExperiments(
      $scope.setProgressMessage,
      function (data) {
        $interval(simulationService().updateUptime, UPTIME_UPDATE_RATE);
        $scope.experiments = data;
        $scope.owners = simulationService().owners;
        $scope.uptime = simulationService().uptime;
      },
      function() {
        $rootScope.isQueryingServersFinished = true;
        $rootScope.updatePromise = $interval(function(){
          experimentSimulationService.refreshExperiments($scope.experiments, setIsServerAvailable);
        }, ESV_UPDATE_RATE);
    });

    experimentSimulationService.existsAvailableServer(setIsServerAvailable);

    // clean up on leaving
    $scope.$on("$destroy", function() {
      if (angular.isDefined($rootScope.updatePromise)) {
        $interval.cancel($rootScope.updatePromise);
        $rootScope.updatePromise = undefined;
      }
    });

  }]);
}());
