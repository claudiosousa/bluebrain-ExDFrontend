(function() {
    'use strict';

    var module = angular.module('simulationControlServices', ['ngResource', 'exdFrontendApp.Constants']);

    module.factory('simulationService', ['$resource', '$http', 'STATE', function($resource, $http, STATE) {
      // transform the response data
      function transform(http, serverID) {
        var defaults = http.defaults.transformResponse;
        // We can't guarantee that the default transformation is an array
        defaults = angular.isArray(defaults) ? defaults : [defaults];
        // Append the new transformation to the defaults
        return defaults.concat(function(data) {
          angular.forEach(data, function(element, index){
            element.serverID = serverID;
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
      return function(baseUrl) {
        var functions = $resource(baseUrl + '/simulation', {}, {
          simulations: {
            method: 'GET',
            isArray: true,
            transformResponse: transform($http, baseUrl)
          }
        });
        functions.getActiveSimulation = getActiveSimulation;
        functions.filterSimulations = filterSimulations;
        functions.transformResponse = transform;
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
}());
