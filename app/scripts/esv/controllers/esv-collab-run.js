(function () {
  'use strict';

  /**
   * # ESVCollabRunCtrl
   * Controller of the Collab edit and run pages
   * It allows to launch a registered Collab experiment
   */

  angular.module('exdFrontendApp').controller('ESVCollabRunCtrl',
    [
    '$q',
    '$scope',
    '$timeout',
    '$interval',
    '$location',
    'simulationService',
    'slurminfoService',
    'experimentSimulationService',
    'STATE',
    'bbpConfig',
    'hbpIdentityUserDirectory',
    'simulationSDFWorld',
    '$stateParams',
    'collabConfigService',
    'serverError',
    'collabFolderAPIService',
      function (
        $q,
        $scope,
        $timeout,
        $interval,
        $location,
        simulationService,
        slurminfoService,
        experimentSimulationService,
        STATE,
        bbpConfig,
        hbpIdentityUserDirectory,
        simulationSDFWorld,
        $stateParams,
        collabConfigService,
        serverError,
        collabFolderAPIService
      ) {
        $scope.joinSelected = false;
        $scope.startNewExperimentSelected = false;
        $scope.isServerAvailable = {};
        $scope.isQueryingServersFinished = false;
        $scope.isDestroyed = false;
        $scope.STATE = STATE;
        $scope.updatePromise = undefined;
        $scope.updateUptimePromise = undefined;
        $scope.experiments = {};
        $scope.serversEnabled = experimentSimulationService.getServersEnable();
        if (!bbpConfig.get('localmode.forceuser', false)) {
          $scope.clusterPartitionInfo = slurminfoService.get();
        }

        var loadHealthyServers = function () {
          experimentSimulationService.getHealthyServers().then(function (servers) {
            $scope.serverNames = servers;
          });
        };

        loadHealthyServers();


        $scope.userID = undefined;

        var ESV_UPDATE_RATE = 30 * 1000; //Update ESV-Web page every 30 seconds
        var UPTIME_UPDATE_RATE = 1000; //Update the uptime every second

        $scope.setJoinableVisible = function() {
          $scope.joinSelected = true;
          $scope.startNewExperimentSelected = false;
        };

        $scope.setProgressbarVisible = function() {
          $scope.joinSelected = false;
          $scope.startNewExperimentSelected = true;
        };

        $scope.setProgressbarInvisible = function () {
          $scope.joinSelected = false;
          $scope.startNewExperimentSelected = true;
          loadHealthyServers();
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

          experimentSimulationService.refreshExperiments(
            $scope.experiments, $scope.serversEnabled, setIsServerAvailable
          );
          localStorage.setItem('server-enabled', angular.toJson($scope.serversEnabled));
        };

        $scope.startNewExperiment = function(configuration, servers) {
          experimentSimulationService.startNewExperiment(
            configuration, null, servers, $scope.setProgressbarInvisible);
        };

        $scope.joinExperiment = function(url) {
          var message = 'Joining experiment ' + url;
          $scope.setProgressMessage({main: message});
          $location.path(url); // changing page --> esv-web/gz3d-view/*/*/*?ctx=*
        };

        // Stop an already initialized or running experiment
        $scope.stopSimulation = function(simulation) {
          simulation.stopping = true;
          experimentSimulationService.stopExperimentOnServer($scope.experiments, simulation.serverID, simulation.simulationID).then(function() {
            $scope.updateExperiment();
          });
        };

        experimentSimulationService.setInitializedCallback($scope.joinExperiment);

        var setIsServerAvailable = function(id, isAvailable) {
          $scope.isServerAvailable[id] = isAvailable;
        };

        // We store this promise in the scope in order to be able to cancel the interval later
        $scope.updateUptimePromise = $interval(function () {
          simulationService().updateUptime();
        }, UPTIME_UPDATE_RATE);

        // Update the userID
        $scope.updateUserID = function () {
          if (!bbpConfig.get('localmode.forceuser', false)) {
            return hbpIdentityUserDirectory.getCurrentUser()
              .then(function (profile) {
                $scope.userID = profile.id;
              })
              .then(function() {
                hbpIdentityUserDirectory.isGroupMember('hbp-sp10-user-edit-rights').then(function (result) {
                  $scope.hasEditRights = result;
                });
              });
          } else {
            $scope.userID = bbpConfig.get('localmode.ownerID');
            $scope.hasEditRights = true;
            return $q.when();
          }
        };

        $scope.updateUserID();

        $scope.updateExperiment = function() {
          var simulations = $scope.experiments[$scope.experiment.id].simulations;
          if (angular.isDefined(simulations)) {
            $scope.experiment.simulations = _.filter(simulations, function(simulation) {
              return (simulation.contextID === $stateParams.ctx);
            });
          }
          $scope.owners = simulationService().owners;
          $scope.uptime = simulationService().uptime;
        };

        // This function is called when all servers responded to the query of running experiments
        $scope.getExperimentsFinishedCallback = function () {
          collabConfigService.get({contextID: $stateParams.ctx},
            function(response) {
              var experimentID = response.experimentID;
              // auto-redirect to Collab edit page if no experiment was cloned
              if (experimentID === '') {
                $location.path("esv-collab/edit");
                return;
              }
              $scope.experiment = $scope.experiments[experimentID];
              $scope.experiment.id = experimentID;
              // use collab image if there is one
              var defaultImage = $scope.experiment.imageData;
              $scope.experiment.imageData = "";
              $scope.collabImage.then(function(resolvedPromises){
                $scope.experiment.imageData = resolvedPromises ? resolvedPromises : defaultImage;
              });

              $scope.isQueryingServersFinished = true;
              // Schedule the update if the esv-web controller was not destroyed in the meantime
              if(!$scope.isDestroyed) {
                $scope.updateExperiment();
                // Start to update the datastructure in regular intervals
                $scope.updatePromise = $timeout(function () {
                  experimentSimulationService.refreshExperiments(
                    $scope.experiments,
                    $scope.serversEnabled,
                    setIsServerAvailable,
                    $scope.updateExperiment
                  );
                  loadHealthyServers();
                }, ESV_UPDATE_RATE);
              }
            },
            function(data) {
              $scope.isQueryingServersFinished = true;
              $scope.experiment = {
                name: 'Internal Error',
                description: 'Database unavailable'
              };
              serverError.display(data);
            }
          );
        };

        // get the experiment image from the collab storage
        $scope.loadCollabImage = function (){
          var promise = $q.defer();
          collabConfigService.get({contextID: $stateParams.ctx},
            function(response){
              if (!response.experimentFolderUUID || !response.experimentID){
                promise.resolve(null);
                return;
              }
              return collabFolderAPIService.getFolderFile(response.experimentFolderUUID, response.experimentID +".png")
              .then(function(imageData){
                if (!imageData._uuid){
                  promise.resolve(null);
                  return;
                }
                return collabFolderAPIService.downloadFile(imageData._uuid, {"responseType": "blob"});
              })
              .then(function(imageContent){
                var reader = new FileReader();
                reader.addEventListener('loadend', function(e) {
                  promise.resolve(e.target.result.replace("data:image/png;base64,", ""));
                });
                if (imageContent){
                  reader.readAsDataURL(imageContent);
                }
                else {
                  promise.resolve(null);
                }
              });
            },
            function(){
              promise.resolve(null);
            }
          );
          return promise.promise;
        };
        $scope.collabImage = $scope.loadCollabImage();
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
            $scope.getExperimentsFinishedCallback
          );
        });

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
