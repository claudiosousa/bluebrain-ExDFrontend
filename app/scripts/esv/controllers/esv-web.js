(function () {
  'use strict';

  /* Controllers */

  angular.module('exdFrontendApp')
    .filter('nameSnippet', function () {
      return function (input, filter) {
        var output = [];
        var reFilter = new RegExp(filter, 'i');
        angular.forEach(input, function (exp) {
          if (exp.name.search(reFilter) !== -1 || exp.description.search(reFilter) !== -1) {
            output.push(exp);
          }
        });
        return output;
      };
    })
    .filter('convertToArray', function () {
      return function (items) {
        var output = [];
        angular.forEach(items, function (item, id) {
          item.id = id;
          output.push(item);
        });
        return output;
      };
    })
    .filter('byMaturity', function ($filter) {
      return function (input, isDev) {
        if (isDev) {
          return $filter('filter')(input, {maturity: '!production'}, true);
        }
        else {
          return $filter('filter')(input, {maturity: 'production'}, true);
        }
      };
    })
    .controller('experimentCtrl', ['$scope', '$timeout', '$interval', '$location', 'simulationService', 'experimentSimulationService', 'STATE', 'OPERATION_MODE', 'bbpConfig', 'hbpUserDirectory',
      function ($scope, $timeout, $interval, $location, simulationService, experimentSimulationService, STATE, OPERATION_MODE, bbpConfig, hbpUserDirectory) {
        $scope.selectedIndex = -1;
        $scope.joinSelectedIndex = -1;
        $scope.startNewExperimentSelectedIndex = -1;
        $scope.isServerAvailable = {};
        $scope.isQueryingServersFinished = false;
        $scope.STATE = STATE;
        $scope.OPERATION_MODE = OPERATION_MODE;
        $scope.updatePromise = undefined;
        $scope.updateUptimePromise = undefined;
        $scope.experiments = {};
        $scope.serverNames = Object.keys(bbpConfig.get('api.neurorobotics'));
        $scope.serversEnabled = experimentSimulationService.getServersEnable();
        $scope.userID = undefined;

        var ESV_UPDATE_RATE = 30 * 1000; //Update ESV-Web page every 30 seconds
        var UPTIME_UPDATE_RATE = 1000; //Update the uptime every second

        $scope.setSelected = function (index) {
          if ($scope.startNewExperimentSelectedIndex !== -1) {
            return;
          }
          if (index !== $scope.selectedIndex) {
            $scope.selectedIndex = index;
            $scope.joinSelectedIndex = -1;
            $scope.startNewExperimentSelectedIndex = -1;
          }
        };

        $scope.setJoinableVisible = function (index) {
          $scope.joinSelectedIndex = index;
          $scope.startNewExperimentSelectedIndex = -1;
        };

        $scope.setProgressbarVisible = function (index) {
          $scope.joinSelectedIndex = -1;
          $scope.startNewExperimentSelectedIndex = index;
        };

        $scope.setProgressbarInvisible = function () {
          $scope.joinSelectedIndex = -1;
          $scope.startNewExperimentSelectedIndex = -1;
        };

        $scope.setProgressMessage = function (msg) {
          // $timeout is used to use apply() even if apply is already in progress
          $timeout(function () {
            $scope.$apply(function () {
              $scope.progressMessageMain = msg.main ? msg.main : '';
              $scope.progressMessageSub = msg.sub ? msg.sub : '';
            });
          });
        };

        $scope.toggleServer = function (server) {
          var idx = $scope.serversEnabled.indexOf(server);
          if (idx > -1) {
            $scope.serversEnabled.splice(idx, 1);
          } else {
            $scope.serversEnabled.push(server);
          }

          experimentSimulationService.refreshExperiments($scope.experiments, $scope.serversEnabled, setIsServerAvailable);
          localStorage.setItem('server-enabled', angular.toJson($scope.serversEnabled));
        };

        $scope.startNewExperiment = function (configuration, serverPattern) {
          experimentSimulationService.setShouldLaunchInEditMode(false);
          experimentSimulationService.startNewExperiments(configuration, $scope.serversEnabled, serverPattern, $scope.setProgressbarInvisible);
        };

        $scope.enterEditMode = function (configuration, serverPattern) {
          experimentSimulationService.setShouldLaunchInEditMode(true);
          experimentSimulationService.startNewExperiments(configuration, $scope.serversEnabled, serverPattern, $scope.setProgressbarInvisible);
        };

        $scope.joinExperiment = function (url) {
          var message = 'Joining experiment ' + url;
          $scope.setProgressMessage({main: message});
          $location.path(url);
        };

        experimentSimulationService.setInitializedCallback($scope.joinExperiment);

        var setIsServerAvailable = function (id, isAvailable) {
          $scope.isServerAvailable[id] = isAvailable;
        };

        // We store this promise in the scope in order to be able to cancel the interval later
        $scope.updateUptimePromise = $interval(function () {
          simulationService().updateUptime();
        }, UPTIME_UPDATE_RATE);

        hbpUserDirectory.getCurrentUser().then(function (profile) {
          $scope.userID = profile.id;
        });

        experimentSimulationService.getExperiments(
          // This is the datastructure where all the templates and running experiments are stored
          $scope.experiments,
          $scope.serversEnabled,
          // Pass function to display the progress messages
          $scope.setProgressMessage,
          // This function is called when all servers responded to the query of running experiments
          function () {
            $scope.owners = simulationService().owners;
            $scope.uptime = simulationService().uptime;
            $scope.isQueryingServersFinished = true;
            // Start to update the datastructure in regular intervals
            $scope.updatePromise = $timeout(function () {
              experimentSimulationService.refreshExperiments($scope.experiments, $scope.serversEnabled, setIsServerAvailable);
            }, ESV_UPDATE_RATE);
          },
          setIsServerAvailable);

        // clean up on leaving
        $scope.$on("$destroy", function () {
          if (angular.isDefined($scope.updatePromise)) {
            $timeout.cancel($scope.updatePromise);
            $scope.updatePromise = undefined;
          }
          if (angular.isDefined($scope.updateUptimePromise)) {
            $interval.cancel($scope.updateUptimePromise);
            $scope.updateUptimePromise = undefined;
          }
          // Deregister the initialized callback
          experimentSimulationService.setInitializedCallback(undefined);
        });

      }]);
}());
