(function ()
{
  'use strict';
  angular.module('exdFrontendApp')
    .directive('environmentsettingsquality', ['gz3d', 'nrpAnalytics',
      function (gz3d, nrpAnalytics)
      {
        return {
          templateUrl: 'views/esv/environment-settings-quality.html',
          restrict: 'E',
          scope: true,
          link: function (scope, element, attrs)
          {
            //----------------------------------------------
            // Init the values

            scope.composerSettingsToUI = function ()
            {
              if (scope.showEnvironmentSettingsPanel)
              {
                var cs = gz3d.scene.composerSettings;

                scope.renderShadows = cs.shadows;
                scope.renderAmbientOcclusion = cs.ssao;
                scope.ambientOcclusionClamp = cs.ssaoClamp;
                scope.ambientOcclusionLum = cs.ssaoLumInfluence;
                scope.antiAliasingEnabled = cs.antiAliasing;
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

            scope.updateEnvQualitySettings = function ()
            {
              gz3d.scene.composerSettings.shadows = scope.renderShadows;
              gz3d.scene.composerSettings.ssao = scope.renderAmbientOcclusion;
              gz3d.scene.composerSettings.ssaoClamp = scope.ambientOcclusionClamp;
              gz3d.scene.composerSettings.ssaoLumInfluence = scope.ambientOcclusionLum;
              gz3d.scene.composerSettings.antiAliasing = scope.antiAliasingEnabled;

              gz3d.scene.applyComposerSettings();
            };
          }
        };
      }
    ]);
} ());
