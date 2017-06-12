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

  angular.module('exdFrontendApp').controller('environmentSettingsPanelCtrl',
    ['$rootScope', '$scope', 'bbpConfig', 'gz3d', 'baseEventHandler',
      'editorToolbarService',
      function($rootScope, $scope, bbpConfig, gz3d, baseEventHandler,
               editorToolbarService) {

    $scope.editorToolbarService = editorToolbarService;
    $scope.panelIsOpen = false;
    $scope.activeTab = {};
    $scope.activeTab.master = true;
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
      editorToolbarService.showEnvironmentSettingsPanel = false;
    });

    $scope.$watch('editorToolbarService.showEnvironmentSettingsPanel',
        function() {
          if (editorToolbarService.isEnvironmentSettingsPanelActive) {
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
