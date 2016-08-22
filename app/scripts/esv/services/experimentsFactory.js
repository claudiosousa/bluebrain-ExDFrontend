(function () {
  'use strict';

  angular.module('experimentServices')
    .constant('SERVER_POLL_INTERVAL', 10 * 1000)
    .factory('experimentsFactory',
    ['$q', '$http', '$interval', '$rootScope', 'experimentProxyService', 'bbpConfig', 'uptimeFilter', 'slurminfoService',
      'hbpIdentityUserDirectory', 'experimentSimulationService', 'hbpDialogFactory', 'SERVER_POLL_INTERVAL',
      function ($q, $http, $interval, $rootScope, experimentProxyService, bbpConfig, uptimeFilter, slurminfoService,
        hbpIdentityUserDirectory, experimentSimulationService, hbpDialogFactory, SERVER_POLL_INTERVAL) {
        var localmode = {
          forceuser: bbpConfig.get('localmode.forceuser', false),
          ownerID: bbpConfig.get('localmode.ownerID', null)
        };

        var experimentsFactory = {
          createExperimentsService: experimentsService,
          getOwnerDisplayName: _.memoize(getOwnerName),
          getCurrentUserInfo: getCurrentUserInfo
        };

        return experimentsFactory;

        function getOwnerName(owner) {
          if (localmode.forceuser) {
            return $q.when(localmode.ownerID);
          }
          return hbpIdentityUserDirectory.get([owner]).then(function (profile) {
            return (profile[owner] && profile[owner].displayName) || 'Unkwown';
          });
        }

        function getCurrentUserInfo() {
          if (localmode.forceuser) {
            return $q.when({
              userID: bbpConfig.get('localmode.ownerID'),
              hasEditRights: true
            });
          }
          return $q.all([
            hbpIdentityUserDirectory.getCurrentUser(),
            hbpIdentityUserDirectory.isGroupMember('hbp-sp10-user-edit-rights')
          ]).then(function (userInfo) {
            return {
              userID: userInfo[0].id,
              hasEditRights: userInfo[1]
            };
          });
        }

        function experimentsService(contextId, experimentId) {
          var updateUptimeInterval, updateExperimentsInterval, experimentsDict, stoppingDict = {};

          var service = {
            destroy: destroy,
            initialize: initialize,
            startExperiment: startExperiment,
            stopExperiment: stopExperiment,
            getCurrentUserInfo: getCurrentUserInfo,
            experiments: null,
            clusterAvailability: { free: 'N/A', total: 'N/A'} // Default for local mode
          };

          return service;

          function initialize() {
            service.experiments = experimentProxyService.getExperiments(contextId, experimentId)
              .then(function (exps) { return (experimentsDict = exps); })
              .then(transformExperiments)
              .then(_.map);
            // TODO(Luc): don't perform GET request on the SlurmMonitor server if localmode is true
            service.clusterAvailability = slurminfoService.get().$promise.then(transformClusterAvailability);
            updateExperimentImages();
            updateUptime();
            updateUptimeInterval = $interval(updateUptime, 1000);
            updateExperimentsInterval = $interval(refreshExperimentsAndCluster, SERVER_POLL_INTERVAL);
          }

          function transformExperiments(experiments) {

            return _.forEach(experiments, function (exp, expId) {
              exp.id = expId;
              exp.joinableServers.forEach(function (simul) {
                experimentsFactory.getOwnerDisplayName(simul.runningSimulation.owner).then(function (owner) {
                  simul.owner = owner;
                });
              });
            });
          }

          function updateExperimentImages() {
            service.experiments.then(function (experiments) {
              var experimentIds = experiments.map(function (exp) { return exp.id; });
              experimentProxyService.getImages(experimentIds)
                .then(function (images) {
                  experiments.forEach(function (exp) { exp.imageData = images[exp.id]; });
                });
            });
          }

          function updateUptime() {
            service.experiments.then(function (exps) {
              exps.forEach(function (exp) {
                exp.joinableServers.forEach(function (simul) {
                  simul.uptime = uptimeFilter(simul.runningSimulation.creationDate);
                });
              });
            });
          }

          function startExperiment(experiment, envSDFData) {
            return experimentSimulationService.startNewExperiment(experiment, envSDFData)
              .catch(function (fatalErrorWasShown) {
                if (!fatalErrorWasShown) {
                  hbpDialogFactory.alert({
                    title: 'No server is currently available',
                    template: 'No server can handle your simulation at the moment. Please try again later'
                  });
                }
                return $q.reject(fatalErrorWasShown);
              });
          }

          function stopExperiment(simulation) {
            simulation.stopping = true;
            if (!stoppingDict[simulation.server]){
              stoppingDict[simulation.server] = {};
            }
            stoppingDict[simulation.server][simulation.runningSimulation.simulationID] = true;
            return experimentSimulationService.stopExperimentOnServer(simulation);
          }

          function refreshExperimentsAndCluster() {
            experimentProxyService.getExperiments(contextId, experimentId)
              .then(transformExperiments)
              .then(function (experiments) {
                _.forOwn(experiments, function (exp, expId) {
                  ['availableServers', 'joinableServers'].forEach(function (prop) {
                    experimentsDict[expId][prop] = exp[prop];
                  });
                  exp.joinableServers.forEach(function (sim) {
                    sim.stopping = stoppingDict[sim.server] && stoppingDict[sim.server][sim.runningSimulation.simulationID];
                  });
                  updateUptime();
                });
              });

            if (!localmode.forceuser) {
              slurminfoService.get().$promise
                .then(transformClusterAvailability)
                .then(function (clusterAvailability) {
                  service.clusterAvailability.then(function (currentClusterAvailability) {
                    _.merge(currentClusterAvailability, clusterAvailability);
                });
              });
            }

          }

          function transformClusterAvailability(clusterAvailability) {
            var result = { free: 'NaN', total: 'NaN'}; // Displayed if there is an issue with the Slurmonitor server
            if (clusterAvailability) {
              result.free = clusterAvailability.free;
              result.total = clusterAvailability.nodes[3];
            }
            return result;
          }

          function destroy() {
            $interval.cancel(updateUptimeInterval);
            $interval.cancel(updateExperimentsInterval);
          }
        }
      }]);
})();