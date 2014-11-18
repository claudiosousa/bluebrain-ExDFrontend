(function() {
    'use strict';

    /**
     * @ngdoc function
     * @name exdFrontendApp.controller:Gz3dViewCtrl
     * @description
     * # Gz3dViewCtrl
     * Controller of the exdFrontendApp
     */

    /* global GZ3D: false */
    /* global scene: false */

    angular.module('exdFrontendApp')
        .controller('Gz3dViewCtrl', ['$rootScope','$scope', 'bbpConfig', function($rootScope, $scope, bbpConfig) {
            GZ3D.assetsPath = bbpConfig.get("api.neurorobotics.gzweb.development1.assets");
            GZ3D.webSocketUrl = bbpConfig.get("api.neurorobotics.gzweb.development1.websocket");
            $rootScope.GZ3D = GZ3D; 

            $scope.incrementLightIntensity = function(ratio) {
                var factor = 1 + ratio;
                var lights = scene.scene.__lights;
                var numberOfLights = lights.length;
                for (var i = 0; i < numberOfLights; i++) {
                  lights[i].intensity *= factor;
                  var entity = scene.getByName(lights[i].name);
                  scene.emitter.emit('entityChanged', entity);
                }
            };

            $scope.pauseGazebo = function(paused) {
                gui.emitter.emit('pause', paused);
            };
        }]);
}());