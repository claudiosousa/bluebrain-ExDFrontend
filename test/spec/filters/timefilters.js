'use strict';

describe('filters', function () {
  beforeEach(module('exdFrontendFilters'));

  describe('timeDDHHMMSS', function() {

    it('should convert seconds values to DD HH:MM:SS string',
      inject(function(timeDDHHMMSSFilter) {
      /* true negative tests */
      expect(timeDDHHMMSSFilter('')).toBe('-- --:--:--');
      expect(timeDDHHMMSSFilter('invalid_value')).toBe('-- --:--:--');
      /* true positive tests */
      expect(timeDDHHMMSSFilter(0)).toBe('00 00:00:00');
      expect(timeDDHHMMSSFilter(5)).toBe('00 00:00:05');
      expect(timeDDHHMMSSFilter(28)).toBe('00 00:00:28');
      expect(timeDDHHMMSSFilter(95623)).toBe('01 02:33:43');
      expect(timeDDHHMMSSFilter(1654892)).toBe('19 03:41:32');
      expect(timeDDHHMMSSFilter(16548923)).toBe('191 12:55:23');
    }));
  });
});
