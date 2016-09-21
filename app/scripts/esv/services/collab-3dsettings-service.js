(function ()
{
  'use strict';

  angular.module('exdFrontendApp')
    .service('collab3DSettingsService', ['gz3d', 'simulationConfigService',
      function (gz3d, simulationConfigService)
      {
        var loadSettings = function ()
        {
          if (gz3d.scene.defaultComposerSettings === undefined)
          {
            gz3d.scene.defaultComposerSettings = JSON.parse(JSON.stringify(gz3d.scene.composerSettings));
          }

          return simulationConfigService.loadConfigFile('3d-settings')
            .then(function (fileContent)
            {
              gz3d.scene.composerSettings = JSON.parse(fileContent);
              gz3d.scene.applyComposerSettings(true);
              gz3d.scene.defaultComposerSettings = JSON.parse(JSON.stringify(gz3d.scene.composerSettings));
              return fileContent;
            });
        };

        var saveSettings = function ()
        {
          simulationConfigService.saveConfigFile('3d-settings', JSON.stringify(gz3d.scene.composerSettings));
        };

        return {
          loadSettings: loadSettings,
          saveSettings: saveSettings
        };
      }]
    );
} ());
