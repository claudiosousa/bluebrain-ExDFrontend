(function() {
    'use strict';

    var module = angular.module('exdFrontendApp');

    module.factory('simulationService', ['$resource', 'bbpConfig', function($resource, bbpConfig) {
        var baseUrl = bbpConfig.get('api.neurorobotics.gzweb.development1.nrp-services');
        return $resource(baseUrl + '/simulation', {}, {
            simulations: {
                method: 'GET',
                isArray: true
            }
        });
    }]);

    module.factory('simulationControl', ['$resource', 'bbpConfig', function($resource, bbpConfig) {
        var baseUrl = bbpConfig.get('api.neurorobotics.gzweb.development1.nrp-services');
        return $resource(baseUrl + '/simulation/:sim_id', {}, {
            simulation: {
                method: 'GET'
            }
        });
    }]);

    module.factory('simulationState', ['$resource', 'bbpConfig', function($resource, bbpConfig) {
        var baseUrl = bbpConfig.get('api.neurorobotics.gzweb.development1.nrp-services');
        return $resource(baseUrl + '/simulation/:sim_id/state', {}, {
            state: {
                method: 'GET'
            },
            update: { // this method initializes, starts, stops, or pauses the simulation
                method: 'PUT'
            }
        });
    }]);

    module.factory('simulationGenerator', ['$resource', 'bbpConfig', function($resource, bbpConfig) {
        var baseUrl = bbpConfig.get('api.neurorobotics.gzweb.development1.nrp-services');
        return $resource(baseUrl + '/simulation', {}, {
            create: {
                method: 'POST'
            }
        });
    }]);

    module.factory('lightControl', ['$resource', 'bbpConfig', function($resource, bbpConfig) {
        var baseUrl = bbpConfig.get('api.neurorobotics.gzweb.development1.nrp-services');
        return $resource(baseUrl + '/simulation/:sim_id/interaction/light', {}, {
            updateLight: {
                method: 'PUT'
            }
        });
    }]);

   module.factory('screenControl', ['$resource', 'bbpConfig', function($resource, bbpConfig) {
        var baseUrl = bbpConfig.get('api.neurorobotics.gzweb.development1.nrp-services');
        return $resource(baseUrl + '/simulation/:sim_id/interaction', {}, {
            updateScreenColor: {
                method: 'PUT'
            }
        });
    }]);
}());
