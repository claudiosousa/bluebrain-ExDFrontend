(function () {
  'use strict';

  angular.module('exdFrontendApp').factory('backendInterfaceService', ['$resource', '$stateParams', 'bbpConfig', 'serverError',
    function ($resource, $stateParams, bbpConfig, serverError) {

      var serverConfig = bbpConfig.get('api.neurorobotics')[$stateParams.serverID];
      var serverBaseUrl = serverConfig.gzweb['nrp-services'];

      var resourceStateMachine = $resource(serverBaseUrl + '/simulation/:sim_id/state-machines', {}, {
        get: {
          method: 'GET',
          interceptor: {responseError: serverError}
        },
        put: {
          method: 'PUT',
          url: serverBaseUrl + '/simulation/:sim_id/state-machines/:state_machine_name',
          interceptor: {responseError: serverError}
        }
      });

      var resourceTransferFunction = $resource(serverBaseUrl + '/simulation/:sim_id/transfer-functions', {}, {
        transferFunctions: {
          method: 'GET',
          isArray: true,
          interceptor: {responseError: serverError}
        },
        patch: {
          method: 'PUT',
          url: serverBaseUrl + '/simulation/:sim_id/transfer-functions/:transfer_function_name',
          interceptor: {responseError: serverError}
        },
        delete: {
          method: 'DELETE',
          url: serverBaseUrl + '/simulation/:sim_id/transfer-functions/:transfer_function_name',
          interceptor: {responseError: serverError}
        }
      });

      return {
        getStateMachineScripts: function (callback) {
          resourceStateMachine.get({sim_id: $stateParams.simulationID}, function (response) {
            callback(response);
          });
        },
        setStateMachineScript: function (name, data) {
          resourceStateMachine.put({
            sim_id: $stateParams.simulationID,
            state_machine_name: name
          }, data);
        },
        getTransferFunctions: function (callback) {
          resourceTransferFunction.transferFunctions({sim_id: $stateParams.simulationID}, function (data) {
            callback(data);
          });
        },
        setTransferFunction: function (name, data, callback) {
          resourceTransferFunction.patch({sim_id: $stateParams.simulationID, transfer_function_name: name}, data, callback);
        },
        deleteTransferFunction: function (name, data) {
          resourceTransferFunction.delete({sim_id: $stateParams.simulationID, transfer_function_name: name});
        },
        getServerBaseUrl: function () {
          return serverBaseUrl;
        }
      };

    }]);
})();
