'use strict';

describe('Service: EditorToolbar', function() {

  var editorToolbarService;

  // load the corresponding module
  beforeEach(module('editorToolbarModule'));

  beforeEach(inject(function(_editorToolbarService_) {
    editorToolbarService = _editorToolbarService_;
  }));

  describe('Service: EditorToolbar - Log Console', function() {

    it('Counting of log message if no console is shown', function() {
      editorToolbarService.showLogConsole = false;
      editorToolbarService.consoleLogReceived();
      expect(editorToolbarService.missedConsoleLogs).toBe(1);
    });

    it('Do not count log message if console is shown', function() {
      editorToolbarService.showLogConsole = true;
      editorToolbarService.consoleLogReceived();
      expect(editorToolbarService.missedConsoleLogs).toBe(0);
    });

    it('Reset log message has to reset missedConsoleLogs counter', function() {
      editorToolbarService.missedConsoleLogs = 2;
      editorToolbarService.resetLoggedMessages();
      expect(editorToolbarService.missedConsoleLogs).toBe(0);
    });
  });

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