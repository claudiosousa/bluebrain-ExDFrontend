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
/* global GZ3D: false */

(function ()
{
  'use strict';
  angular.module('exdFrontendApp')
    .directive('environmentSettingsMaster', ['gz3d', 'nrpAnalytics',
      'editorToolbarService',
      function (gz3d, nrpAnalytics, editorToolbarService)
      {
        return {
          templateUrl: 'views/esv/environment-settings-master.html',
          restrict: 'E',
          scope: true,
          link: function (scope, element, attrs)
          {
            scope.editorToolbarService = editorToolbarService;

            scope.masterSettings = [GZ3D.MASTER_QUALITY_BEST,GZ3D.MASTER_QUALITY_MIDDLE,GZ3D.MASTER_QUALITY_LOW,GZ3D.MASTER_QUALITY_MINIMAL];
            scope.masterSettingsImage = {};
            scope.masterSettingsImage[GZ3D.MASTER_QUALITY_BEST]="img/3denv/quality_best.jpg";
            scope.masterSettingsImage[GZ3D.MASTER_QUALITY_MINIMAL]="img/3denv/quality_minimal.jpg";
            scope.masterSettingsImage[GZ3D.MASTER_QUALITY_MIDDLE]="img/3denv/quality_middle.jpg";
            scope.masterSettingsImage[GZ3D.MASTER_QUALITY_LOW]="img/3denv/quality_low.jpg";
            scope.currentMasterSettings = GZ3D.MASTER_QUALITY_BEST;

            //----------------------------------------------
            // Init the values

            scope.masterSettingsToUI = function ()
            {
              if (editorToolbarService.isEnvironmentSettingsPanelActive)
              {
                scope.currentMasterSettings = gz3d.scene.composer.currentMasterSettings;
              }
            };

            scope.$watch('editorToolbarService.showEnvironmentSettingsPanel', function ()
            {
              scope.masterSettingsToUI();
            });

            scope.$watch('gz3d.scene.composer.currentMasterSettings', function ()
            {
              scope.masterSettingsToUI();
            });

            //----------------------------------------------
            // UI to 3D scene

            scope.setMasterSettings = function (master)
            {
              gz3d.scene.setMasterSettings(master);
            };
          }
        };
      }
    ]);
} ());
