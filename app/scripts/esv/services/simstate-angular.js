/*
  This module is thought to centralize the manipulation of the simulation state.
  It provides two functions for getting and setting the simuation state via REST,
  as well as a variable saving the current state that can be accessed when there
  is no necessity to explicitly fetching the state.

  getCurrentState and setCurrentState are implemented so they can be used with
  the AngularJS .then() and .catch() functions.
*/

(function () {
  'use strict';

  var module = angular.module('simulationStateServices', []);
  module.factory('stateService',
    ['simulationState', '$stateParams', 'bbpConfig', '$q', 'serverError',
    function (simulationState, $stateParams, bbpConfig, $q, serverError) {
      var returnValue = {};

      returnValue.getCurrentState = function () {
        var deferred = $q.defer();
        var serverID = $stateParams.serverID;
        var simulationID = $stateParams.simulationID;
        var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];
        var serverBaseUrl = serverConfig.gzweb['nrp-services'];

        simulationState(serverBaseUrl).state({sim_id: simulationID},
          function (data) {
            returnValue.currentState = data.state;
            deferred.resolve();
          },
          function (data) {
            deferred.reject();
          }
        );

        return deferred.promise;
      };

      returnValue.setCurrentState = function (newState) {
        var deferred = $q.defer();
        var serverID = $stateParams.serverID;
        var simulationID = $stateParams.simulationID;
        var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];
        var serverBaseUrl = serverConfig.gzweb['nrp-services'];

        simulationState(serverBaseUrl).update(
          {sim_id: simulationID},
          {state: newState},
          function (data) {
            returnValue.currentState = data.state;
            deferred.resolve();
          },
          function (data) {
            serverError(data);
            deferred.reject();
          }
        );
        return deferred.promise;
      };

      returnValue.ensureStateBeforeExecuting = function (state, toBeExecuted) {
        if (returnValue.currentState === state) {
          toBeExecuted();
        }
        else {
          returnValue.setCurrentState(state)
            .then(function () {
              toBeExecuted();
            });
        }
      };

      return returnValue;
    }
  ]);
}());
