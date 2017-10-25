'use strict';

describe('Service: help-service', function() {
  beforeEach(module('helpTooltipModule'));

  var nrpAnalytics, helpTooltipService, HELP_CODES;

  beforeEach(
    inject(function(_nrpAnalytics_, _helpTooltipService_, _HELP_CODES_) {
      nrpAnalytics = _nrpAnalytics_;
      helpTooltipService = _helpTooltipService_;
      HELP_CODES = _HELP_CODES_;

      spyOn(nrpAnalytics, 'eventTrack');
    })
  );

  it('should be invisible by default ', function() {
    expect(helpTooltipService.visible).toBe(false);
  });

  it('should be toggle HELP visibility on toggleHelp', function() {
    expect(helpTooltipService.visible).toBe(false);
    helpTooltipService.toggleHelp();
    expect(helpTooltipService.visible).toBe(helpTooltipService.HELP);
    helpTooltipService.toggleHelp();
    expect(helpTooltipService.visible).toBe(false);
  });

  it('should be toggle INFO visibility on toggleInfo', function() {
    expect(helpTooltipService.visible).toBe(false);
    helpTooltipService.toggleInfo();
    expect(helpTooltipService.visible).toBe(helpTooltipService.INFO);
    helpTooltipService.toggleInfo();
    expect(helpTooltipService.visible).toBe(false);
  });

  it('should not toggle HELP <-> INFO states directly', function() {
    expect(helpTooltipService.visible).toBe(false);
    helpTooltipService.toggleHelp();
    expect(helpTooltipService.visible).toBe(helpTooltipService.HELP);
    helpTooltipService.toggleInfo();

    helpTooltipService.toggleHelp();
    expect(helpTooltipService.visible).toBe(false);

    helpTooltipService.toggleInfo();
    expect(helpTooltipService.visible).toBe(helpTooltipService.INFO);
    helpTooltipService.toggleHelp();
    expect(helpTooltipService.visible).toBe(helpTooltipService.INFO);
    helpTooltipService.toggleInfo();
    expect(helpTooltipService.visible).toBe(false);
  });

  it('should set help details on display', function() {
    helpTooltipService.toggleHelp();
    helpTooltipService.displayHelp('PLAY_BUTTON');
    expect(helpTooltipService.helpDescription).toBe(HELP_CODES.PLAY_BUTTON);
    expect(helpTooltipService.helpCode).toBe('PLAY_BUTTON');
    expect(nrpAnalytics.eventTrack).toHaveBeenCalled();

    helpTooltipService.displayHelp('PLAY_BUTTON');
    expect(helpTooltipService.helpDescription).toBe(null);
    expect(helpTooltipService.helpCode).toBe(null);
  });

  it('should NOT set help details on display if not in HELP mode', function() {
    helpTooltipService.displayHelp('PLAY_BUTTON');
    expect(helpTooltipService.helpDescription).not.toBeDefined();

    helpTooltipService.toggleInfo();
    helpTooltipService.displayHelp('PLAY_BUTTON');
    expect(helpTooltipService.helpDescription).toBeDefined();
  });

  it('should be clear context on toggleVisibility', function() {
    helpTooltipService.toggleHelp();
    expect(helpTooltipService.visible).toBe(helpTooltipService.HELP);

    helpTooltipService.displayHelp('PLAY_BUTTON');
    expect(helpTooltipService.helpDescription).not.toBe(null);
    expect(helpTooltipService.helpCode).not.toBe(null);

    helpTooltipService.toggleHelp();
    expect(helpTooltipService.helpDescription).toBe(null);
    expect(helpTooltipService.helpCode).toBe(null);
  });

  it('should hide on Escape key and Escape key only', function() {
    helpTooltipService.toggleHelp();
    expect(helpTooltipService.visible).not.toBe(false);

    var event = $.Event('keydown');
    event.keyCode = 65; //Non escape key
    $(window).trigger(event);
    expect(helpTooltipService.visible).not.toBe(false);

    event.keyCode = 27; //Escape key
    $(window).trigger(event);
    expect(helpTooltipService.visible).toBe(false);
  });
});
