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
    'nrpAngulartics',
    'bbpConfig',
    'hbpCommon']);

  module.factory('simulationService', ['$resource', '$http', 'bbpConfig', 'hbpIdentityUserDirectory', 'STATE',
    'serverError', 'uptimeFilter','DEFAULT_RESOURCE_GET_TIMEOUT',
    function ($resource, $http, bbpConfig, hbpIdentityUserDirectory, STATE,
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
                  hbpIdentityUserDirectory.get([element.owner]).then(function (profile) {
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
      var filterSimulations = function (simulations, predicate) {
        var length = simulations.length;
        for (var i = length - 1; i >= 0; i -= 1) { // the largest indices correspond to the newest objects
          var simulation = simulations[i];
          var state = simulation.state;
          if (predicate(state)) {
            return simulation;
          }
        }
        return undefined;
      };

      // Retrieve the latest active simulation, i.e., the simulation with the highest index which is neither stopped nor failed
      // If there is no simulation object on the server,
      // the active simulation remains undefined
      var getActiveSimulation = function (simulations) {
        return filterSimulations(simulations, function (state) {
          return state !== STATE.FAILED && state !== STATE.STOPPED;
        });
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

  module.factory('simulationCreationInterceptor', ['$q', '$log', 'serverError', function ($q, $log, serverError) {
    return function (customErrorCallback) {
      //returns true if the error is unlisted as blocking or is a cluster error
      var isFatalError = function (error) {
        if (!error.data) {
          return true;
        }
        var errorMsg = error.data.message || error.data;
        if (!angular.isString(errorMsg) || (errorMsg.indexOf('cluster') >= 0) || (errorMsg.indexOf('Internal') >= 0)) {
          return true;
        }
        if ((errorMsg.indexOf('Another') >= 0) || (errorMsg.indexOf('timeout') >= 0)) {
          return false; // white list of non-fatal errors
        }
        return true;
      };
      return function (error) {
        var isFatal = isFatalError(error);
        if (isFatal) {
          // If it is a fatal error, then we go through the normal error handling
          serverError.display(error);
        } else {
          // Log error on console
          $log.debug(error);
        }
        // Call custom error handling
        if (customErrorCallback) {
          customErrorCallback(error, isFatal);
        }
        return $q.reject(error);
      };
    };
  }]);

  module.factory('simulationState', ['$resource', 'simulationCreationInterceptor','serverError', function ($resource, simulationCreationInterceptor,serverError) {
    return function (baseUrl, customErrorCallback) {
      return $resource(baseUrl + '/simulation/:sim_id/state', {}, {
        state: {
          method: 'GET',
          interceptor: {responseError: serverError.display}
        },
        update: { // this method initializes, starts, stops, or pauses the simulation
          method: 'PUT',
          interceptor: {
            responseError: simulationCreationInterceptor(customErrorCallback)
          }
        }
      });
    };
  }]);

  module.factory('simulationGenerator', ['$resource', 'simulationCreationInterceptor', function ($resource, simulationCreationInterceptor) {
    return function (baseUrl, customErrorCallback) {

      return $resource(baseUrl + '/simulation', {}, {
        create: {
          method: 'POST',
          interceptor: {
            responseError: simulationCreationInterceptor(customErrorCallback)
          }
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

  module.factory('objectControl', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/interaction/material_change', {}, {
        updateMaterial: {
          method: 'PUT',
          interceptor: { responseError: serverError.display }
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
    '$log',
    '$timeout',
    'nrpAnalytics',
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
    'hbpDialogFactory',
    function (
      $q,
      $http,
      $log,
      $timeout,
      nrpAnalytics,
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
      simulationSDFWorld,
      hbpDialogFactory)
    {
      var initializedCallback;
      var servers = bbpConfig.get('api.neurorobotics');
      var serverIDs = Object.keys(servers);
      var rosConnection;
      var statusListener;
      var setProgressMessage;


      var setProgressMessageCallback = function (callback) {
        setProgressMessage = callback;
      };

      var getContextlessSimulations = function(experimentTemplate){
        return experimentTemplate.simulations.filter(function(sim){return !sim.contextID;});
      };

      var addSimulationToTemplate = function (experimentTemplates, activeSimulation) {
        angular.forEach(experimentTemplates, function (experimentTemplate) {
          //ToDo: Should not take the experimentConfiguration, but the experimentConfiguration of the template
          if (experimentTemplate.experimentConfiguration === activeSimulation.experimentConfiguration &&
            (experimentTemplate.serverPattern.indexOf(activeSimulation.serverID) > -1)) {
            // Increase the number of running experiments for this template
            experimentTemplate.runningExperiments = ('runningExperiments' in experimentTemplate) ? experimentTemplate.runningExperiments + 1 : 1;
            // Add the 'simulations' variable to the template and create it if it does not exist
            if (!('simulations' in experimentTemplate)) {
              experimentTemplate.simulations = [];
            }
            experimentTemplate.simulations.push(activeSimulation);
            experimentTemplate.contextlessSimulations = getContextlessSimulations(experimentTemplate);
          }
        });
      };

      var deleteSimulationFromTemplate = function (experimentTemplates, serverID) {
        angular.forEach(experimentTemplates, function (experimentTemplate) {
          angular.forEach(experimentTemplate.simulations, function (simulation, simulationIndex) {
            if (simulation.serverID === serverID) {
              // delete the outdated entry
              experimentTemplate.simulations.splice(simulationIndex, 1);
              experimentTemplate.runningExperiments -= 1;
              experimentTemplate.contextlessSimulations = getContextlessSimulations(experimentTemplate);
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

      var launchExperimentInPossibleServers = function (possibleServers, expConf, envSDFData, errorCallback) {
        var foundAfreeServer = false;

        var serverStatus = {
          ERROR: 'ERROR', //failed to run simulation on the server
          FATAL: 'FATAL', //failed FATALLY to run simulation on the server
          SUCCESS: 'SUCCESS', //successfully started a simulation
          BUSY: 'BUSY', //this server already has a running simulation
          SKIPPED: 'SKIPPED' //skipped server because we started the simulation on another server
        };

        //we go through all servers and determine their status
        $q.all(possibleServers.map(function (serverID) {
          var serverURL = servers[serverID].gzweb['nrp-services'];
          var deferred = $q.defer();
          var serverResult = {
            serverID: serverID,
            status: deferred.promise
          };

          var failed2startSimulation = function (error, isFatal) {
            if (error && error.data) {
              $log.error('Failed to start simulation: ' + angular.toJson(error.data));
            }
            deferred.resolve(isFatal ? serverStatus.FATAL : serverStatus.ERROR);
          };

          var succeededStartingSimulation = function () {
            deferred.resolve(serverStatus.SUCCESS);
          };

          simulationService({ serverURL: serverURL, serverID: serverID }).simulations(function (data) {
            var activeSimulation = simulationService().getActiveSimulation(data);

            if (angular.isDefined(activeSimulation)) {
              //current server is busy
              deferred.resolve(serverStatus.BUSY);
              return;
            }

            if (foundAfreeServer) {
              deferred.resolve(serverStatus.SKIPPED);
              return;
            }

            foundAfreeServer = true;
            // Need to send the SDF to the backend before launching the experiment
            if (angular.isDefined(envSDFData) && envSDFData !== null) {
              simulationSDFWorld(serverURL).import({ sdf: envSDFData }, function (data) {
                experimentSimulationService.launchExperimentOnServer(expConf, data.path, serverID, failed2startSimulation, succeededStartingSimulation);
              });
            }
            else {
              experimentSimulationService.launchExperimentOnServer(expConf, null, serverID, failed2startSimulation, succeededStartingSimulation);
            }
          }, failed2startSimulation);

          return $q.all(serverResult);
        })).then(function (serversStatus) { //once the status for all server is determined

          var aServerHasSucceeded = serversStatus.some(function (server) {
            return server.status === serverStatus.SUCCESS;
          });

          //if we successfuly started a simulation, then the job is done
          if (aServerHasSucceeded) {
            return;
          }

          var fatalErrorOccured = serversStatus.some(function (server) {
            return server.status === serverStatus.FATAL;
          });

          var skippedServers = serversStatus.filter(function (server) {
            return server.status === serverStatus.SKIPPED;
          }).map(function (server) {
            return server.serverID;
          });

          // if fatal errors occured, then it is likely that there are issues allocating jobs on the cluster
          // in this case, we don't want to keep retrying on other servers because they are likely to fail with the same reason
          if (!fatalErrorOccured && skippedServers.length > 0) {
            //if no fatal error occured, and some servers were skipped, then let's retry on those available servers
            launchExperimentInPossibleServers(skippedServers, expConf, envSDFData, errorCallback);
            return;
          }

          if (!fatalErrorOccured) {
            //displays geneeric error message only if so fatal error occured
            //fatal errors are handled (and displayed) by the genereic http error interceptor
            hbpDialogFactory.alert(
              {
                title: 'No server is currently available',
                template: 'No server can handle your simulation at the moment. Please try again later'
              });
          }
          //we failed to start the simulation
          errorCallback();
        });
      };

      var startNewExperiments = function (expConf, envSDFData, serversEnabled, serverPattern, errorCallback) {

        //possible servers are the servers that selected by the user
        var possibleServers = serverIDs.filter(function (serverID) {
          return serversEnabled.indexOf(serverID)>=0 && serverPattern.indexOf(serverID)>=0;
        });

        launchExperimentInPossibleServers(possibleServers, expConf, envSDFData, errorCallback);
      };

      var launchExperimentOnServer = function (
        experimentConfiguration,
        environmentConfiguration,
        freeServerID,
        errorCallback,
        successCallback) {
        setProgressMessage({main: 'Create new Simulation...'});
        var serverURL = servers[freeServerID].gzweb['nrp-services'];

        // In case the config does specify where to run, we take the value from the config file. If there is no hint,
        // we fallback to "local".
        var serverJobLocation = servers[freeServerID].serverJobLocation ? servers[freeServerID].serverJobLocation : 'local';
        var operationMode = OPERATION_MODE.EDIT;

        var simInitData = {
          experimentConfiguration: experimentConfiguration,
          gzserverHost: serverJobLocation,
          operationMode: operationMode,
          contextID: $stateParams.ctx
        };

        if (angular.isDefined(environmentConfiguration) && environmentConfiguration !== null) {
          simInitData.environmentConfiguration = environmentConfiguration;
        }

        // Create a new simulation.
        simulationGenerator(serverURL, errorCallback).create(simInitData, function (createData) {
          setProgressMessage({ main: 'Initialize Simulation...' });
          // register for messages during initialization
          registerForStatusInformation(freeServerID, createData.simulationID);

          // initialize the newly created simulation, then goto STARTED and then PAUSED
          simulationState(serverURL, errorCallback).update({ sim_id: createData.simulationID }, { state: STATE.INITIALIZED },
            function () {
              simulationState(serverURL, errorCallback).update({ sim_id: createData.simulationID }, { state: STATE.STARTED },
                function () {
                  simulationState(serverURL, errorCallback).update({ sim_id: createData.simulationID }, { state: STATE.PAUSED },
                    // Now join the simulation
                    function () {
                      var url = 'esv-web/gz3d-view/' + freeServerID + '/' + createData.simulationID + '/' + operationMode;
                      if (angular.isDefined(successCallback)) {
                        successCallback(url);
                      }
                      if (angular.isDefined(initializedCallback)) {
                        initializedCallback(url);
                      }
                    }
                  );
                }
              );
            }
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

      var getHealthyServers = function () {
        //dictionary of server states used in sorting
        var healthStatusPriority = {
          OK: 1,
          WARNING: 2,
          CRITICAL: 3
        };

        return $q.all(serverIDs.map(function (serverID) {
          var server = servers[serverID];
          var response = {
            id: serverID,
            health: $http.get(server.gzweb['nrp-services'] + '/health/errors')
          };
          return $q.all(response).catch(function () {
            //if we failed to receive a response to the health request,
            //we consider the server to be in critical state
            response.health = { data: { state: 'CRITICAL' } };
            return response;
          });
        })).then(function (serverList) {
          //return the server ids sorted by health status
          return serverList
            .map(function (s) {
              s.priority = healthStatusPriority[s.health.data.state] || 9;//unknown status come at the end
              return s;
            })
            .sort(function (s1, s2) {
              return s1.priority - s2.priority;
            })
            .map(function (s) {
              return { id: s.id, state: s.health.data.state };
            });
        });
      };

      var startNewExperiment = function (expConf, envConf, serverPattern, errorCallback) {

        experimentSimulationService.startNewExperiments(expConf, envConf, this.getServersEnable(), serverPattern, errorCallback);

        nrpAnalytics.eventTrack('Start', {
          category: 'Experiment'
        });
        nrpAnalytics.tickDurationEvent('Server-initialization');
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
        getServersEnable: getServersEnable,
        startNewExperiment: startNewExperiment,
        getHealthyServers: getHealthyServers
      };

      return experimentSimulationService;

    }]);
}());
