(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
    // constants for Reset type.
    // WARNING: these values must match the ones in
    // GazeboRosPackages/src/cle_ros_msgs/srv/ResetSimulation.srv
    .constant('RESET_TYPE', {
      NO_RESET: -1,
      RESET_ROBOT_POSE: 0,
      RESET_FULL: 1,
      RESET_WORLD: 2,
      RESET_BRAIN: 3,
      RESET_OLD: 255,
      RESET_CAMERA_VIEW: 1000
    });

  angular.module('exdFrontendApp').factory('backendInterfaceService',
    ['$resource', '$stateParams', 'bbpConfig', 'serverError', 'simulationInfo',
    function ($resource, $stateParams, bbpConfig, serverError, simulationInfo) {

      var resourceStateMachineSimulation = function(backendBaseUrl) {
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

      var resourceTransferFunctionSimulation = function(backendBaseUrl) {
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

      var resourceBrainSimulation = function(backendBaseUrl) {
        return $resource(backendBaseUrl + '/simulation/:sim_id/brain', {}, {
          get: {
            method: 'GET',
            interceptor: {responseError: serverError.display}
          },
          put: {
            method: 'PUT'
          }
        });
      };

      var resourceBrainExperiment = function(backendBaseUrl) {
        return $resource(backendBaseUrl + '/experiment/:context_id/brain', {}, {
          save: {
            method: 'PUT',
            interceptor: {responseError: serverError.display}
          }
        });
      };

      var resourceSDFExperiment = function(backendBaseUrl) {
        return $resource(backendBaseUrl + '/experiment/:context_id/sdf_world', {}, {
          save: {
            method: 'PUT',
            interceptor: {responseError: serverError.display}
          }
        });
      };

      var resourceTransferFunctionExperiment = function(backendBaseUrl) {
        return $resource(backendBaseUrl + '/experiment/:context_id/transfer-functions', {}, {
          save: {
            method: 'PUT',
            interceptor: {responseError: serverError.display}
          }
        });
      };

     var resourceReset = function (backendBaseUrl) {
       return $resource(backendBaseUrl + '/simulation/:sim_id/reset', {}, {
         reset: {
           method: 'PUT',
           interceptor: {responseError: serverError.display}
         }
       });
     };

     var resourceCSVRecordesFiles = function (backendBaseUrl) {
       return $resource(backendBaseUrl + '/simulation/:sim_id/:context_id/csv-recorders', {}, {
         dump: {
           method: 'PUT',
           interceptor: {responseError: serverError.display},
           url: backendBaseUrl + '/simulation/:sim_id/:context_id/csv-recorders'
         }
       });
     };

     var resourceResetCollab = function (backendBaseUrl) {
       return $resource(backendBaseUrl + '/simulation/:sim_id/:context_id/reset', {}, {
         reset: {
           method: 'PUT',
           interceptor: {responseError: serverError.display}
         }
       });
     };

      return {
        getBrain: function (callback) {
          resourceBrainSimulation(simulationInfo.serverBaseUrl).get(
            {sim_id: simulationInfo.simulationID},
            function(response) {
              callback(response);
            }
          );
        },
        setBrain: function (
          data,
          brain_populations,
          brain_type,
          data_type,
          successCallback,
          failureCallback
        ) {
          resourceBrainSimulation(simulationInfo.serverBaseUrl).put({
            sim_id: simulationInfo.simulationID
          }, {'data': data, 'brain_type': brain_type, 'data_type': data_type, 'additional_populations': brain_populations},
          successCallback, failureCallback);
        },
        saveBrain: function(contextID, pynnScript, brainPopulations, successCallback, failureCallback) {
          return resourceBrainExperiment(
            simulationInfo.serverBaseUrl).save(
            { context_id: contextID },
            {data: pynnScript, additional_populations: brainPopulations},
            successCallback,
            failureCallback
          );
        },
        reloadBrain: function (callback) {
          resourceBrainExperiment(simulationInfo.serverBaseUrl).get(
            {exp_id: simulationInfo.experimentID},
            function(response) {
              callback(response);
            }
          );
        },

        getStateMachines: function (callback) {
          resourceStateMachineSimulation(simulationInfo.serverBaseUrl).get(
            {sim_id: simulationInfo.simulationID},
            function (response) {
              callback(response);
            }
          );
        },
        setStateMachine: function (name, data, successCallback) {
          resourceStateMachineSimulation(simulationInfo.serverBaseUrl).put({
            sim_id: simulationInfo.simulationID,
            state_machine_name: name
          }, data, successCallback);
        },
        deleteStateMachine: function (name, callback) {
          resourceStateMachineSimulation(simulationInfo.serverBaseUrl).delete(
            {
              sim_id: simulationInfo.simulationID, state_machine_name: name
            }, callback
          );
        },

        getTransferFunctions: function (callback) {
          resourceTransferFunctionSimulation(simulationInfo.serverBaseUrl).transferFunctions(
            {
              sim_id: simulationInfo.simulationID
            }, function (data) {
               callback(data);
            }
          );
        },
        setTransferFunction: function (name, data, successCallback, errorCallback) {
          resourceTransferFunctionSimulation(simulationInfo.serverBaseUrl).patch(
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
          resourceTransferFunctionSimulation(simulationInfo.serverBaseUrl).delete(
            {
              sim_id: simulationInfo.simulationID, transfer_function_name: name
            }, callback
          );
        },
        saveTransferFunctions: function(contextID, transferFunctions, successCallback, errorCallback) {
          var data = {
            context_id: contextID,
            transfer_functions: transferFunctions
          };
          return resourceTransferFunctionExperiment(simulationInfo.serverBaseUrl).save({ context_id: contextID }, data,
            successCallback, errorCallback);
        },
        saveCSVRecordersFiles: function(contextID, successCallback, errorCallback) {
          resourceCSVRecordesFiles(simulationInfo.serverBaseUrl).dump(
            {
              sim_id: simulationInfo.simulationID,
              context_id: contextID
            }, {}, successCallback, errorCallback
          );
        },
        getServerBaseUrl: function () {
          return simulationInfo.serverBaseUrl;
        },
        saveSDF: function(contextID, successCallback, errorCallback) {
          return resourceSDFExperiment(simulationInfo.serverBaseUrl).save({ context_id: contextID },
            { context_id: contextID }, successCallback, errorCallback);
        },
        reset: function(resetData, successCallback, errorCallback) {
          return resourceReset(simulationInfo.serverBaseUrl).reset(
            {sim_id: simulationInfo.simulationID},
            resetData, successCallback, errorCallback
            );
        },
        resetCollab: function(contextID, resetData, successCallback, errorCallback) {
          return resourceResetCollab(simulationInfo.serverBaseUrl).reset(
            {sim_id: simulationInfo.simulationID, context_id: contextID },
            resetData, successCallback, errorCallback
          );
        }
      };

    }]);
})();
