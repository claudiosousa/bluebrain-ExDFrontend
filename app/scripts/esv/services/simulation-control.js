(function () {
  'use strict';

  /* global console: false */

  angular.module('exdFrontendApp.Constants')
    .constant('DEFAULT_RESOURCE_GET_TIMEOUT', 3000 // ms
  );

  var module = angular.module('simulationControlServices', ['ngResource', 'exdFrontendApp.Constants', 'exdFrontendFilters', 'nrpErrorHandlers', 'bbpConfig', 'hbpCommon']);

  module.factory('simulationService', ['$resource', '$http', 'hbpUserDirectory', 'STATE', 'serverError', 'uptimeFilter','DEFAULT_RESOURCE_GET_TIMEOUT',
    function ($resource, $http, hbpUserDirectory, STATE, serverError, uptimeFilter, DEFAULT_RESOURCE_GET_TIMEOUT) {

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
                hbpUserDirectory.get([element.owner]).then(function (profile) {
                  owners[element.owner] = getUserName(profile);
                });
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
                if (response.status !== 504) {
                  serverError(response);
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
          interceptor: {responseError: serverError}
        }
      });
    };
  }]);

  module.factory('simulationState', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/state', {}, {
        state: {
          method: 'GET',
          interceptor: {responseError: serverError}
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
          interceptor: {responseError: serverError}
        }
      });
    };
  }]);

  module.factory('simulationSDFWorld', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/sdf_world', {}, {
        export: {
          method: 'GET',
          interceptor: {responseError: serverError}
        },
        import: {
          method: 'PUT'
        }
      });
    };
  }]);

  module.factory('screenControl', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/interaction', {}, {
        updateScreenColor: {
          method: 'PUT',
          interceptor: {responseError: serverError}
        }
      });
    };
  }]);

  module.factory('experimentList', ['$resource', 'serverError', 'DEFAULT_RESOURCE_GET_TIMEOUT', function ($resource, serverError, DEFAULT_RESOURCE_GET_TIMEOUT) {
    return function (baseUrl) {
      return $resource(baseUrl + '/experiment', {}, {
        experiments: {
          method: 'GET',
          // prevent the user to wait for long time since our servers can only handle one request at a time (yet).
          timeout: DEFAULT_RESOURCE_GET_TIMEOUT,
          interceptor: {responseError: serverError}
        }
      });
    };
  }]);

  module.factory('experimentSimulationService', ['$q', '$http', 'bbpConfig', 'simulationService', 'simulationState', 'simulationGenerator', 'experimentList', 'roslib', 'STATE', 'OPERATION_MODE', 'serverError',
    function ($q, $http, bbpConfig, simulationService, simulationState, simulationGenerator, experimentList, roslib, STATE, OPERATION_MODE, serverError) {
      var setProgressMessageCallback;
      var queryingServersFinishedCallback;
      var initializedCallback;
      var servers = bbpConfig.get('api.neurorobotics');
      var serverIDs = Object.keys(servers);
      var rosConnection;
      var statusListener;
      var shouldLaunchInEditMode = false;

      var setShouldLaunchInEditMode = function (value) {
        shouldLaunchInEditMode = value;
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
      var refreshExperiments = function (experimentTemplates, serversEnabled, isServerAvailableCallback) {

        // We will use this array to collect promises. Those can then be used in the
        // end for indicating when all loading is done.
        var requests = [];

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
                // Search the data structure for an entry with this server
                var found = searchAndUpdateExperimentTemplates(experimentTemplates, activeSimulation);
                // Add simulation if it was not found
                if (!found) {
                  addSimulationToTemplate(experimentTemplates, activeSimulation);
                }
              }
              else {
                // On this server no experiment is running:
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
          checkServerAvailability(experimentTemplates, serversEnabled, isServerAvailableCallback);
        });
      };

      // Fetches the Experiments
      var getExperiments = function (experimentTemplates, serversEnabled, progressMessageCallback, queryingServersFinishedCb, setIsServerAvailable) {
        setProgressMessageCallback = progressMessageCallback;
        queryingServersFinishedCallback = queryingServersFinishedCb;


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

        // After all promises are "fulfilled" we know that all requests have been processed.
        // Now we can see if there is a available Server
        $q.all(requests).then(function () {
          refreshExperiments(experimentTemplates, serversEnabled, setIsServerAvailable);
        });
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
              setProgressMessageCallback({main: 'Simulation initialized.'});
              var operationMode = (shouldLaunchInEditMode ? OPERATION_MODE.EDIT : OPERATION_MODE.VIEW);
              var url = 'esv-web/gz3d-view/' + serverID + '/' + simulationID + '/' + operationMode;
              if (angular.isDefined(initializedCallback)) {
                initializedCallback(url);
              }
            } else {
              setProgressMessageCallback({main: message.progress.task, sub: message.progress.subtask});
            }
          }
        });
      };

      // Checks if there is an available Server.
      var checkServerAvailability = function (experimentTemplates, serversEnabled, isAvailableCallback) {
        // We will use this array to collect promises. Those can then be used in the
        // end for indicating when all loading is done.
        var requests = [];


        // for each experiment
        angular.forEach(experimentTemplates, function (experimentTemplate, templateName) {
          experimentTemplate.numSupportingServers = 0;
          experimentTemplate.numAvailableServers = 0;
        });

        // for each server
        angular.forEach(serverIDs, function (serverID) {
          // if server was disabled in developer UI, then exclude it
          if (serversEnabled.indexOf(serverID) > -1) {

            var serverURL = servers[serverID].gzweb['nrp-services'];

            angular.forEach(experimentTemplates, function (experimentTemplate, templateName) {
              if (experimentTemplate.serverPattern.indexOf(serverID) > -1) {
                experimentTemplate.numSupportingServers = experimentTemplate.numSupportingServers + 1;
                console.log('Server ' + serverURL + ' can host experiment ' + templateName);
              }
            });

            // Create a deferred and store its promise.
            var deferred = $q.defer();
            requests.push(deferred.promise);

            simulationService({serverURL: serverURL, serverID: serverID}).simulations(function (data) {
              var activeSimulation = simulationService().getActiveSimulation(data);
              angular.forEach(experimentTemplates, function (experimentTemplate, templateName) {
                // check if server can run experiment
                if (experimentTemplate.serverPattern.indexOf(serverID) > -1 && !angular.isDefined(activeSimulation)) {
                    // server is free
                    experimentTemplate.numAvailableServers = experimentTemplate.numAvailableServers + 1;
                    isAvailableCallback(templateName, true);
                }
              });
            }).$promise.then(function () {
                // Since we got an answer (this may either be a "positive" answer or a bad answer, i.e. a server that
                // is offline), we resolve the respective deferred.
                deferred.resolve();
              });
          }
        });

        // After all promises are "fulfilled" we know that all requests have been processed.
        // Now we are done with all queries
        $q.all(requests).then(function () {
          queryingServersFinishedCallback();
        });

      };

      var startNewExperiments = function (id, serversEnabled, serverPattern, errorCallback) {
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
                    launchExperimentOnServer(id, serverID, errorCallback);
                  }
                }
              });
            }
          }
        });
      };

      var launchExperimentOnServer = function (experimentConfiguration, freeServerID, errorCallback) {
        setProgressMessageCallback({main: 'Create new Simulation...'});
        var serverURL = servers[freeServerID].gzweb['nrp-services'];

        // In case the config does specify where to run, we take the value from the config file. If there is no hint,
        // we fallback to "local".
        var serverJobLocation = servers[freeServerID].serverJobLocation ? servers[freeServerID].serverJobLocation : 'local';
        var operationMode = (shouldLaunchInEditMode ? OPERATION_MODE.EDIT : OPERATION_MODE.VIEW);

        // Create a new simulation.
        simulationGenerator(serverURL).create({
          experimentConfiguration: experimentConfiguration,
          gzserverHost: serverJobLocation,
          operationMode: operationMode
        }, function (createData) {
          setProgressMessageCallback({main: 'Initialize Simulation...'});
          // register for messages during initialization
          registerForStatusInformation(freeServerID, createData.simulationID);

          // initialize the newly created simulation
          simulationState(serverURL).update({sim_id: createData.simulationID}, {state: STATE.INITIALIZED},
            /* istanbul ignore next */
            function () {
              // This function is just a dummy and not used
              // Going to the GZ3D-Page is done in the "registerForStatusInformation" function on success
            },
            function (updateData) {
              serverError(updateData);
              errorCallback();
            }
          );
        });
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
            // Temporary: as soon as Lugano server are stable enough, remove it.
            // For the moment, it preselect only geneva servers.
            if (server.indexOf('bbpce') > -1) {
              result.push(server);
            }
          });
        }
        return result;
      };

      // Public methods of the service
      return {
        getExperiments: getExperiments,
        refreshExperiments: refreshExperiments,
        registerForStatusInformation: registerForStatusInformation,
        existsAvailableServer: checkServerAvailability,
        startNewExperiments: startNewExperiments,
        launchExperimentOnServer: launchExperimentOnServer,
        setInitializedCallback: setInitializedCallback,
        setShouldLaunchInEditMode: setShouldLaunchInEditMode,
        getServersEnable: getServersEnable
      };

    }]);
}());
