(function() {
  'use strict';

  describe('Directive: help-tooltip-popover', function() {

    beforeEach(module('simulationConfigServiceMock'));
    beforeEach(module('helpTooltipPopoverModule'));
    beforeEach(module('exd.templates')); // import html template

    var scope,
      helpTooltipService,
      STATE,
      stateService;

    beforeEach(inject(function($rootScope, $compile, $httpBackend, _helpTooltipService_, _STATE_, _stateService_) {
      helpTooltipService = _helpTooltipService_;
      STATE = _STATE_;
      stateService = _stateService_;

      $httpBackend.whenGET(/.*/).respond(200);

      var element = $compile('<help-tooltip-popover></help-tooltip-popover>')($rootScope);
      $rootScope.$digest();
      scope = element.isolateScope();
    }));

    it('should expose services', function() {
      expect(scope.helpTooltipService).toBe(helpTooltipService);
      expect(scope.STATE).toBe(STATE);
      expect(scope.stateService).toBe(stateService);
    });

  });
}());

