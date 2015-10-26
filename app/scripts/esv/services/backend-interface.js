(function () {
  'use strict';

  angular.module('exdFrontendApp').factory('backendInterfaceService',
    ['$resource', '$stateParams', 'bbpConfig', 'serverError', 'simulationInfo',
    function ($resource, $stateParams, bbpConfig, serverError, simulationInfo) {

      var resourceStateMachine = function(backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/state-machines', {}, {
            get: {
              method: 'GET',
              interceptor: {responseError: serverError.display}
            },
            put: {
              method: 'PUT',
              url: backendBaseUrl + '/simulation/:sim_id/state-machines/:state_machine_name',
              interceptor: {responseError: serverError.display}
            },
            delete: {
              method: 'DELETE',
              url: backendBaseUrl + '/simulation/:sim_id/state-machines/:state_machine_name',
              interceptor: {responseError: serverError.display}
            }
        });
      };

      var resourceTransferFunction = function(backendBaseUrl) {
        return $resource(backendBaseUrl + '/simulation/:sim_id/transfer-functions', {}, {
          transferFunctions: {
            method: 'GET',
            interceptor: {responseError: serverError.display}
          },
          patch: {
            method: 'PUT',
            url: backendBaseUrl + '/simulation/:sim_id/transfer-functions/:transfer_function_name'
          },
          delete: {
            method: 'DELETE',
            url: backendBaseUrl + '/simulation/:sim_id/transfer-functions/:transfer_function_name',
            interceptor: {responseError: serverError.display}
          }
        });
      };

      var resourceBrain = function(backendBaseUrl) {
        return $resource(backendBaseUrl + '/experiment/:exp_id/brain', {}, {
          get: {
            method: 'GET',
            interceptor: {responseError: serverError.display}
          }
        });
      };

      return {
        getBrain: function (callback) {
          resourceBrain(simulationInfo.serverBaseUrl).get(
            {exp_id: simulationInfo.experimentID},
            function(response) {
              callback(response);
            }
          );
        },
        getStateMachines: function (callback) {
          resourceStateMachine(simulationInfo.serverBaseUrl).get(
            {sim_id: simulationInfo.simulationID},
            function (response) {
              callback(response);
            }
          );
        },
        setStateMachine: function (name, data, successCallback) {
          resourceStateMachine(simulationInfo.serverBaseUrl).put({
            sim_id: simulationInfo.simulationID,
            state_machine_name: name
          }, data, successCallback);
        },
        deleteStateMachine: function (name, callback) {
          resourceStateMachine(simulationInfo.serverBaseUrl).delete(
            {
              sim_id: simulationInfo.simulationID, state_machine_name: name
            }, callback
          );
        },
        getTransferFunctions: function (callback) {
          resourceTransferFunction(simulationInfo.serverBaseUrl).transferFunctions(
            {
              sim_id: simulationInfo.simulationID
            }, function (data) {
               callback(data);
            }
          );
        },
        setTransferFunction: function (name, data, successCallback, errorCallback) {
          resourceTransferFunction(simulationInfo.serverBaseUrl).patch(
          {
            sim_id: simulationInfo.simulationID,
            transfer_function_name: name
          },
            data,
            successCallback,
            errorCallback
          );
        },
        deleteTransferFunction: function (name, callback) {
          resourceTransferFunction(simulationInfo.serverBaseUrl).delete(
            {
              sim_id: simulationInfo.simulationID, transfer_function_name: name
            }, callback
          );
        },
        getServerBaseUrl: function () {
          return simulationInfo.serverBaseUrl;
        }
      };

    }]);
})();
