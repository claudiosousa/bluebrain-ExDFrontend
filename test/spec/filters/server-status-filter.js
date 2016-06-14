(function () {
  'use strict';
  describe('Server status filters', function () {
    var serverStatus;
    beforeEach(module('exdFrontendFilters'));
    beforeEach(inject(function (_serverStatusFilter_) {
      serverStatus = _serverStatusFilter_;
    }));

    describe('serverStatus', function () {
      var serverNames = [
        { id: 'a', state: 'OK' },
        { id: 'b', state: 'WARNING' },
        { id: 'c', state: 'CRITICAL' }
      ];

       var classesByState = {
        OK: '',
        WARNING: 'label-warning',
        CRITICAL: 'label-danger'
      };

      it('should filter disabled servers are return appropriate status', function () {
        expect(serverStatus(serverNames, ['b', 'c'])).toBe(classesByState.WARNING);
      });
  });
});
})();