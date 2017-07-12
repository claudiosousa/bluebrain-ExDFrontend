/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
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
 * ---LICENSE-END**/
(function () {
  'use strict';

  /* global console: false */

  angular.module('exdFrontendApp').controller('editorPanelCtrl',
    ['$rootScope', '$scope', 'simulationInfo','bbpConfig', 'gz3d', 'baseEventHandler', 'autoSaveService','saveErrorsService', 'editorsPanelService', 'userContextService',
    function ($rootScope, $scope, simulationInfo, bbpConfig, gz3d, baseEventHandler, autoSaveService, saveErrorsService, editorsPanelService, userContextService) {

    var serverConfig = simulationInfo.serverConfig;
    $scope.simulationID = simulationInfo.simulationID;
    $scope.serverBaseUrl = simulationInfo.serverBaseUrl;

    $scope.editorsPanelService = editorsPanelService;
    $scope.panelIsOpen = false;
    $scope.isOwner = userContextService.isOwner();

    $scope.tabindex = {
      environment: 1,
      statemachine: 2,
      transferfunction: 3,
      pynneditor: 4,
      events: 5,
      graphicalEditor: 6
    };

    $scope.activeTabIndex = $scope.isOwner? $scope.tabindex.environment :$scope.tabindex.transferfunction;

    $scope.controls = {};
    $scope.controls.transferfunction = {};
    $scope.controls.statemachine = {};
    $scope.controls.pynneditor = {};
    $scope.controls.graphicalEditor = {};

    $scope.cleErrorTopic = bbpConfig.get('ros-topics').cleError;
    $scope.rosbridgeWebsocketUrl = serverConfig.rosbridge.websocket;

    var isTabSelected = (...tabs) => tabs.indexOf($scope.activeTabIndex) >= 0;

    $scope.openCallback = function() {
      // The Panel is opened

      userContextService.isOwner() && autoSaveService.checkAutoSavedWork()
        .catch(function() {
          // auto saved data will always be the freshest data, so only load the error data if there is no autosave data or it was discarded.
          saveErrorsService.getErrorSavedWork();
        });

      $scope.panelIsOpen = true;
      if (isTabSelected($scope.tabindex.transferfunction, $scope.tabindex.statemachine, $scope.tabindex.pynneditor, $scope.tabindex.graphicalEditor))
        gz3d.scene.controls.keyboardBindingsEnabled = false;


      $scope.refresh();
    };

    $scope.refresh = function() {
      if ($scope.panelIsOpen) {
        if (isTabSelected($scope.tabindex.transferfunction))
          $scope.controls.transferfunction.refresh();
        else if (isTabSelected($scope.tabindex.statemachine))
          $scope.controls.statemachine.refresh();
        else if (isTabSelected($scope.tabindex.pynneditor))
          $scope.controls.pynneditor.refresh();
        else if (isTabSelected($scope.tabindex.graphicalEditor))
          $scope.controls.graphicalEditor.refresh();
      }
    };

      // update UI
      $scope.$on("UPDATE_PANEL_UI", function () {
        // prevent calling the select functions of the tabs
        $scope.refresh();
      });

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
      if($scope.panelIsOpen === true && angular.isDefined(gz3d.scene) && angular.isDefined(gz3d.scene.controls)) {
        gz3d.scene.controls.keyboardBindingsEnabled = false;
      }
    };

    $scope.reenableKeyBindings = function() {
      // Reenable the key bindings when the user leaves a code-editor panel
      if (angular.isDefined(gz3d.scene)&& angular.isDefined(gz3d.scene.controls)) {
        gz3d.scene.controls.keyboardBindingsEnabled = true;
      }
    };

    // clean up on leaving
    $scope.$on("$destroy", function() {
      // prevent calling the select functions of the tabs
      editorsPanelService.showEditorPanel = false;
    });

    $scope.$watch('editorsPanelService.showEditorPanel', function() {
      if (editorsPanelService.showEditorPanel) {
        $scope.openCallback();
      } else {
        $scope.closeCallback();
      }
    });

    $scope.onResizeEnd = function() {
      // the codemirror elements inside the transfer function tab of the editor panel
      // do not work well with resizing so deselect them on resize and refresh on focus
      document.activeElement.blur();

      if (isTabSelected($scope.tabindex.transferfunction))
        $scope.controls.transferfunction.refresh();
      else if (isTabSelected($scope.tabindex.statemachine))
        $scope.controls.statemachine.refresh();
      else if (isTabSelected($scope.tabindex.pynneditor))
        $scope.controls.pynneditor.refresh();
      // graphical editor is not refreshed
    };

    $scope.suppressKeyPress = function(event) {
      baseEventHandler.suppressAnyKeyPress(event);
    };
  }]);
}());
