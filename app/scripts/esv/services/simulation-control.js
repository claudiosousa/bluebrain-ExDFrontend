(function() {
  'use strict';

  /* global console: false */

  var module = angular.module('simulationControlServices', ['ngResource', 'exdFrontendApp.Constants']);

  module.factory('simulationService', ['$resource', '$http', 'hbpUserDirectory', 'STATE', function($resource, $http, hbpUserDirectory, STATE) {

    // Keeps track of the owner of experiments in a map (id -> display name)
    var owners = {};

    // transform the response data
    function transform(http, serverID) {
      var defaults = http.defaults.transformResponse;
      // We can't guarantee that the default transformation is an array
      defaults = angular.isArray(defaults) ? defaults : [defaults];
      // Append the new transformation to the defaults
      return defaults.concat(function(data) {
        angular.forEach(data, function(element, index){
          element.serverID = serverID;
          hbpUserDirectory.get([element.owner]).then(function (profile)
          {
            owners[Object.keys(profile)[0]] = profile[Object.keys(profile)[0]].displayName;
          });
        });
        return data;
      });
    }

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
      activeSimulation = filterSimulations(simulations, STATE.INITIALIZED);
      if (activeSimulation !== undefined) {
        return activeSimulation;
      }
      return filterSimulations(simulations, STATE.CREATED);
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
          transformResponse: transform($http, params.serverID)
        }
      });
      functions.getActiveSimulation = getActiveSimulation;
      functions.filterSimulations = filterSimulations;
      functions.transformResponse = transform;
      functions.owners = owners;

      return functions;
    };
  }]);

  module.factory('simulationControl', ['$resource', function($resource) {
    return function(baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id', {}, {
        simulation: {
          method: 'GET'
        }
      });
    };
  }]);

  module.factory('simulationState', ['$resource', function($resource) {
    return function(baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/state', {}, {
        state: {
          method: 'GET'
        },
        update: { // this method initializes, starts, stops, or pauses the simulation
          method: 'PUT'
        }
      });
    };
  }]);

  module.factory('simulationGenerator', ['$resource', function($resource) {
    return function(baseUrl) {
      return $resource(baseUrl + '/simulation', {}, {
        create: {
          method: 'POST'
        }
      });
    };
  }]);

  module.factory('lightControl', ['$resource', function($resource) {
    return function(baseUrl) {
      return $resource(baseUrl + '/simulation/:sim_id/interaction/light', {}, {
        updateLight: {
          method: 'PUT'
        }
      });
    };
  }]);

  module.factory('screenControl', ['$resource', function($resource) {
   return function(baseUrl) {
       return $resource(baseUrl + '/simulation/:sim_id/interaction', {}, {
         updateScreenColor: {
           method: 'PUT'
         }
       });
   };
  }]);

  module.factory('experimentSimulationService', ['$http', 'bbpConfig', 'simulationService', 'simulationState', 'simulationGenerator', 'roslib', 'STATE',
    function ($http, bbpConfig, simulationService, simulationState, simulationGenerator, roslib, STATE) {
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

    // TODO improve this code (keyword: semaphore!)
    var startNewExperiments = function(id){
      var serverIDs = Object.keys(servers);
      var keepGoing = true;
      angular.forEach(serverIDs, function(serverID, index){
        if(keepGoing) {
          var serverURL = servers[serverID].gzweb['nrp-services'];
          simulationService({serverURL: serverURL, serverID: serverID}).simulations(function (data) {
            var activeSimulation = simulationService().getActiveSimulation(data);
            if (activeSimulation === undefined) {
              if(keepGoing) {
                keepGoing = false;
                launchExperimentOnServer(id, serverID);
              }
            }
          });
        }
      });
    };

    var launchExperimentOnServer = function(experimentID, freeServerID){
      setProgressMessageCallback({main: 'Create new Simulation...'});
      //var freeServerID = getFreeServerID();
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
        });

      });
    };

    var setInitializedCallback = function(callback){
      initializedCallback = callback;
    };

    // Public methods of the service
    return {
      getExperiments: getExperiments,
      augmentExperiments: augmentExperiments,
      startNewExperiments: startNewExperiments,
      setInitializedCallback: setInitializedCallback,
      registerForStatusInformation: registerForStatusInformation,
      launchExperimentOnServer: launchExperimentOnServer
    };

  }]);
}());
