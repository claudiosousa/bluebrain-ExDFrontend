(function ()
{
  'use strict';
  angular.module('exdFrontendApp')
    .directive('environmentSettingsEnvironment', ['gz3d', 'nrpAnalytics',
      function (gz3d, nrpAnalytics)
      {
        return {
          templateUrl: 'views/esv/environment-settings-environment.html',
          restrict: 'E',
          scope: true,
          link: function (scope, element, attrs)
          {
            //----------------------------------------------
            // Init the values

            scope.selectedSky = 0;
            scope.selectedSun = 0;
            scope.bloom = false;
            scope.bloomStrength = 0;
            scope.bloomRadius = 0;
            scope.bloomThreshold = 0;
            scope.fog = false;
            scope.fogDensity = 0;
            scope.fogColor = "";

            scope.skyList = ['',
              'img/3denv/sky/gradient/gradient',
              'img/3denv/sky/softgradient/softgradient',
              'img/3denv/sky/blur/blur',
              'img/3denv/sky/skyblur/skyblur',
              'img/3denv/sky/clouds/clouds'
              ];

            scope.skyDefaultFogList = ['#b2b2b2', '#cddde9', '#97a2af', '#c7c0bc','#3c4146', '#d8ccb1'];

            scope.sunList = ['', 'SIMPLELENSFLARE'];

            scope.composerSettingsToUI = function ()
            {
              if (scope.showEnvironmentSettingsPanel)
              {
                var cs = gz3d.scene.composerSettings;

                scope.selectedSky = scope.skyList.indexOf(cs.skyBox);
                scope.selectedSun = scope.sunList.indexOf(cs.sun);

                scope.bloom = cs.bloom;
                scope.bloomThreshold = cs.bloomThreshold;
                scope.bloomStrength = cs.bloomStrength;
                scope.bloomRadius = cs.bloomRadius;

                scope.fog = cs.fog;
                scope.fogDensity = cs.fogDensity;
                scope.fogColor = cs.fogColor;
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

            scope.updateEnvSettings = function (p)
            {
              if (gz3d.scene.composerSettings.skyBox !== scope.skyList[scope.selectedSky])
              {
                gz3d.scene.composerSettings.skyBox = scope.skyList[scope.selectedSky];
                scope.fogColor = gz3d.scene.composerSettings.fogColor = scope.skyDefaultFogList[scope.selectedSky];
              }

              gz3d.scene.composerSettings.sun = scope.sunList[scope.selectedSun];

              gz3d.scene.composerSettings.bloom = scope.bloom;
              gz3d.scene.composerSettings.bloomStrength = scope.bloomStrength;
              gz3d.scene.composerSettings.bloomThreshold = scope.bloomThreshold;
              gz3d.scene.composerSettings.bloomRadius = scope.bloomRadius;

              gz3d.scene.composerSettings.fog = scope.fog;
              gz3d.scene.composerSettings.fogDensity = scope.fogDensity;
              gz3d.scene.composerSettings.fogColor = scope.fogColor;

              gz3d.scene.applyComposerSettings();
            };

          }
        };
      }
    ]);
} ());
