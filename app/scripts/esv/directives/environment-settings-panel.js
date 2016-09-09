(function ()
{
  'use strict';

  angular.module('exdFrontendApp')
    .directive('environmentSettingsPanel', ['gz3d', 'collab3DSettingsService', 'simulationInfo',
      function (gz3d, collab3DSettingsService, simulationInfo)
      {
        return {
          templateUrl: 'views/esv/environment-settings-panel.html',
          restrict: 'E',
          scope: true,  // create a child scope for the directive and inherits the parent scope properties
          link: function (scope, element, attrs)
          {
            scope.simulationInfo = simulationInfo;

            scope.resetSettings = function ()
            {
              if (gz3d.scene.defaultComposerSettings)
              {
                gz3d.scene.composerSettings = JSON.parse(JSON.stringify(gz3d.scene.defaultComposerSettings));
                gz3d.scene.applyComposerSettings(true);
              }
            };

            scope.saveSettings = function ()
            {
                collab3DSettingsService.saveSettings();
            };
          }
        };
      }
    ]);
} ());
