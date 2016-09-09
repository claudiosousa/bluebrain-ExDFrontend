(function ()
{
  'use strict';
  angular.module('exdFrontendApp')
    .directive('environmentSettingsColors', ['gz3d', 'nrpAnalytics',
      function (gz3d, nrpAnalytics)
      {
        return {
          templateUrl: 'views/esv/environment-settings-colors.html',
          restrict: 'E',
          scope: true,
          link: function (scope, element, attrs)
          {
            //----------------------------------------------
            // Init the values

            scope.selectedColorChannel = 0;

            scope.composerSettingsToUI = function ()
            {
              if (scope.showEnvironmentSettingsPanel)
              {
                scope.composerSettings = gz3d.scene.composerSettings;
                scope.inGamma = (1.0 - (gz3d.scene.composerSettings.levelsInGamma - 1.0));
              }
            };

            scope.$watch('showEnvironmentSettingsPanel', function ()
            {
              scope.composerSettingsToUI();
            });

            scope.$watch('gz3d.scene.composerSettings', function ()
            {
              scope.composerSettingsToUI();
            });

            //----------------------------------------------
            // UI to 3D scene

            scope.updateEnvColorSettings = function (p)
            {
              gz3d.scene.composerSettings.levelsInGamma = (1.0 - (scope.inGamma - 1.0));
              gz3d.scene.applyComposerSettings();
            };

            scope.onRGBCurveChanged = function ()
            {
              gz3d.scene.applyComposerSettings(true);
            };

            //----------------------------------------------
            // Reset

            scope.resetCurve = function ()
            {
              gz3d.scene.composerSettings.rgbCurve = { 'red': [], 'green': [], 'blue': [] };
              gz3d.scene.applyComposerSettings(true);
            };



            scope.resetLevels = function ()
            {
              gz3d.scene.composerSettings.levelsInBlack = 0.0;
              gz3d.scene.composerSettings.levelsInGamma = 1.0;
              gz3d.scene.composerSettings.levelsInWhite = 1.0;
              gz3d.scene.composerSettings.levelsOutBlack = 0.0;
              gz3d.scene.composerSettings.levelsOutWhite = 1.0;
              scope.inGamma = gz3d.scene.composerSettings.levelsInGamma = 1.0;
              gz3d.scene.applyComposerSettings();
            };

          }
        };
      }
    ]);
} ());
