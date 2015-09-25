(function () {
  'use strict';

  angular.module('exdFrontendApp').factory('backendInterfaceService', ['$resource', '$stateParams', 'bbpConfig', 'serverError',
    function ($resource, $stateParams, bbpConfig, serverError) {

      var serverConfig = bbpConfig.get('api.neurorobotics')[$stateParams.serverID];
      var serverBaseUrl = serverConfig.gzweb['nrp-services'];

      var resourceStateMachine = $resource(serverBaseUrl + '/simulation/:sim_id/state-machines', {}, {
        get: {
          method: 'GET',
          interceptor: {responseError: serverError.display}
        },
        put: {
          method: 'PUT',
          url: serverBaseUrl + '/simulation/:sim_id/state-machines/:state_machine_name',
          interceptor: {responseError: serverError.display}
        },
        delete: {
          method: 'DELETE',
          url: serverBaseUrl + '/simulation/:sim_id/state-machines/:state_machine_name',
          interceptor: {responseError: serverError.display}
        }
      });

      var resourceTransferFunction = $resource(serverBaseUrl + '/simulation/:sim_id/transfer-functions', {}, {
        transferFunctions: {
          method: 'GET',
          interceptor: {responseError: serverError.display}
        },
        patch: {
          method: 'PUT',
          url: serverBaseUrl + '/simulation/:sim_id/transfer-functions/:transfer_function_name'
        },
        delete: {
          method: 'DELETE',
          url: serverBaseUrl + '/simulation/:sim_id/transfer-functions/:transfer_function_name',
          interceptor: {responseError: serverError.display}
        }
      });

      return {
        getStateMachines: function (callback) {
          resourceStateMachine.get({sim_id: $stateParams.simulationID}, function (response) {
            callback(response);
          });
        },
        setStateMachine: function (name, data, successCallback) {
          resourceStateMachine.put({
            sim_id: $stateParams.simulationID,
            state_machine_name: name
          }, data, successCallback);
        },
        deleteStateMachine: function (name, callback) {
          resourceStateMachine.delete({sim_id: $stateParams.simulationID, state_machine_name: name}, callback);
        },
        getTransferFunctions: function (callback) {
          resourceTransferFunction.transferFunctions({sim_id: $stateParams.simulationID}, function (data) {
            callback(data);
          });
        },
        setTransferFunction: function (name, data, successCallback, errorCallback) {
          resourceTransferFunction.patch({
            sim_id: $stateParams.simulationID, 
            transfer_function_name: name
          }, 
            data, 
            successCallback,
            errorCallback
          );
        },
        deleteTransferFunction: function (name, callback) {
          resourceTransferFunction.delete({sim_id: $stateParams.simulationID, transfer_function_name: name}, callback);
        },
        getServerBaseUrl: function () {
          return serverBaseUrl;
        }
      };

    }]);
})();
