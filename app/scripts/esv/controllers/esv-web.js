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
    .controller('experimentCtrl', [
      '$scope',
      '$timeout',
      '$interval',
      '$location',
      'simulationService',
      'slurminfoService',
      'experimentSimulationService',
      'STATE',
      'OPERATION_MODE',
      'bbpConfig',
      'hbpIdentityUserDirectory',
      'simulationSDFWorld',
      function (
        $scope,
        $timeout,
        $interval,
        $location,
        simulationService,
        slurminfoService,
        experimentSimulationService,
        STATE,
        OPERATION_MODE,
        bbpConfig,
        hbpIdentityUserDirectory,
        simulationSDFWorld)
      {
        $scope.selectedIndex = -1;
        $scope.joinSelectedIndex = -1;
        $scope.startNewExperimentSelectedIndex = -1;
        $scope.isServerAvailable = {};
        $scope.isQueryingServersFinished = false;
        $scope.isDestroyed = false;
        $scope.STATE = STATE;
        $scope.OPERATION_MODE = OPERATION_MODE;
        $scope.updatePromise = undefined;
        $scope.updateUptimePromise = undefined;
        $scope.experiments = {};
        experimentSimulationService.getHealthyServers().then(function(servers){
          $scope.serverNames = servers;
        });
        $scope.serversEnabled = experimentSimulationService.getServersEnable();
        $scope.userID = undefined;
        $scope.clusterPartAvailInfo = undefined;
        if (!bbpConfig.get('localmode.forceuser', false)) {
          $scope.clusterPartAvailInfo = slurminfoService.get();
        }

        var ESV_UPDATE_RATE = 30 * 1000; //Update ESV-Web page every 30 seconds
        var UPTIME_UPDATE_RATE = 1000; //Update the uptime every second

        $scope.isEnvironmentDev = function () {
          var stage = bbpConfig.get('environment', 'development');
          return (stage !== 'staging') && (stage !== 'production');
        };

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

        $scope.startNewExperiment = function(configuration, serverPattern) {
          experimentSimulationService.startNewExperiment(configuration, null, serverPattern, $scope.setProgressbarInvisible);
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

        if (!bbpConfig.get('localmode.forceuser', false)) {
          hbpIdentityUserDirectory.getCurrentUser().then(function (profile) {
            $scope.userID = profile.id;
          }).then(function() {
              hbpIdentityUserDirectory.isGroupMember('hbp-sp10-user-edit-rights').then(function (result) {
                $scope.hasEditRights = result;
              });
            });
        } else {
          $scope.userID = bbpConfig.get('localmode.ownerID');
          $scope.hasEditRights = true;
        }

        // This function is called when all servers responded to the query of running experiments
        var getExperimentsFinishedCallback = function () {
          $scope.owners = simulationService().owners;
          $scope.uptime = simulationService().uptime;
          $scope.isQueryingServersFinished = true;

          // Schedule the update if the esv-web controller was not destroyed in the meantime
          if(!$scope.isDestroyed) {
            // Start to update the datastructure in regular intervals
            $scope.updatePromise = $timeout(function () {
              if (!bbpConfig.get('localmode.forceuser', false)) {
                $scope.clusterPartAvailInfo = slurminfoService.get();
              }
              experimentSimulationService.refreshExperiments(
                $scope.experiments,
                $scope.serversEnabled,
                setIsServerAvailable,
                getExperimentsFinishedCallback
              );

            }, ESV_UPDATE_RATE);
          }
        };

        // Set the progress message callback function
        experimentSimulationService.setProgressMessageCallback($scope.setProgressMessage);

        // Get the list of experiments from all the servers
        // $scope.experiments is the datastructure where all the templates and running experiments are stored
        experimentSimulationService.getExperiments($scope.experiments).then(function () {
          // After all promises are resolved we know that all requests have been processed.
          // Now we can see if there is a available Server
          experimentSimulationService.refreshExperiments(
            $scope.experiments,
            $scope.serversEnabled,
            setIsServerAvailable,
            getExperimentsFinishedCallback
          );
        });

        // Stop an already initialized or running experiment
        $scope.stopSimulation = function(simulation) {
          simulation.stopping = true;
          experimentSimulationService.stopExperimentOnServer($scope.experiments, simulation.serverID, simulation.simulationID);
        };

        $scope.uploadEnvironmentAndStart = function(experiment) {
          var inputElement = angular.element('<input type="file" />');
          inputElement.bind('change', function () {
            // Showing the progress bar
            $scope.setProgressbarVisible(experiment.id);
            // Uploading the SDF file
            var reader = new FileReader();
            reader.readAsText(inputElement[0].files[0], "UTF-8");
            reader.onload = function (evt) {
              experimentSimulationService.startNewExperiments(
                experiment.experimentConfiguration,
                evt.target.result,
                $scope.serversEnabled,
                experiment.serverPattern,
                $scope.setProgressbarInvisible
              );
            };
          });
          inputElement[0].click();
        };

        // clean up on leaving
        $scope.$on("$destroy", function () {
          $scope.isDestroyed = true;
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
