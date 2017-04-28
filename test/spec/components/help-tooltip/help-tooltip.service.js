'use strict';

describe('Service: help-service', function() {

  beforeEach(module('helpTooltipModule'));

  var nrpAnalytics,
    helpTooltipService,
    HELP_CODES;

  beforeEach(inject(function(_nrpAnalytics_, _helpTooltipService_, _HELP_CODES_) {
    nrpAnalytics = _nrpAnalytics_;
    helpTooltipService = _helpTooltipService_;
    HELP_CODES = _HELP_CODES_;

    spyOn(nrpAnalytics, 'eventTrack');
  }));

  it('should be invisible by default ', function() {
    expect(helpTooltipService.visible).toBe(false);
  });

  it('should be toggle visibility on toggleVisibility', function() {
    expect(helpTooltipService.visible).toBe(false);
    helpTooltipService.toggleVisibility();
    expect(helpTooltipService.visible).toBe(true);
    helpTooltipService.toggleVisibility();
    expect(helpTooltipService.visible).toBe(false);
  });

  it('should set help details on display', function() {
    helpTooltipService.display('PLAY_BUTTON');
    expect(helpTooltipService.helpDescription).toBe(HELP_CODES.PLAY_BUTTON);
    expect(helpTooltipService.helpCode).toBe('PLAY_BUTTON');
    expect(nrpAnalytics.eventTrack).toHaveBeenCalled();

    helpTooltipService.display('PLAY_BUTTON');
    expect(helpTooltipService.helpDescription).toBe(null);
    expect(helpTooltipService.helpCode).toBe(null);
  });

  it('should be clear context on toggleVisibility', function() {
    helpTooltipService.toggleVisibility();
    expect(helpTooltipService.visible).toBe(true);

    helpTooltipService.display('PLAY_BUTTON');
    expect(helpTooltipService.helpDescription).not.toBe(null);
    expect(helpTooltipService.helpCode).not.toBe(null);

    helpTooltipService.toggleVisibility();
    expect(helpTooltipService.helpDescription).toBe(null);
    expect(helpTooltipService.helpCode).toBe(null);
  });
});
