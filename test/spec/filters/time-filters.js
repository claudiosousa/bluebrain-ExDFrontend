(function () {
'use strict';

describe('filters', function () {
  beforeEach(module('exdFrontendFilters'));

  describe('timeDDHHMMSS', function() {

    it('should convert seconds values to DD HH:MM:SS string',
      inject(function(timeDDHHMMSSFilter) {
        /* true negative tests */
        expect(timeDDHHMMSSFilter('')).toBe('--\u00A0--:--:--');
        expect(timeDDHHMMSSFilter('invalid_value')).toBe('--\u00A0--:--:--');
        /* true positive tests */
        expect(timeDDHHMMSSFilter(0)).toBe('00\u00A000:00:00');
        expect(timeDDHHMMSSFilter(5)).toBe('00\u00A000:00:05');
        expect(timeDDHHMMSSFilter(28)).toBe('00\u00A000:00:28');
        expect(timeDDHHMMSSFilter(95623)).toBe('01\u00A002:33:43');
        expect(timeDDHHMMSSFilter(1654892)).toBe('19\u00A003:41:32');
        expect(timeDDHHMMSSFilter(16548923)).toBe('191\u00A012:55:23');
      })
    );

    it('should convert an ISO date to uptime (seconds up to now)',
      inject(function(uptimeFilter) {
        var now = new Date();
        var nows = now.toISOString();
        /* true negative tests */
        expect(uptimeFilter(undefined)).toBe(0);
        expect(uptimeFilter('')).not.toBe(jasmine.any(Number));
        /* true positive tests */
        expect(uptimeFilter(nows)).toBeLessThan(10); // uptime from nows should be 0 but could be a little more is tests delayed
        expect(uptimeFilter(nows) >= 0).toBeTruthy();
        var yesterdays = new Date(now.getTime()-86400000).toISOString();
        expect(uptimeFilter(yesterdays)).toBeLessThan(86410);
        expect(uptimeFilter(yesterdays) >= 86400).toBeTruthy();
      })
    );
  });
});
})();