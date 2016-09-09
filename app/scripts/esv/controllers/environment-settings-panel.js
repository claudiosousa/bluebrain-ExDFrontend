(function () {
  'use strict';

  angular.module('exdFrontendApp').controller('environmentSettingsPanelCtrl',
    ['$rootScope', '$scope', 'bbpConfig', 'gz3d', 'baseEventHandler',
    function ($rootScope, $scope, bbpConfig, gz3d, baseEventHandler) {

    $scope.panelIsOpen = false;
    $scope.activeTab = {};
    $scope.activeTab.quality = false;
    $scope.activeTab.color = false;
    $scope.activeTab.environment = false;

    $scope.openCallback = function() {
      // The Panel is opened
      $scope.panelIsOpen = true;
    };

    $scope.closeCallback = function() {
      // The Panel is closed
      $scope.panelIsOpen = false;
    };

    // clean up on leaving
    $scope.$on("$destroy", function() {
      // prevent calling the select functions of the tabs
      $scope.showEnvironmentSettingsPanel = false;
    });

    $scope.$watch('showEnvironmentSettingsPanel', function() {
      if ($scope.showEnvironmentSettingsPanel) {
        $scope.openCallback();
      } else {
        $scope.closeCallback();
      }
    });

    $scope.suppressKeyPress = function(event) {
      baseEventHandler.suppressAnyKeyPress(event);
    };
  }]);
}());
