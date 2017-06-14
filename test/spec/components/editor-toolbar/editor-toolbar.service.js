'use strict';

describe('Service: EditorToolbar', function() {

  var editorToolbarService, dynamicViewOverlayService,
      DYNAMIC_VIEW_CHANNELS;

  // load the corresponding module
  beforeEach(module('editorToolbarModule'));
  beforeEach(module('dynamicViewModule'));

  beforeEach(module('dynamicViewOverlayServiceMock'));

  beforeEach(inject(function(_editorToolbarService_, _dynamicViewOverlayService_, _DYNAMIC_VIEW_CHANNELS_) {
    editorToolbarService = _editorToolbarService_;
    dynamicViewOverlayService = _dynamicViewOverlayService_;
    DYNAMIC_VIEW_CHANNELS = _DYNAMIC_VIEW_CHANNELS_;
  }));

  describe('Service: EditorToolbar - Editor Settings', function() {

    it('Stupid test for getter function to show settings', function() {
      editorToolbarService.showEnvironmentSettingsPanel = true;
      expect(editorToolbarService.isEnvironmentSettingsPanelActive).toBeTruthy();
    });

    it('Stupid test for getter function to hide settings', function() {
      editorToolbarService.showEnvironmentSettingsPanel = false;
      expect(editorToolbarService.isEnvironmentSettingsPanelActive).toBeFalsy();
    });
  });
});