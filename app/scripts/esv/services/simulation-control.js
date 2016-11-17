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

  module.factory('simulationControl', ['$resource', 'serverError', function ($resource, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id', {}, {
        simulation: {
          method: 'GET',
          interceptor: { responseError: serverError.display }
        }
      });
    };
  }]);

  module.factory('simulationCreationInterceptor', ['$q', '$log', 'serverError', function ($q, $log, serverError) {
    // white list of non-fatal error regexps
    var NON_FATAL_ERRORS_WHITELIST = [
      'Another',
      'timeout',
      /previous one.*terminated/
    ];

    //returns true if the error is unlisted as blocking or is a cluster error
    var isFatalError = function (error) {
      if (!error.data) {
        return true;
      }
      var errorMsg = error.data.message || error.data;
      if (!angular.isString(errorMsg) || (errorMsg.indexOf('cluster') >= 0) || (errorMsg.indexOf('Internal') >= 0)) {
        return true;
      }
      return !_.some(NON_FATAL_ERRORS_WHITELIST, function (nonFatalErrMsg) {
        return errorMsg.match(nonFatalErrMsg);
      });
    };
    return function (error) {
      var isFatal = isFatalError(error);
      if (isFatal) {
        // If it is a fatal error, then we go through the normal error handling
        serverError.display(error, true);
      } else {
        // Log error on console
        $log.debug(error);
      }
      return $q.reject({ error: error, isFatal: isFatal });
    };
  }]);

  module.factory('simulationState', ['$resource', 'simulationCreationInterceptor', 'serverError', function ($resource, simulationCreationInterceptor, serverError) {
    return function (baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/state', {}, {
        state: {
          method: 'GET',
          interceptor: { responseError: serverError.display }
        },
        update: { // this method initializes, starts, stops, or pauses the simulation
          method: 'PUT',
          interceptor: {
            responseError: simulationCreationInterceptor
          }
        }
      });
    };
  }]);

  module.factory('simulationGenerator', ['$resource', 'simulationCreationInterceptor', function ($resource, simulationCreationInterceptor) {
    return function (baseUrl) {

      return $resource(baseUrl + '/simulation', {}, {
        create: {
          method: 'POST',
          interceptor: {
            responseError: simulationCreationInterceptor
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
          interceptor: { responseError: serverError.display }
        },
        import: {
          method: 'PUT',
          interceptor: { responseError: serverError }
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
      return $resource(baseUrl + '/experiment/:context_id', {}, {
        experiments: {
          method: 'GET',
          // prevent the user to wait for long time since our servers can only handle one request at a time (yet).
          timeout: EXPERIMENTS_GET_TIMEOUT,
          interceptor: { responseError: serverError.display }
        }
      });
    };
  }]);

  module.factory('experimentSimulationService', [
    '$q', '$http', '$log', '$timeout', '$stateParams', 'nrpAnalytics',
    'simulationState', 'simulationGenerator', 'roslib', 'STATE', 'simulationSDFWorld', 'experimentProxyService', 'bbpConfig',
    function ($q, $http, $log, $timeout, $stateParams, nrpAnalytics, simulationState,
      simulationGenerator, roslib, STATE, simulationSDFWorld, experimentProxyService, bbpConfig) {
      var rosConnection, statusListener;

      var registerForStatusInformation = function (rosbridgeConfiguration, setProgressMessage) {
        function destroyCurrentConnection() {
          if (statusListener) {
            statusListener.unsubscribe();
            statusListener.removeAllListeners();
            statusListener = undefined;
          }
          rosConnection = undefined;
        }

        destroyCurrentConnection();

        rosConnection = roslib.getOrCreateConnectionTo(rosbridgeConfiguration.websocket);
        statusListener = roslib.createStringTopic(rosConnection, bbpConfig.get('ros-topics').status);

        statusListener.subscribe(function (data) {
          var message = JSON.parse(data.data);
          if (message && message.progress) {
            if (message.progress.done) {
              destroyCurrentConnection();
              setProgressMessage({ main: 'Simulation initialized.' });
            } else {
              setProgressMessage({ main: message.progress.task, sub: message.progress.subtask });
            }
          }
        });
      };

      var launchExperimentInPossibleServers = function (experiment, launchSingleMode, envSDFData) {

        var fatalErrorOccurred = false,
          serversToTry = experiment.devServer ? [experiment.devServer] : _.clone(experiment.availableServers);

        var brainProcesses = (launchSingleMode) ? 1 : experiment.configuration.brainProcesses;

        var oneSimulationFailed = function (failure) {
          if (failure.error && failure.error.data) {
            $log.error('Failed to start simulation: ' + angular.toJson(failure.error.data));
          }
          fatalErrorOccurred = fatalErrorOccurred || failure.isFatal;
          return $q.reject(failure);
        };

        function launchInServer(server) {
          return experimentProxyService.getServerConfig(server)
            .then(function (serverConfig) {
              function launch(environmentConfiguration) {
                return launchExperimentOnServer(experiment.configuration.experimentConfiguration, environmentConfiguration, brainProcesses, server, serverConfig)
                  .catch(oneSimulationFailed);
              }
              if (envSDFData) {
                return simulationSDFWorld(serverConfig.gzweb['nrp-services']).import({ sdf: envSDFData }).$promise
                  .then(launch);
              } else {
                return launch();
              }
            });
        }

        function launchInNextServer() {
          var nextServer = serversToTry.splice(0, 1);
          if (fatalErrorOccurred || !nextServer.length) { //no more servers to retry, we have failed to start experiment
            return $q.reject(fatalErrorOccurred);
          }

          return launchInServer(nextServer[0]).catch(launchInNextServer); //try with nextServer, catch => launchInNextServer
        }

        return launchInNextServer();
      };

      var launchExperimentOnServer = function (experimentConfiguration, environmentConfiguration, brainProcesses, server, serverConfiguration) {
        var deferred = $q.defer();

        _.defer(function () { deferred.notify({ main: 'Create new Simulation...' }); }); //called once caller has the promise

        var serverURL = serverConfiguration.gzweb['nrp-services'];
        var serverJobLocation = serverConfiguration.serverJobLocation || 'local';

        var simInitData = {
          experimentConfiguration: experimentConfiguration,
          gzserverHost: serverJobLocation,
          contextID: $stateParams.ctx,
          brainProcesses: brainProcesses
        };

        if (!!environmentConfiguration) {
          simInitData.environmentConfiguration = environmentConfiguration.path;
        }

        // Create a new simulation.
        simulationGenerator(serverURL).create(simInitData).$promise
          .then(function (createData) {
            deferred.notify({ main: 'Initialize Simulation...' });
            // register for messages during initialization
            registerForStatusInformation(serverConfiguration.rosbridge, deferred.notify);

            function updateSimulationState(state) {
              return simulationState(serverURL).update({ sim_id: createData.simulationID }, { state: state }).$promise;
            }
            // initialize the newly created simulation
            return updateSimulationState(STATE.INITIALIZED)
              .then(function () { deferred.resolve('esv-web/gz3d-view/' + server + '/' + createData.simulationID); });
          }).catch(function (err) {
            deferred.reject(err);
          });

        return deferred.promise;
      };

      var stopExperimentOnServer = function (simulation) {
        var deferred = $q.defer();

        experimentProxyService.getServerConfig(simulation.server)
          .then(function (serverConfig) {
            var simStateInstance = simulationState(serverConfig.gzweb['nrp-services']);

            function updateSimulationState(state) {
              return simStateInstance.update({ sim_id: simulation.runningSimulation.simulationID }, { state: state }).$promise;
            }

            return simStateInstance.state({ sim_id: simulation.runningSimulation.simulationID }).$promise
              .then(function (data) {
                if (!data || !data.state) {
                  return $q.reject();
                }
                switch (data.state) {
                  case STATE.CREATED: //CREATED --(initialize)--> PAUSED --(stop)--> STOPPED
                    return updateSimulationState(STATE.INITIALIZED).then(_.partial(updateSimulationState, STATE.STOPPED));
                  case STATE.STARTED: //STARTED --(stop)--> STOPPED
                  case STATE.PAUSED:  //PAUSED  --(stop)--> STOPPED
                  case STATE.HALTED:  //HALTED  --(stop)--> FAILED
                    return updateSimulationState(STATE.STOPPED);
                }
              });
          })
          .then(deferred.resolve)
          .catch(deferred.reject);
        return deferred.promise;
      };

      var startNewExperiment = function (experiment, launchSingleMode, envSDFData) {
        nrpAnalytics.eventTrack('Start', { category: 'Experiment' });
        nrpAnalytics.tickDurationEvent('Server-initialization');

        return launchExperimentInPossibleServers(experiment, launchSingleMode, envSDFData);
      };

      // Public methods of the service
      var experimentSimulationService = {
        stopExperimentOnServer: stopExperimentOnServer,
        startNewExperiment: startNewExperiment
      };

      return experimentSimulationService;

    }]);
} ());
