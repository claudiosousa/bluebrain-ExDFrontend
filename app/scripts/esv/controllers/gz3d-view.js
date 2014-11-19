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

            // stores, whether the context menu should be displayed
            $scope.isShowContextMenu = false;

            // the position of the context menu
            $scope.contextMenuTop = 0;
            $scope.contextMenuLeft = 0;

            // the currently selected entity
            $scope.entityToChange = null;

            $scope.openContextMenu = function(event) {
                var entity = scene.selectedEntity;
                if (entity) {
                  $scope.isShowContextMenu = true;
                  $scope.contextMenuTop = event.clientY;
                  $scope.contextMenuLeft = event.clientX;
                  $scope.entityToChange = scene.selectedEntity;
                  scene.selectedEntity = null;
                }
            };

            // for convenience we pass just a string as "red" or "blue" currently, this will be replaced later on
            $scope.setColorOnEntity = function(value) {
                var colors = { red : 0xff0000, blue: 0x0000ff };
                var entity = $scope.entityToChange;
                var entityToChange = scene.getByName(entity.name + "::link::visual");

                if (entityToChange && entityToChange.children[0] && colors[value]) {
                  // currently we use .setHex(), because for some reason regRGB() does not respect the
                  // brightness, i.e. when turning the lights down the objects do not get darker
                  entityToChange.children[0].material.color.setHex(colors[value]);//setRGB(r,g,b);
                }

                // deactivate the context menu after a color was assigned
                $scope.closeContextMenu();
            };

            $scope.closeContextMenu = function() {
                $scope.isShowContextMenu = false;
            };

        }]);
}());
