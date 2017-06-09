(function() {
  'use strict';

  describe('Directive: help-tooltip', function() {

    beforeEach(module('helpTooltipModule'));
    beforeEach(module('exd.templates')); // import html template

    var element,
      rootScope,
      helpTooltipService,
      HELP_CODES;

    beforeEach(inject(function($rootScope, $compile, _helpTooltipService_, _HELP_CODES_, $httpBackend) {
      rootScope = $rootScope;
      helpTooltipService = _helpTooltipService_;
      HELP_CODES = _HELP_CODES_;

      rootScope.someAction = jasmine.createSpy('someAction');
      element = $compile('<div help-tooltip="PLAY_BUTTON" ng-click="someAction()"></div>')($rootScope);
      $httpBackend.whenGET(/\/me/).respond(200);
      rootScope.$digest();
    }));

    it('should not prevent click action by default', function() {
      element.trigger('click');
      expect(rootScope.someAction).toHaveBeenCalled();
    });

    it('should prevent click action if in help mode', function() {
      helpTooltipService.toggleHelp();
      element.trigger('click');
      expect(rootScope.someAction).not.toHaveBeenCalled();
      expect(helpTooltipService.helpDescription).toBe(HELP_CODES.PLAY_BUTTON);
      expect(helpTooltipService.helpCode).toBe('PLAY_BUTTON');
    });

    it('should highlight element when showing it\'s help', function() {
      expect(element.hasClass('toolbar-help-highlighted')).toBe(false);

      helpTooltipService.toggleHelp();
      element.trigger('click');
      rootScope.$digest();

      expect(element.hasClass('toolbar-help-highlighted')).toBe(true);
    });
  });
}());
