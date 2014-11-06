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

    angular.module('exdFrontendApp')
        .controller('Gz3dViewCtrl', ['$rootScope','$scope', 'bbpConfig', function($rootScope, $scope, bbpConfig) {
            GZ3D.assetsPath = bbpConfig.get("api.neurorobotics.gzweb.development1.assets");
            GZ3D.webSocketUrl = bbpConfig.get("api.neurorobotics.gzweb.development1.websocket");
            $rootScope.GZ3D = GZ3D; 
        }]);
}());