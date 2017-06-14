/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/
(function () {
  'use strict';

  angular.module('exdFrontendApp').controller('brainvisualizerPanelCtrl',
    ['$rootScope',
      '$scope',
      'simulationInfo',
      'bbpConfig',
      'gz3d',
      'baseEventHandler',
      'editorToolbarService',
    function ($rootScope,
              $scope,
              simulationInfo,
              bbpConfig,
              gz3d,
              baseEventHandler,
              editorToolbarService) {

    var serverConfig = simulationInfo.serverConfig;
    $scope.simulationID = simulationInfo.simulationID;
    $scope.serverBaseUrl = simulationInfo.serverBaseUrl;
    $scope.editorToolbarService = editorToolbarService; // TODO: remove this from scope and use it as viewmodel via its directive

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

    $scope.$watch('editorToolbarService.showBrainvisualizerPanel', function() {
      if (editorToolbarService.isBrainVisualizerActive) {
        $scope.openCallback();
      } else {
        $scope.closeCallback();
      }
    });

    $scope.suppressKeyPress = function(event) {
      baseEventHandler.suppressAnyKeyPress(event);
    };

    $scope.closePanel = function() {
      editorToolbarService.closeBrainVisualizer();
    };
  }]);
}());
