'use strict';

describe('Directive: context-menu', function () {

  var scope, gz3d, collab3DSettingsService;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(module(function ($provide) {
    gz3d = {
      scene: {
        defaultComposerSettings: {},
        applyComposerSettings: jasmine.createSpy('applyComposerSettings')
      }
    };

    collab3DSettingsService = {
      saveSettings: jasmine.createSpy('saveSettings')
    };

    $provide.value('gz3d', gz3d);
    $provide.value('collab3DSettingsService', collab3DSettingsService);
  }));

  beforeEach(inject(function ($rootScope, $compile) {
    var element = $compile('<environment-settings-panel/>')($rootScope);
    scope = element.scope();
    $rootScope.$digest();

  }));

  it('should reapply composer settings on resetSettings', function () {
    scope.resetSettings();
    expect(gz3d.scene.applyComposerSettings).toHaveBeenCalled();
  });

  it('should save 3d setting on environment save', function () {
    scope.saveSettings();
    expect(collab3DSettingsService.saveSettings).toHaveBeenCalled();
  });
});
