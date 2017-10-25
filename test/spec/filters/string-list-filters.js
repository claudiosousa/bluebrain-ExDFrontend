(function() {
  'use strict';
  describe('String list filters', function() {
    beforeEach(module('exdFrontendFilters'));

    describe('joinWithEndException', function() {
      it(
        'should join items in the input list with a custom separator except for the last two',
        inject(function(joinWithEndExceptionFilter) {
          expect(joinWithEndExceptionFilter([])).not.toBeDefined();
          expect(joinWithEndExceptionFilter([], '+')).not.toBeDefined();
          expect(joinWithEndExceptionFilter(['single'])).toBe('single');
          expect(joinWithEndExceptionFilter(['single'], '-')).toBe('single');
          var list = ['Firefox', 'Chrome', 'Safari', 'IE'];
          expect(joinWithEndExceptionFilter(list)).toBe(
            'Firefox, Chrome, Safari, IE'
          );
          expect(joinWithEndExceptionFilter(list)).not.toBe(list.join()); // JavaScript's joint insert commas but no spaces
          expect(joinWithEndExceptionFilter(list, '; ')).toBe(
            'Firefox; Chrome; Safari; IE'
          );
          expect(joinWithEndExceptionFilter(list, ' && ')).toBe(
            'Firefox && Chrome && Safari && IE'
          );
          expect(joinWithEndExceptionFilter(list, undefined, ' or ')).toBe(
            'Firefox, Chrome, Safari or IE'
          );
          expect(joinWithEndExceptionFilter(list, undefined, ' and ')).toBe(
            'Firefox, Chrome, Safari and IE'
          );
          expect(joinWithEndExceptionFilter(list, ',', ' or ')).toBe(
            'Firefox,Chrome,Safari or IE'
          );
          expect(joinWithEndExceptionFilter(list, ',', ' and ')).toBe(
            'Firefox,Chrome,Safari and IE'
          );
        })
      );
    });
  });
})();
