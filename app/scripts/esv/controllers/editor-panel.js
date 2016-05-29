(function () {
  'use strict';

  /* global console: false */

  angular.module('exdFrontendApp').controller('editorPanelCtrl',
    ['$rootScope', '$scope', 'simulationInfo','bbpConfig', 'gz3d', 'baseEventHandler',
    function ($rootScope, $scope, simulationInfo, bbpConfig, gz3d, baseEventHandler) {

    var serverConfig = simulationInfo.serverConfig;
    $scope.simulationID = simulationInfo.simulationID;
    $scope.serverBaseUrl = simulationInfo.serverBaseUrl;

    $scope.panelIsOpen = false;
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

    $scope.cleErrorTopic = serverConfig.rosbridge.topics.cleError;
    $scope.rosbridgeWebsocketUrl = serverConfig.rosbridge.websocket;

    $scope.openCallback = function() {
      // The Panel is opened
      $scope.panelIsOpen = true;
      if($scope.activeTab.transferfunction === true ||
        $scope.activeTab.statemachine === true ||
        $scope.activeTab.pynneditor === true) {
        gz3d.scene.controls.keyboardBindingsEnabled = false;
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
      if (angular.isDefined(gz3d.scene) && angular.isDefined(gz3d.scene.controls)) {
        gz3d.scene.controls.keyboardBindingsEnabled = true;
      }
    };

    $scope.disableKeyBindings = function() {
      // Only disable the key bindings if the panel is open
      // This prevents disabling the key bindings when the page is loaded
      if($scope.panelIsOpen === true && angular.isDefined(gz3d.scene)) {
        gz3d.scene.controls.keyboardBindingsEnabled = false;
      }
    };

    $scope.reenableKeyBindings = function() {
      // Reenable the key bindings when the user leaves a code-editor panel
      if (angular.isDefined(gz3d.scene)) {
        gz3d.scene.controls.keyboardBindingsEnabled = true;
      }
    };

    // clean up on leaving
    $scope.$on("$destroy", function() {
      // prevent calling the select functions of the tabs
      $scope.showEditorPanel = false;
    });

    $scope.$watch('showEditorPanel', function() {
      if ($scope.showEditorPanel) {
        $scope.openCallback();
      } else {
        $scope.closeCallback();
      }
    });

    $scope.onResizeEnd = function() {
      // the codemirror elements inside the transfer function tab of the editor panel
      // do not work well with resizing so deselect them on resize and refresh on focus
      document.activeElement.blur();

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

    $scope.suppressKeyPress = function(event) {
      baseEventHandler.suppressAnyKeyPress(event);
    };
  }]);
}());
