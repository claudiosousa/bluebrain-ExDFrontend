/*
  This module is thought to centralize the back-end server settings used for the current simulation.
*/

(function () {
  'use strict';

  var module = angular.module('simulationInfoService', ['bbpConfig']);
  module.factory('simulationInfo',
    ['$stateParams', 'bbpConfig', function ($stateParams, bbpConfig) {
      var thisService = {};

      // This function loads the server specific configuration and sets the simulation specific values
      thisService.Initialize = function() {
        if (!$stateParams.serverID || !$stateParams.simulationID){
          throw "No serverID or simulationID given.";
        }
        thisService.serverID = $stateParams.serverID;
        thisService.simulationID = $stateParams.simulationID;
        thisService.mode = $stateParams.mode;
        thisService.serverConfig = bbpConfig.get('api.neurorobotics')[thisService.serverID];
        thisService.serverBaseUrl = thisService.serverConfig.gzweb['nrp-services'];
      };

      return thisService;
    }
  ]);
}());
