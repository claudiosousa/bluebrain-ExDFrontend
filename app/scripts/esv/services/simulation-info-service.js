/* This module is thought to centralize the back-end server settings used for the current simulation.*/

(function () {
  'use strict';

  angular.module('simulationInfoService', [])
    .factory('simulationInfo', ['experimentProxyService', 'experimentList', function (experimentProxyService, experimentList) {
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
        thisService.isCollabExperiment = angular.isDefined(thisService.contextID);
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

            if (thisService.isCollabExperiment) {
              experimentList(thisService.serverBaseUrl).experiments({context_id: contextID}, function(data) {
                var configuration = data.data.experiment_configuration;
                setExperimentDetails(configuration);
              });
            } else {
              experimentProxyService.getExperiments().then(function (data){
                var configuration = data[thisService.experimentID].configuration;
                setExperimentDetails(configuration);
              });
            }
            return thisService;
          });
      }
    }]);
} ());
