'use strict';

describe('Services: baseEventHandler', function () {
      var keyboardEventMock = {
        stopPropagation: jasmine.createSpy('stopPropagation')
      };

      var baseEventHandler, event;
      beforeEach(module('exdFrontendApp'));
      beforeEach(module(function ($provide) {
          $provide.value('$event', keyboardEventMock);
      }));
      beforeEach(inject(function (_baseEventHandler_, _$event_) {
        baseEventHandler = _baseEventHandler_;
        event = _$event_;
      }));

      it('should stop further event propagation', function () {
        baseEventHandler.suppressAnyKeyPress(event);
        expect(keyboardEventMock.stopPropagation).toHaveBeenCalled();
      });
});
