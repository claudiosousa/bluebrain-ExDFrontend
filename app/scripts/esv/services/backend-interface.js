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

        var resourceStateMachineSimulation = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/state-machines', {}, {
            get: {
              method: 'GET',
              interceptor: {responseError: serverError.displayHTTPError}
            },
            put: {
              method: 'PUT',
              url: backendBaseUrl + '/simulation/:sim_id/state-machines/:state_machine_name',
              interceptor: {responseError: serverError.displayHTTPError}
            },
            delete: {
              method: 'DELETE',
              url: backendBaseUrl + '/simulation/:sim_id/state-machines/:state_machine_name',
              interceptor: {responseError: serverError.displayHTTPError}
            }
          });
        };

        var resourceExtendSimulationSimulation = function (backendBaseUrl, options) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/extend_timeout', options, {
            extendTimeout: {
              method: 'POST'
            }
          });
        };

        var resourceTransferFunctionSimulation = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/transfer-functions', {}, {
            transferFunctions: {
              method: 'GET',
              interceptor: {responseError: serverError.displayHTTPError}
            },
            patch: {
              method: 'PUT',
              url: backendBaseUrl + '/simulation/:sim_id/transfer-functions/:transfer_function_name'
            },
            delete: {
              method: 'DELETE',
              url: backendBaseUrl + '/simulation/:sim_id/transfer-functions/:transfer_function_name',
              interceptor: {responseError: serverError.displayHTTPError}
            }
          });
        };

        var resourceStructuredTransferFunctions = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/simulation-structured-transfer-functions', {}, {
            get: {
              method: 'GET',
              interceptor: {responseError: serverError.displayHTTPError}
            },
            patch: {
              method: 'PUT'
            }
          });
        };
        var resourceTopics = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/topics', {}, {
            get: {
              method: 'GET',
              interceptor: {responseError: serverError.displayHTTPError}
            }
          });
        };

        var resourceBrainSimulation = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/brain', {}, {
            get: {
              method: 'GET',
              interceptor: {responseError: serverError.displayHTTPError}
            },
            put: {
              method: 'PUT'
            }
          });
        };

        var resourceBrainPopulations = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/populations', {}, {
            get: {
              method: 'GET',
              interceptor: {responseError: serverError.displayHTTPError}
            }
          });
        };

        var resourceBrainExperiment = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/experiment/:context_id/brain', {}, {
            save: {
              method: 'PUT',
              interceptor: {responseError: serverError.displayHTTPError}
            }
          });
        };

        var resourceSDFExperiment = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/experiment/:context_id/sdf_world', {}, {
            save: {
              method: 'PUT',
              interceptor: {responseError: serverError.displayHTTPError}
            }
          });
        };

        var resourceStateMachineExperiment = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/experiment/:context_id/state-machines', {}, {
            save: {
              method: 'PUT',
              interceptor: {responseError: serverError.displayHTTPError}
            }
          });
        };
        var resourceReset = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/reset', {}, {
            reset: {
              method: 'PUT',
              interceptor: {responseError: _.curry(serverError.displayHTTPError)(_, true)}
            }
          });
        };

        var resourceTransferFunctionExperiment = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/experiment/:context_id/transfer-functions', {}, {
            save: {
              method: 'PUT',
              interceptor: {responseError: serverError.displayHTTPError}
            }
          });
        };

        var resourceResetCollab = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/:context_id/reset', {}, {
            reset: {
              method: 'PUT',
              interceptor: {responseError: _.curry(serverError.displayHTTPError)(_, true)}
            }
          });
        };

        var resourceCSVRecordesFiles = function (backendBaseUrl) {
          return $resource(backendBaseUrl + '/simulation/:sim_id/:context_id/csv-recorders', {}, {
            dump: {
              method: 'PUT',
              interceptor: {responseError: serverError.displayHTTPError},
              url: backendBaseUrl + '/simulation/:sim_id/:context_id/csv-recorders'
            }
          });
        };

        return {
          getBrain: function (callback) {
            resourceBrainSimulation(simulationInfo.serverBaseUrl).get(
              {sim_id: simulationInfo.simulationID},
              function (response) {
                callback(response);
              }
            );
          },
          setBrain: function (data,
                              brain_populations,
                              brain_type,
                              data_type,
                              change_population,
                              successCallback,
                              failureCallback) {
            resourceBrainSimulation(simulationInfo.serverBaseUrl).put({
                sim_id: simulationInfo.simulationID
              }, {
                'data': data,
                'brain_type': brain_type,
                'data_type': data_type,
                'additional_populations': brain_populations,
                'change_population': change_population
              },
              successCallback, failureCallback);
          },
          saveBrain: function (contextID, pynnScript, brainPopulations, successCallback, failureCallback) {
            return resourceBrainExperiment(
              simulationInfo.serverBaseUrl).save(
              {context_id: contextID},
              {data: pynnScript, additional_populations: brainPopulations},
              successCallback,
              failureCallback
            );
          },
          reloadBrain: function (callback) {
            resourceBrainExperiment(simulationInfo.serverBaseUrl).get(
              {exp_id: simulationInfo.experimentID},
              function (response) {
                callback(response);
              }
            );
          },
          getPopulations: function (callback) {
            resourceBrainPopulations(simulationInfo.serverBaseUrl).get(
              {sim_id: simulationInfo.simulationID},
              function (response) {
                callback(response);
              }
            );
          },
          getTopics: function (callback) {
            resourceTopics(simulationInfo.serverBaseUrl).get(
              {}, function (data) {
                callback(data);
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

          deleteTransferFunction: function (name, callback) {
            resourceTransferFunctionSimulation(simulationInfo.serverBaseUrl).delete(
              {
                sim_id: simulationInfo.simulationID, transfer_function_name: name
              }, callback
            );
          },
          saveTransferFunctions: function (contextID, transferFunctions, successCallback, errorCallback) {
            var data = {
              context_id: contextID,
              transfer_functions: transferFunctions
            };
            return resourceTransferFunctionExperiment(simulationInfo.serverBaseUrl).save({context_id: contextID}, data,
              successCallback, errorCallback);
          },
          saveCSVRecordersFiles: function (successCallback, errorCallback) {
            resourceCSVRecordesFiles(simulationInfo.serverBaseUrl).dump(
              {
                sim_id: simulationInfo.simulationID
              }, {}, successCallback, errorCallback
            );
          },
          getServerBaseUrl: function () {
            return simulationInfo.serverBaseUrl;
          },
          saveSDF: function (contextID, successCallback, errorCallback) {
            return resourceSDFExperiment(simulationInfo.serverBaseUrl).save({context_id: contextID},
              {context_id: contextID}, successCallback, errorCallback);
          },
          reset: function (resetData, successCallback, errorCallback) {
            return resourceReset(simulationInfo.serverBaseUrl).reset(
              {sim_id: simulationInfo.simulationID},
              resetData, successCallback, errorCallback
            );
          },
          setStateMachine: function (name, data, successCallback, errorCallback) {
            resourceStateMachineSimulation(simulationInfo.serverBaseUrl).put({
              sim_id: simulationInfo.simulationID,
              state_machine_name: name
            }, data, successCallback, errorCallback);
          },
          deleteStateMachine: function (name, callback) {
            resourceStateMachineSimulation(simulationInfo.serverBaseUrl).delete(
              {
                sim_id: simulationInfo.simulationID, state_machine_name: name
              }, callback
            );
          },
          saveStateMachines: function (contextID, transferFunctions, successCallback, errorCallback) {
            var data = {
              context_id: contextID,
              state_machines: transferFunctions
            };
            return resourceStateMachineExperiment(simulationInfo.serverBaseUrl).save({context_id: contextID}, data,
              successCallback, errorCallback);
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
          getStructuredTransferFunctions: function (callback) {
            resourceStructuredTransferFunctions(simulationInfo.serverBaseUrl).get(
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
          setStructuredTransferFunction: function (data, successCallback, errorCallback) {
            resourceStructuredTransferFunctions(simulationInfo.serverBaseUrl).patch(
              {
                sim_id: simulationInfo.simulationID
              },
              data,
              successCallback,
              errorCallback
            );
          },
          resetCollab: function (contextID, resetData, successCallback, errorCallback) {
            return resourceResetCollab(simulationInfo.serverBaseUrl).reset(
              {sim_id: simulationInfo.simulationID, context_id: contextID},
              resetData, successCallback, errorCallback
            );
          },
          extendTimeout: function () {
            return resourceExtendSimulationSimulation(simulationInfo.serverBaseUrl, {sim_id: simulationInfo.simulationID})
              .extendTimeout().$promise;
          }
        };

      }]);
})();
