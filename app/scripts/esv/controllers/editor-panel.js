(function () {
  'use strict';

  /* global console: false */

  angular.module('exdFrontendApp').controller('editorPanelCtrl',
    ['$rootScope', '$scope', 'simulationInfo','bbpConfig', 'gz3d',
    function ($rootScope, $scope, simulationInfo, bbpConfig, gz3d) {
    var serverConfig = simulationInfo.serverConfig;
    $scope.simulationID = simulationInfo.simulationID;
    $scope.serverBaseUrl = serverConfig.gzweb['nrp-services'];

    $scope.panelIsOpen = false;
    $scope.isClosing = false;
    $scope.activeTab = {};
    $scope.activeTab.transferfunction = false;
    $scope.activeTab.environment = false;
    $scope.activeTab.statemachine = false;
    $scope.activeTab.pynneditor = false;
    $scope.activeTab.events = false;

    $scope.controls = {};
    $scope.controls.transferfunction = {};
    $scope.controls.statemachine = {};
    $scope.controls.pynneditor = {};

    $scope.transferFunctionErrorTopic = serverConfig.rosbridge.topics.transferFunctionError;
    $scope.rosbridgeWebsocketUrl = serverConfig.rosbridge.websocket;

    $scope.openCallback = function() {
      // The Panel is opened
      $scope.panelIsOpen = true;
      if($scope.activeTab.transferfunction === true ||
        $scope.activeTab.statemachine === true ||
        $scope.activeTab.pynneditor === true) {
        gz3d.scene.controls.keyBindingsEnabled = false;
      }

      if ($scope.activeTab.transferfunction === true) {
        $scope.controls.transferfunction.refresh();
      }
      else if ($scope.activeTab.statemachine === true) {
        $scope.controls.statemachine.refresh();
      }
      else if ($scope.activeTab.pynneditor === true) {
        $scope.controls.pynneditor.refresh();
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
      if (angular.isDefined(gz3d.scene)) {
        gz3d.scene.controls.keyBindingsEnabled = true;
      }
    };

    // clean up on leaving
    $scope.$on("$destroy", function() {
      // prevent calling the select functions of the tabs
      $scope.isClosing = true;
    });
  }]);
}());
