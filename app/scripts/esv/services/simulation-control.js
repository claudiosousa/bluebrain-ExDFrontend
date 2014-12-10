(function() {
    'use strict';

    var module = angular.module('exdFrontendApp');
    module.factory('simulationControl', ['$resource', '$location', function($resource) {
        // Public API here

        return $resource('http://bbpce013.epfl.ch:8080/simulation/:sim_id/state', {
            sim_id: 1
        }, {
            state: {
                method: 'GET'
            },
            updateState: { // this method starts, stops, pauses or resumes the simulation
                method: 'PUT'
            }
        });
    }]);

    module.factory('simulationGenerator', ['$resource', '$location', function($resource) {
        // Public API here

        return $resource('http://bbpce013.epfl.ch:8080/simulation', {}, {
            create: {
                method: 'POST'
            },
        });
    }]);

    module.factory('lightControl', ['$resource', '$location', function($resource) {
        // Public API here

        return $resource('http://bbpce013.epfl.ch:8080/simulation/:sim_id/interaction/light', {
            sim_id: 1
        }, {
            updateLight: {
                method: 'PUT'
            }
        });
    }]);

   module.factory('screenControl', ['$resource', '$location', function($resource) {
        // Public API here

        return $resource('http://bbpce013.epfl.ch:8080/simulation/:sim_id/interaction', {
            sim_id: 1
        }, {
            updateScreenColor: {
                method: 'PUT'
            }
        });
    }]);

}());

