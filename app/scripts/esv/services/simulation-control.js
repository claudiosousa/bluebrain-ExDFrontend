(function () {
  'use strict';

  /* global console: false */

  angular.module('exdFrontendApp.Constants')
    .constant('DEFAULT_RESOURCE_GET_TIMEOUT', 10000) // ms = 10sec
    .constant('EXPERIMENTS_GET_TIMEOUT', 30000); // ms = 30sec

  var module = angular.module('simulationControlServices', ['ngResource',
    'exdFrontendApp.Constants',
    'exdFrontendFilters',
    'nrpErrorHandlers',
    'bbpConfig',
    'hbpCommon']);

  module.factory('simulationService', ['$resource', '$http', 'bbpConfig', 'hbpUserDirectory', 'STATE',
    'serverError', 'uptimeFilter','DEFAULT_RESOURCE_GET_TIMEOUT',
    function ($resource, $http, bbpConfig, hbpUserDirectory, STATE,
      serverError, uptimeFilter, DEFAULT_RESOURCE_GET_TIMEOUT) {

      // Keeps track of the owner of experiments in a map (id -> display name)
      var owners = {};
      var creationDate = {};
      var uptime = {};

      // update simulation uptimes every second (uptime is accessed in the html directly)
      var updateUptime = function () {
        angular.forEach(creationDate, function (element, key) {
          uptime[key] = uptimeFilter(element);
        });
      };

      // transform the response data
      function transform(http, serverID) {
        var defaults = http.defaults.transformResponse;
        // We can't guarantee that the default transformation is an array
        defaults = angular.isArray(defaults) ? defaults : [defaults];
        // Append the new transformation to the defaults
        return defaults.concat(function (data) {
          if (angular.isArray(data)) { // false in case of a Bad Gateway Error 502
            angular.forEach(data, function (element) {
              element.serverID = serverID;
              // keep a copy of creation dates in an array (will be used to calculate uptime array)
              creationDate[serverID + '-' + element.simulationID] = element.creationDate;
              if (element.state !== STATE.STOPPED && !(element.owner in owners)) {
                if (!bbpConfig.get('localmode.forceuser', false)) {
                  hbpUserDirectory.get([element.owner]).then(function (profile) {
                    owners[element.owner] = getUserName(profile);
                  });
                } else {
                  element.owner = bbpConfig.get('localmode.ownerID');
                  owners[element.owner] = bbpConfig.get('localmode.ownerID');
                }
              }
            });
          }
          return data;
        });
      }

      var getUserName = function (profile) {
        var validOwnerID = Object.keys(profile)[0];// Should be element.owner if it is a valid ID, undefined otherwise
        return validOwnerID !== undefined ? profile[validOwnerID].displayName : 'Unknown';
      };

      // State filtering for simulations (the second parameter is optional)
      var filterSimulations = function (simulations, state1, state2) {
        var length = simulations.length;
        for (var i = length - 1; i >= 0; i -= 1) { // the largest indices correspond to the newest objects
          var simulation = simulations[i];
          var state = simulation.state;
          if (state === state1 || (state2 !== undefined && state === state2)) {
            return simulation;
          }
        }
        return undefined;
      };

      // Retrieve the latest active simulation, i.e., the simulation with the highest index which is started or paused
      // If it doesn't exist, we fall back on an initialized or created one. If there is no simulation object on the server,
      // the active simulation remains undefined
      var getActiveSimulation = function (simulations) {
        var activeSimulation = filterSimulations(simulations, STATE.PAUSED, STATE.STARTED);
        if (activeSimulation !== undefined) {
          return activeSimulation;
        }
        return filterSimulations(simulations, STATE.INITIALIZED);
      };

      // Public methods of the service
      return function (params) {
        if (params === undefined) {
          params = {};
          params.serverURL = '';
          params.serverID = '';
        }
        var functions = $resource(params.serverURL + '/simulation', {}, {
          simulations: {
            method: 'GET',
            // prevent the user to wait for long time since our servers can only handle one request at a time (yet).
            timeout: DEFAULT_RESOURCE_GET_TIMEOUT,
            isArray: true,
            interceptor: {
              responseError: function (response) {
                // Prevent 504 Gateway Timeout errors to be displayed
                // as well as timeout that occurs when the server is busy doing
                // something else such as starting a simulation
                if (response.status !== 504 && response.status > 0) {
                  serverError.display(response);
                }
              }
            },
            transformResponse: transform($http, params.serverID)
          }
        });
        functions.getActiveSimulation = getActiveSimulation;
        functions.filterSimulations = filterSimulations;
        functions.transformResponse = transform;
        functions.updateUptime = updateUptime;
        functions.owners = owners;
        functions.uptime = uptime;
        functions.getUserName = getUserName;

        return functions;
      };
    }]);

  module.factory('simulationControl', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id', {}, {
        simulation: {
          method: 'GET',
          interceptor: {responseError: serverError.display}
        }
      });
    };
  }]);

  module.factory('simulationState', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/state', {}, {
        state: {
          method: 'GET',
          interceptor: {responseError: serverError.display}
        },
        update: { // this method initializes, starts, stops, or pauses the simulation
          method: 'PUT'
        }
      });
    };
  }]);

  module.factory('simulationGenerator', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation', {}, {
        create: {
          method: 'POST',
          interceptor: {responseError: serverError.display}
        }
      });
    };
  }]);

  module.factory('simulationSDFWorld', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/sdf_world', {}, {
        export: {
          method: 'GET',
          interceptor: {responseError: serverError.display}
        },
        import: {
          method: 'PUT',
          interceptor: {responseError: serverError}
        }
      });
    };
  }]);

  module.factory('screenControl', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/interaction', {}, {
        updateScreenColor: {
          method: 'PUT',
          interceptor: {responseError: serverError.display}
        }
      });
    };
  }]);

  module.factory('experimentList', ['$resource', 'serverError', 'EXPERIMENTS_GET_TIMEOUT', function ($resource, serverError, EXPERIMENTS_GET_TIMEOUT) {
    return function (baseUrl) {
      return $resource(baseUrl + '/experiment', {}, {
        experiments: {
          method: 'GET',
          // prevent the user to wait for long time since our servers can only handle one request at a time (yet).
          timeout: EXPERIMENTS_GET_TIMEOUT,
          interceptor: {responseError: serverError.display}
        }
      });
    };
  }]);

  module.factory('experimentSimulationService', [
    '$q',
    '$http',
    '$stateParams',
    'bbpConfig',
    'simulationService',
    'simulationState',
    'simulationGenerator',
    'experimentList',
    'roslib',
    'STATE',
    'OPERATION_MODE',
    'serverError',
    'simulationSDFWorld',
    function (
      $q,
      $http,
      $stateParams,
      bbpConfig,
      simulationService,
      simulationState,
      simulationGenerator,
      experimentList,
      roslib,
      STATE,
      OPERATION_MODE,
      serverError,
      simulationSDFWorld)
    {
      var initializedCallback;
      var servers = bbpConfig.get('api.neurorobotics');
      var serverIDs = Object.keys(servers);
      var rosConnection;
      var statusListener;
      var shouldLaunchInEditMode = false;
      var setProgressMessage;

      var setShouldLaunchInEditMode = function (value) {
        shouldLaunchInEditMode = value;
      };

      var setProgressMessageCallback = function (callback) {
        setProgressMessage = callback;
      };

      var addSimulationToTemplate = function (experimentTemplates, activeSimulation) {
        angular.forEach(experimentTemplates, function (experimentTemplate) {
          //ToDo: Should not take the experimentConfiguration, but the experimentConfiguration of the template
          if (experimentTemplate.experimentConfiguration === activeSimulation.experimentConfiguration &&
            (experimentTemplate.serverPattern.indexOf(activeSimulation.serverID) > -1 )) {
            // Increase the number of running experiments for this template
            experimentTemplate.runningExperiments = ('runningExperiments' in experimentTemplate) ? experimentTemplate.runningExperiments + 1 : 1;
            // Add the 'simulations' variable to the template and create it if it does not exist
            if (!('simulations' in experimentTemplate)) {
              experimentTemplate.simulations = [];
            }
            experimentTemplate.simulations.push(activeSimulation);
          }
        });
      };

      var deleteSimulationFromTemplate = function (experimentTemplates, serverID) {
        angular.forEach(experimentTemplates, function (experimentTemplate, templateName) {
          angular.forEach(experimentTemplate.simulations, function (simulation, simulationIndex) {
            if (simulation.serverID === serverID) {
              // delete the outdated entry
              experimentTemplate.simulations.splice(simulationIndex, 1);
              experimentTemplate.runningExperiments -= 1;
            }
          });
        });
      };

      var searchAndUpdateExperimentTemplates = function (experimentTemplates, activeSimulation) {
        var found = false;
        angular.forEach(experimentTemplates, function (experimentTemplate, templateName) {
          angular.forEach(experimentTemplate.simulations, function (simulation, simulationIndex) {
            if (simulation.serverID === activeSimulation.serverID) {
              found = true;
              // Found the entry which is running on this server
              if ((simulation.experimentConfiguration !== activeSimulation.experimentConfiguration) ||
                (simulation.simulationID !== activeSimulation.simulationID) ||
                (simulation.state !== activeSimulation.state)) {
                // The simulation on this server changed:
                // delete the outdated entry
                experimentTemplate.simulations.splice(simulationIndex, 1);
                experimentTemplate.runningExperiments -= 1;

                // add the new entry to the right experimentTemplate
                addSimulationToTemplate(experimentTemplates, activeSimulation);
              }
            }
          });
        });
        return found;
      };

      // Refresh the experiment data structure
      var refreshExperiments = function (
        experimentTemplates,
        serversEnabled,
        isServerAvailableCallback,
        refreshFinishedCallback
      ) {
        // We will use this array to collect promises. Those can then be used in the
        // end for indicating when all loading is done.
        var requests = [];

        // This array stores if a server is available or not
        var serverAvailableHash = {};

        // Query each server to get the updated data
        angular.forEach(serverIDs, function (serverID) {
          // if server was disabled in developer UI, then exclude it
          if (serversEnabled.indexOf(serverID) > -1) {
            var serverNRPServicesURL = servers[serverID].gzweb['nrp-services'];

            // Create a deferred and store its promise.
            var deferred = $q.defer();
            requests.push(deferred.promise);

            simulationService({serverURL: serverNRPServicesURL, serverID: serverID}).simulations(function (data) {
              var activeSimulation = simulationService().getActiveSimulation(data);
              if (angular.isDefined(activeSimulation)) {
                // There is an active Simulation on this server:
                // Set the server as occupied
                serverAvailableHash[serverID] = false;
                // Search the data structure for an entry with this server
                var found = searchAndUpdateExperimentTemplates(experimentTemplates, activeSimulation);
                // Add simulation if it was not found
                if (!found) {
                  activeSimulation.stopping = false;
                  addSimulationToTemplate(experimentTemplates, activeSimulation);
                }
              }
              else {
                // On this server no experiment is running:
                // Set the server as available
                serverAvailableHash[serverID] = true;
                // Delete all elements in the data structure with this serverID
                deleteSimulationFromTemplate(experimentTemplates, serverID);
              }
            }).$promise.then(function () {
                // Since we got an answer (this may either be a "positive" answer or a bad answer, i.e. a server that
                // is offline), we resolve the respective deferred.
                deferred.resolve();
              });
          }
        });

        // After all promises are "fulfilled" we know that all requests have been processed.
        // Now we can see if there is a available Server
        $q.all(requests).then(function () {
          checkServerAvailability(experimentTemplates, serversEnabled, serverAvailableHash, isServerAvailableCallback);
          if(angular.isFunction(refreshFinishedCallback)) {
            refreshFinishedCallback();
          }
        });
      };

      // Fetches the Experiments
      var getExperiments = function (experimentTemplates) {
        // We will use this array to collect promises. Those can then be used in the
        // end for indicating when all loading is done.
        var requests = [];

        angular.forEach(serverIDs, function (serverID) {
          var serverNRPServicesURL = servers[serverID].gzweb['nrp-services'];

          // Create a deferred and store its promise.
          var deferred = $q.defer();
          requests.push(deferred.promise);

          // get experiment list from server and push into experimentTemplates
          experimentList(serverNRPServicesURL).experiments(function (data) {
            angular.forEach(data.data, function (experiment, index) {
              if (angular.isDefined(experimentTemplates[index])) {
                experimentTemplates[index].serverPattern.push(serverID);
              } else {
                experimentTemplates[index] = experiment;
                experimentTemplates[index].serverPattern = [serverID];
                $http.get(serverNRPServicesURL + '/experiment/' + index + '/preview').then(function (response) {
                  experimentTemplates[index].imageData = response.data.image_as_base64;
                });
              }
            });
          }).$promise.then(function () {
              // Since we got an answer (this may either be a "positive" answer or a bad answer, i.e. a server that
              // is offline), we resolve the respective deferred.
              deferred.resolve();
            });
        });

        // Return the promise, which is resolved, when all of the request promises are resolved
        return $q.all(requests);
      };

      var registerForStatusInformation = function (serverID, simulationID) {
        var rosbridgeWebsocketUrl = servers[serverID].rosbridge.websocket;
        var statusTopic = servers[serverID].rosbridge.topics.status;

        rosConnection = roslib.getOrCreateConnectionTo(rosbridgeWebsocketUrl);
        statusListener = roslib.createStringTopic(rosConnection, statusTopic);

        statusListener.subscribe(function (data) {
          var message = JSON.parse(data.data);
          if (message !== undefined && message.progress !== undefined) {
            if (message.progress.done !== undefined && message.progress.done) {
              statusListener.unsubscribe();
              statusListener.removeAllListeners();
              statusListener = undefined;
              rosConnection.close();
              rosConnection = undefined;
              setProgressMessage({main: 'Simulation initialized.'});
            } else {
              setProgressMessage({main: message.progress.task, sub: message.progress.subtask});
            }
          }
        });
      };

      // Checks if there is an available Server.
      var checkServerAvailability = function (experimentTemplates, serversEnabled, serverAvailableHash, isAvailableCallback) {
        // for each experiment
        angular.forEach(experimentTemplates, function (experimentTemplate, templateName) {

          // calculate supporting servers
          var supportingServerIDs = [];
          angular.forEach(serversEnabled, function(serverID) {
            // Does this server support this experiment?
            if (experimentTemplate.serverPattern.indexOf(serverID) > -1) {
              supportingServerIDs.push(serverID);
            }
          });
          experimentTemplate.numSupportingServers = supportingServerIDs.length;

          // calculate available servers
          var availableServerCount = 0;
          angular.forEach(supportingServerIDs, function(serverID) {
            if (serverAvailableHash[serverID] === true) {
              availableServerCount = availableServerCount + 1;
            }
          });
          experimentTemplate.numAvailableServers = availableServerCount;

          // set if a server is available for running the experiment
          if (angular.isFunction(isAvailableCallback)) {
            if (availableServerCount > 0) {
              isAvailableCallback(templateName, true);
            } else {
              isAvailableCallback(templateName, false);
            }
          }
        });
      };

      var startNewExperiments = function (expConf, envSDFData, serversEnabled, serverPattern, errorCallback) {
        var keepGoing = true;
        angular.forEach(serverIDs, function (serverID) {
          if (keepGoing && (serversEnabled.indexOf(serverID) > -1)) {
            if (serverPattern.indexOf(serverID) > -1) {
              var serverURL = servers[serverID].gzweb['nrp-services'];
              simulationService({serverURL: serverURL, serverID: serverID}).simulations(function (data) {
                var activeSimulation = simulationService().getActiveSimulation(data);
                if (!angular.isDefined(activeSimulation)) {
                  if (keepGoing) {
                    keepGoing = false;

                    // Need to send the SDF to the backend before launching the experiment
                    if (angular.isDefined(envSDFData) && envSDFData !== null) {
                      simulationSDFWorld(serverURL).import({sdf: envSDFData}, function (data) {
                        experimentSimulationService.launchExperimentOnServer(expConf, data.path, serverID, errorCallback);
                      });
                    }
                    else {
                      experimentSimulationService.launchExperimentOnServer(expConf, null, serverID, errorCallback);
                    }
                  }
                }
              });
            }
          }
        });
      };

      var launchExperimentOnServer = function (
        experimentConfiguration,
        environmentConfiguration,
        freeServerID,
        errorCallback)
      {
        setProgressMessage({main: 'Create new Simulation...'});
        var serverURL = servers[freeServerID].gzweb['nrp-services'];

        // In case the config does specify where to run, we take the value from the config file. If there is no hint,
        // we fallback to "local".
        var serverJobLocation = servers[freeServerID].serverJobLocation ? servers[freeServerID].serverJobLocation : 'local';
        var operationMode = (shouldLaunchInEditMode ? OPERATION_MODE.EDIT : OPERATION_MODE.VIEW);

        var simInitData = {
          experimentConfiguration: experimentConfiguration,
          gzserverHost: serverJobLocation,
          operationMode: operationMode,
          contextID: $stateParams.ctx
        };

        var errorDisplayFunction = function (errorData) {
          serverError.display(errorData);
          errorCallback();
        };

        if (angular.isDefined(environmentConfiguration) && environmentConfiguration !== null) {
          simInitData.environmentConfiguration = environmentConfiguration;
        }

        // Create a new simulation.
        simulationGenerator(serverURL).create(simInitData, function (createData) {
          setProgressMessage({main: 'Initialize Simulation...'});
          // register for messages during initialization
          registerForStatusInformation(freeServerID, createData.simulationID);

          // initialize the newly created simulation, then goto STARTED and then PAUSED
          simulationState(serverURL).update({sim_id: createData.simulationID}, {state: STATE.INITIALIZED},
            function () {
              simulationState(serverURL).update({sim_id: createData.simulationID}, {state: STATE.STARTED},
                function () {
                  simulationState(serverURL).update({sim_id: createData.simulationID}, {state: STATE.PAUSED},
                    // Now join the simulation
                    function () {
                      var url = 'esv-web/gz3d-view/' + freeServerID + '/' + createData.simulationID + '/' + operationMode;
                      if (angular.isDefined(initializedCallback)) {
                        initializedCallback(url);
                      }
                    },
                    errorDisplayFunction
                  );
                },
                errorDisplayFunction
              );
            },
            errorDisplayFunction
          );
        });
      };

      var stopExperimentOnServer = function (
        experimentTemplates,
        serverID,
        simulationID)
      {
        var deferred = $q.defer();

        var serverURL = servers[serverID].gzweb['nrp-services'];
        var simStateInstance = simulationState(serverURL);

        simStateInstance.state({sim_id: simulationID}, function(data){
          switch (data.state) {
            case STATE.INITIALIZED:
              simStateInstance.update({sim_id: simulationID}, {state: STATE.STARTED}, function () {
                simStateInstance.update({sim_id: simulationID}, {state: STATE.STOPPED}, function () {
                  // Delete all elements in the data structure with this serverID
                  deleteSimulationFromTemplate(experimentTemplates, serverID);
                  deferred.resolve();
                });
              });
              break;
            case STATE.STARTED:
            case STATE.PAUSED:
              simStateInstance.update({sim_id: simulationID}, {state: STATE.STOPPED}, function () {
                // Delete all elements in the data structure with this serverID
                deleteSimulationFromTemplate(experimentTemplates, serverID);
                deferred.resolve();
              });
              break;
          }
        });
        return deferred.promise;
      };

      var setInitializedCallback = function (callback) {
        initializedCallback = callback;
      };

      var getServersEnable = function() {
        var result = [];
        var serversEnabledFromLocalStorage = localStorage.getItem('server-enabled');
        if (serversEnabledFromLocalStorage) {
          result = angular.fromJson(serversEnabledFromLocalStorage);
        }
        else {
          angular.forEach(serverIDs, function (server) {
            // Temporary: Lugano servers are the only one with a working camera.
            // For the moment, it preselects only Lugano servers.
            if (server.indexOf('bbpsrvc') > -1) {
              result.push(server);
            }
          });
        }
        return result;
      };

      var startNewExperiment = function (expConf, envConf, serverPattern, errorCallback) {
        experimentSimulationService.setShouldLaunchInEditMode(false);
        experimentSimulationService.startNewExperiments(expConf, envConf, this.getServersEnable(), serverPattern, errorCallback);
      };

      var enterEditMode = function (expConf, envConf, serverPattern, errorCallback) {
        experimentSimulationService.setShouldLaunchInEditMode(true);
        experimentSimulationService.startNewExperiments(expConf, envConf, this.getServersEnable(), serverPattern, errorCallback);
      };

      // Public methods of the service
      var experimentSimulationService = {
        getExperiments: getExperiments,
        refreshExperiments: refreshExperiments,
        registerForStatusInformation: registerForStatusInformation,
        existsAvailableServer: checkServerAvailability,
        startNewExperiments: startNewExperiments,
        launchExperimentOnServer: launchExperimentOnServer,
        stopExperimentOnServer: stopExperimentOnServer,
        setInitializedCallback: setInitializedCallback,
        setProgressMessageCallback: setProgressMessageCallback,
        setShouldLaunchInEditMode: setShouldLaunchInEditMode,
        getServersEnable: getServersEnable,
        startNewExperiment: startNewExperiment,
        enterEditMode: enterEditMode
      };

      return experimentSimulationService;

    }]);
}());
