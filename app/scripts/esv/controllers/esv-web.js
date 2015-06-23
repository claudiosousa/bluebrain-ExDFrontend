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
  .filter('byLocation', function($filter) {
    return function(input, pattern, doApply) {
      if (!doApply) {
        return input;
      }
      else {
        return $filter('filter')(input, { serverPattern: pattern}, true);
      }
    };
  })
  .controller('experimentCtrl', ['$scope', '$rootScope', '$timeout', '$location', '$interval', 'simulationService', 'experimentSimulationService', 'STATE', 'OPERATION_MODE',
      function ($scope, $rootScope, $timeout, $location, $interval, simulationService, experimentSimulationService, STATE, OPERATION_MODE) {
    $rootScope.selectedIndex = -1;
    $rootScope.joinSelectedIndex = -1;
    $rootScope.startNewExperimentSelectedIndex = -1;
    $rootScope.isServerAvailable = {};
    $rootScope.isQueryingServersFinished = false;
    $rootScope.STATE = STATE;
    $scope.OPERATION_MODE = OPERATION_MODE;
    $rootScope.updatePromise = undefined;
    $rootScope.updateUptimePromise = undefined;

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

    $scope.startNewExperiment = function(configuration, serverPattern) {
      experimentSimulationService.setShouldLaunchInEditMode(false);
      experimentSimulationService.startNewExperiments(configuration, serverPattern, $scope.setProgressbarInvisible);
    };

    $scope.enterEditMode = function(configuration, serverPattern) {
      experimentSimulationService.setShouldLaunchInEditMode(true);
      experimentSimulationService.startNewExperiments(configuration, serverPattern, $scope.setProgressbarInvisible);
    };

    $scope.joinExperiment = function(url) {
      var message = 'Joining experiment ' + url;
      $scope.setProgressMessage({main: message});
      $location.path(url);
    };

    experimentSimulationService.setInitializedCallback($scope.joinExperiment);

    var setIsServerAvailable = function(id, isAvailable){
      $rootScope.isServerAvailable[id] = isAvailable;
    };

    experimentSimulationService.getExperiments(
      $scope.setProgressMessage,
      function (data) {
        $rootScope.updateUptimePromise = $interval(simulationService().updateUptime, UPTIME_UPDATE_RATE);
        $scope.experiments = data;
        $scope.owners = simulationService().owners;
        $scope.uptime = simulationService().uptime;
      },
      function() {
        $rootScope.isQueryingServersFinished = true;
        $rootScope.updatePromise = $interval(function(){
          experimentSimulationService.refreshExperiments($scope.experiments, setIsServerAvailable);
        }, ESV_UPDATE_RATE);
      },
      setIsServerAvailable);

    // clean up on leaving
    $scope.$on("$destroy", function() {
      if (angular.isDefined($rootScope.updatePromise)) {
        $interval.cancel($rootScope.updatePromise);
        $rootScope.updatePromise = undefined;
      }
      if (angular.isDefined($rootScope.updateUptimePromise)) {
        $interval.cancel($rootScope.updateUptimePromise);
        $rootScope.updateUptimePromise = undefined;
      }
    });

  }]);
}());
