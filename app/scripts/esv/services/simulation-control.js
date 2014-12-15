(function() {
    'use strict';

    var module = angular.module('exdFrontendApp');
    module.factory('simulationControl', ['$resource', 'bbpConfig', function($resource, bbpConfig) {
        var baseUrl = bbpConfig.get('api.neurorobotics.gzweb.development1.nrp-services');
        return $resource(baseUrl + '/simulation/:sim_id/state', {
            sim_id: 0
        }, {
            state: {
                method: 'GET'
            },
            updateState: { // this method starts, stops, pauses or resumes the simulation
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
        return $resource(baseUrl + '/simulation/:sim_id/interaction/light', {
            sim_id: 0
        }, {
            updateLight: {
                method: 'PUT'
            }
        });
    }]);

   module.factory('screenControl', ['$resource', 'bbpConfig', function($resource, bbpConfig) {
        var baseUrl = bbpConfig.get('api.neurorobotics.gzweb.development1.nrp-services');
        return $resource(baseUrl + '/simulation/:sim_id/interaction', {
            sim_id: 0
        }, {
            updateScreenColor: {
                method: 'PUT'
            }
        });
    }]);

}());

