/* This module is thought to centralize the back-end server settings used for the current simulation.*/

(function () {
  'use strict';

  angular.module('simulationInfoService', [])
    .factory('simulationInfo', ['experimentProxyService', 'experimentList', 'environmentService',
    function (experimentProxyService, experimentList, environmentService) {
      var thisService = {
        initialize: initialize
      };
      return thisService;

      // This function loads the server specific configuration and sets the simulation specific values
      function initialize(serverID, experimentID, simulationID, contextID) {

        if (!serverID || !simulationID) {
          throw 'No serverID or simulationID given.';
        }
        thisService.serverID = serverID;
        thisService.simulationID = simulationID;
        thisService.contextID = contextID;
        thisService.experimentID = experimentID;
        thisService.experimentDetails = null;

        return experimentProxyService.getServerConfig(thisService.serverID)
          .then(function (serverConfig) {
            thisService.serverConfig = serverConfig;
            thisService.serverBaseUrl = serverConfig.gzweb['nrp-services'];
            thisService.animatedModel = null;
            var setExperimentDetails = function(configuration) {
              // Test whether the robot model has an animated visual that needs to be instantied by gz3d's Collada loader
              if (configuration && configuration.visualModel) {
                thisService.animatedModel = configuration;
                thisService.animatedModel.assetsPath = thisService.serverConfig.gzweb.assets + '/' + configuration.visualModel;
              }
              thisService.experimentDetails = configuration;
            };

            if (environmentService.isPrivateExperiment()) {
              return experimentList(thisService.serverBaseUrl).experiments({ context_id: contextID }, function(data) {
                var configuration = data.data.experiment_configuration;
                setExperimentDetails(configuration);
              }).$promise;
            }

            return experimentProxyService.getExperiments().then(function(data){
              var configuration = data[thisService.experimentID] && data[thisService.experimentID].configuration;

              // update simulation specific data that user can override from the default configuration
              if (data[thisService.experimentID] && data[thisService.experimentID].joinableServers) {

                  // find the currently running experiment on the server with same simulation id (unique)
                  for(var i = 0; i < data[thisService.experimentID].joinableServers.length; i++) {
                      var joinable = data[thisService.experimentID].joinableServers[i];
                      if (joinable.server === thisService.serverID && String(joinable.runningSimulation.simulationID) === thisService.simulationID) {
                          configuration.brainProcesses = joinable.runningSimulation.brainProcesses;
                          break;
                     }
                  }
              }

              setExperimentDetails(configuration);
            });

          });
      }
    }]);
} ());
