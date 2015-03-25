(function() {
  'use strict';

  /* global console: false */

  var module = angular.module('simulationControlServices', ['ngResource', 'exdFrontendApp.Constants', 'exdFrontendFilters', 'nrpErrorHandlers', 'bbpConfig', 'hbpCommon']);

  module.factory('simulationService', ['$resource', '$http', 'hbpUserDirectory', 'STATE', 'serverError', 'uptimeFilter',
      function($resource, $http, hbpUserDirectory, STATE, serverError, uptimeFilter) {

    // Keeps track of the owner of experiments in a map (id -> display name)
    var owners = {};
    var creationDate = [];
    var uptime = [];
    
    // update simulation uptimes every second (uptime is accessed in the html directly)
    var updateUptime = function() {
      for (var i = 0; i < creationDate.length; i += 1) {
        uptime[i] = uptimeFilter(creationDate[i]);
      }
    };

    // transform the response data
    function transform(http, serverID) {
      var defaults = http.defaults.transformResponse;
      // We can't guarantee that the default transformation is an array
      defaults = angular.isArray(defaults) ? defaults : [defaults];
      // Append the new transformation to the defaults
      return defaults.concat(function(data) {
        angular.forEach(data, function(element, index){
          element.serverID = serverID;
          // keep a copy of creation dates in an array (will be used to calculate uptime array)
          creationDate[element.simulationID] = element.creationDate;
          hbpUserDirectory.get([element.owner]).then(function (profile)
          {
            owners[element.owner] = getUserName(profile);
          });
        });
        return data;
      });
    }

    var getUserName = function(profile) {
      var validOwnerID = Object.keys(profile)[0];// Should be element.owner if it is a valid ID, undefined otherwise
      return validOwnerID !== undefined ? profile[validOwnerID].displayName : 'Unknown';
    };

    // State filtering for simulations (the second parameter is optional)
    var filterSimulations = function(simulations, state1, state2){
      var length = simulations.length;
      for (var i = length - 1; i >= 0; i-=1) { // the largest indices correspond to the newest objects
        var simulation = simulations[i];
        var state = simulation.state;
        if (state ===  state1 || (state2 !== undefined && state ===  state2)) {
          return simulation;
        }
      }
      return undefined;
    };

    // Retrieve the latest active simulation, i.e., the simulation with the highest index which is started or paused
    // If it doesn't exist, we fall back on an initialized or created one. If there is no simulation object on the server,
    // the active simulation remains undefined
    var getActiveSimulation = function(simulations) {
      var activeSimulation = filterSimulations(simulations, STATE.PAUSED, STATE.STARTED);
      if (activeSimulation !== undefined) {
        return activeSimulation;
      }
      return filterSimulations(simulations, STATE.INITIALIZED);
    };

    // Public methods of the service
    return function(params) {
      if (params === undefined){
        params = {};
        params.serverURL = '';
        params.serverID = '';
      }
      var functions = $resource(params.serverURL + '/simulation', {}, {
        simulations: {
          method: 'GET',
          isArray: true,
          interceptor : {responseError : serverError},
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

  module.factory('simulationControl', ['$resource', 'serverError', function($resource, serverError) {
    return function(baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id', {}, {
        simulation: {
          method: 'GET',
          interceptor : {responseError : serverError}
        }
      });
    };
  }]);

  module.factory('simulationState', ['$resource', 'serverError', function($resource, serverError) {
    return function(baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/state', {}, {
        state: {
          method: 'GET',
          interceptor : {responseError : serverError}
        },
        update: { // this method initializes, starts, stops, or pauses the simulation
          method: 'PUT'
        }
      });
    };
  }]);

  module.factory('simulationGenerator', ['$resource', 'serverError', function($resource, serverError) {
    return function(baseUrl) {
      return $resource(baseUrl + '/simulation', {}, {
        create: {
          method: 'POST',
          interceptor : {responseError : serverError}
        }
      });
    };
  }]);

  module.factory('lightControl', ['$resource', 'serverError', function($resource, serverError) {
    return function(baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/interaction/light', {}, {
        updateLight: {
          method: 'PUT',
          interceptor : {responseError : serverError}
        }
      });
    };
  }]);

  module.factory('screenControl', ['$resource', 'serverError', function($resource, serverError) {
   return function(baseUrl) {
       return $resource(baseUrl + '/simulation/:sim_id/interaction', {}, {
         updateScreenColor: {
           method: 'PUT',
           interceptor : {responseError : serverError}
         }
       });
   };
  }]);

  module.factory('experimentSimulationService', ['$http', 'bbpConfig', 'simulationService', 'simulationState', 'simulationGenerator', 'roslib', 'STATE', 'serverError',
    function ($http, bbpConfig, simulationService, simulationState, simulationGenerator, roslib, STATE, serverError) {
    var getExperimentsCallback;
    var setProgressMessageCallback;
    var initializedCallback;
    var servers = bbpConfig.get('api.neurorobotics');
    var rosConnection;
    var statusListener;

    // Augments the experimentTemplates with the running experiments
    var augmentExperiments = function(experimentTemplates){
      var serverIDs = Object.keys(servers);
      var experiment;

      angular.forEach(serverIDs, function(serverID, index){
        var serverNRPServicesURL = servers[serverID].gzweb['nrp-services'];

        simulationService({serverURL: serverNRPServicesURL, serverID: serverID}).simulations( function (data) {
          var activeSimulation = simulationService().getActiveSimulation(data);
          if (activeSimulation !== undefined) {
            experiment = experimentTemplates[activeSimulation.experimentID];
            if (experiment !== undefined) {
              experiment.runningExperiments = ('runningExperiments' in experiment) ? experiment.runningExperiments + 1 : 1;
              if (!('simulations' in experiment)) {
                experiment.simulations = [];
              }
              experiment.simulations.push(activeSimulation);
            }
          }
        });
      });
      getExperimentsCallback(experimentTemplates);
    };

    // Fetches the Experiments
    var getExperiments = function(progressMessageCallback, callback) {
      setProgressMessageCallback = progressMessageCallback;
      getExperimentsCallback = callback;

      $http.get('views/esv/experiment_templates.json').success(function (data) {
        augmentExperiments(data);
      });

    };

    var registerForStatusInformation = function(serverID, simulationID) {
      var rosbridgeWebsocketUrl = servers[serverID].rosbridge.websocket;
      var statusTopic = servers[serverID].rosbridge.topics.status;

      rosConnection = roslib.getOrCreateConnectionTo(rosbridgeWebsocketUrl);
      statusListener = roslib.createStringTopic(rosConnection, statusTopic);

      statusListener.subscribe(function (data) {
        var message = JSON.parse(data.data);
        if (message !== undefined && message.progress !== undefined) {
          if (message.progress.done !== undefined && message.progress.done) {
            setProgressMessageCallback({main: 'Finished!'});
            initializedCallback('#/esv-web/gz3d-view/' + serverID + '/' + simulationID);
          } else {
            setProgressMessageCallback({main: message.progress.task, sub: message.progress.subtask});
          }
        }
      });
    };

    // Checks if there is an available Server.
    var existsAvailableServer = function(isAvailableCallback){
      var serverIDs = Object.keys(servers);
      angular.forEach(serverIDs, function(serverID, index){
        var serverURL = servers[serverID].gzweb['nrp-services'];
        simulationService({serverURL: serverURL, serverID: serverID}).simulations(function (data) {
          var activeSimulation = simulationService().getActiveSimulation(data);
          if (activeSimulation === undefined) {
            isAvailableCallback();
          }
        });
      });
    };

    // TODO improve this code (keyword: semaphore!)
    var startNewExperiments = function(id, errorCallback){
      var serverIDs = Object.keys(servers);
      var keepGoing = true;
      angular.forEach(serverIDs, function(serverID, index){
        if(keepGoing) {
          var serverURL = servers[serverID].gzweb['nrp-services'];
          simulationService({serverURL: serverURL, serverID: serverID}).simulations(function (data) {
            var activeSimulation = simulationService().getActiveSimulation(data);
            if (activeSimulation === undefined) {
              if (keepGoing) {
                keepGoing = false;
                launchExperimentOnServer(id, serverID, errorCallback);
              }
            }
          });
        }
      });
    };

    var launchExperimentOnServer = function(experimentID, freeServerID, errorCallback){
      setProgressMessageCallback({main: 'Create new Simulation...'});
      var serverURL = servers[freeServerID].gzweb['nrp-services'];
      // create new simulation
      simulationGenerator(serverURL).create({experimentID: experimentID}, function(createData){
        setProgressMessageCallback({main: 'Initialize Simulation...'});
        // register for messages during initialization
        registerForStatusInformation(freeServerID, createData.simulationID);

        // initialize the newly created simulation
        simulationState(serverURL).update({sim_id: createData.simulationID}, {state: STATE.INITIALIZED}, function(updateData) {
          setProgressMessageCallback({main: 'Simulation initialized.'});
          initializedCallback('#/esv-web/gz3d-view/' + freeServerID + '/' + createData.simulationID);
        }, function(updateData) { serverError(updateData); errorCallback(); });
      });
    };

    var setInitializedCallback = function(callback){
      initializedCallback = callback;
    };

    // Public methods of the service
    return {
      getExperiments: getExperiments,
      augmentExperiments: augmentExperiments,
      registerForStatusInformation: registerForStatusInformation,
      existsAvailableServer: existsAvailableServer,
      startNewExperiments: startNewExperiments,
      launchExperimentOnServer: launchExperimentOnServer,
      setInitializedCallback: setInitializedCallback
    };

  }]);
}());
