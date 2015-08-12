(function () {
  'use strict';

  /* global console: false */

  angular.module('exdFrontendApp').controller('editorPanelCtrl',
    ['$rootScope', '$scope', '$stateParams','bbpConfig', 'gz3d',
    function ($rootScope, $scope, $stateParams, bbpConfig, gz3d) {
    if (!$stateParams.serverID || !$stateParams.simulationID){
      throw "No serverID or simulationID given.";
    }
    var serverID = $stateParams.serverID;
    var serverConfig = bbpConfig.get('api.neurorobotics')[serverID];
    $scope.simulationID = $stateParams.simulationID;
    $scope.serverBaseUrl = serverConfig.gzweb['nrp-services'];

    $scope.panelIsOpen = false;
    $scope.activeTab = {};
    $scope.activeTab.transferfunction = false;
    $scope.activeTab.environment = false;
    $scope.activeTab.statemachine = false;
    $scope.activeTab.events = false;

    $scope.openCallback = function() {
      // The Panel is opened
      $scope.panelIsOpen = true;
      if($scope.activeTab.transferfunction === true ||
        $scope.activeTab.statemachine === true) {
        gz3d.scene.controls.keyBindingsEnabled = false;
      }
    };

    $scope.closeCallback = function() {
      // The Panel is closed
      $scope.panelIsOpen = false;
      gz3d.scene.controls.keyBindingsEnabled = true;
    };

    $scope.disableKeyBindings = function() {
      // Only disable the key bindings if the panel is open
      // This prevents disabling the key bindings when the page is loaded
      if($scope.panelIsOpen === true) {
        gz3d.scene.controls.keyBindingsEnabled = false;
      }
    };

    $scope.reenableKeyBindings = function() {
      // Reenable the key bindings when the user leaves a code-editor panel
      gz3d.scene.controls.keyBindingsEnabled = true;
    };
  }]);

}());
