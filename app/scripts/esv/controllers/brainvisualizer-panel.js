(function () {
  'use strict';
  /* global console: false */

  angular.module('exdFrontendApp').controller('brainvisualizerPanelCtrl',
    ['$rootScope', '$scope', 'simulationInfo','bbpConfig', 'gz3d', 'baseEventHandler',
    function ($rootScope, $scope, simulationInfo, bbpConfig, gz3d, baseEventHandler) {

    var serverConfig = simulationInfo.serverConfig;
    $scope.simulationID = simulationInfo.simulationID;
    $scope.serverBaseUrl = simulationInfo.serverBaseUrl;

    $scope.panelIsOpen = false;

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
      $scope.showBrainvisualizerPanel = false;
    });

    $scope.$watch('showBrainvisualizerPanel', function() {
      if ($scope.showBrainvisualizerPanel) {
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
