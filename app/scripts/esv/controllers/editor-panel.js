(function () {
  'use strict';

  /* global console: false */

  angular.module('exdFrontendApp').controller('editorPanelCtrl', ['$scope', '$stateParams','bbpConfig', function ($scope, $stateParams, bbpConfig) {
    if (!$stateParams.serverID || !$stateParams.simulationID){
      throw "No serverID or simulationID given.";
    }
    var serverID = $stateParams.serverID;
    var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];
    $scope.simulationID = $stateParams.simulationID;
    $scope.serverBaseUrl = serverConfig.gzweb['nrp-services'];

    $scope.openCallback = function() {
      console.log('Opened Editor Panel.');
    };
  }]);

}());
