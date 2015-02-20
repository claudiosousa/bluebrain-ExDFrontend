(function() {
    'use strict';

    var module = angular.module('exdFrontendApp');

    module.factory('simulationService', ['$resource', function($resource) {
      return function(baseUrl) {
        return $resource(baseUrl + '/simulation', {}, {
          simulations: {
            method: 'GET',
            isArray: true
          }
        });
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
