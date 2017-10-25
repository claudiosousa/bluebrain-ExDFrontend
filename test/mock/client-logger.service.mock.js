(function() {
  'use strict';

  angular
    .module('clientLoggerServiceMock', [])
    .service('clientLoggerService', function() {
      this.getLogHistory = [];
      this.consoleLogReceived = jasmine.createSpy('consoleLogReceived');
      this.resetLoggedMessages = jasmine.createSpy('resetLoggedMessages');
      this.logMessage = jasmine.createSpy('logMessage');
      this.logs = new Rx.Subject();
      this.onExit = jasmine.createSpy('onExit');
    })
    .constant('LOG_TYPE', {
      INFO: 1,
      ADVERTS: 2
    });
})();
