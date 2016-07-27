/* This module is thought to centralize the back-end server settings used for the current simulation.*/

(function () {
  'use strict';

  angular.module('simulationInfoService', [])
    .factory('simulationInfo', ['experimentProxyService', function (experimentProxyService) {
      var thisService = {
        initialize: initialize
      };
      return thisService;

      // This function loads the server specific configuration and sets the simulation specific values
      function initialize(serverID, simulationID, contextID) {

        if (!serverID || !simulationID) {
          throw 'No serverID or simulationID given.';
        }
        thisService.serverID = serverID;
        thisService.simulationID = simulationID;
        thisService.contextID = contextID;
        thisService.isCollabExperiment = angular.isDefined(thisService.contextID);
        return experimentProxyService.getServerConfig(thisService.serverID)
          .then(function (serverConfig) {
            thisService.serverConfig = serverConfig;
            thisService.serverBaseUrl = serverConfig.gzweb['nrp-services'];
            return thisService;
          });
      }
    }]);
} ());
