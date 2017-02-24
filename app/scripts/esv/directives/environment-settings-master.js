/* global GZ3D: false */

(function ()
{
  'use strict';
  angular.module('exdFrontendApp')
    .directive('environmentSettingsMaster', ['gz3d', 'nrpAnalytics',
      function (gz3d, nrpAnalytics)
      {
        return {
          templateUrl: 'views/esv/environment-settings-master.html',
          restrict: 'E',
          scope: true,
          link: function (scope, element, attrs)
          {
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
              if (scope.showEnvironmentSettingsPanel)
              {
                scope.currentMasterSettings = gz3d.scene.composer.currentMasterSettings;
              }
            };

            scope.$watch('showEnvironmentSettingsPanel', function ()
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
