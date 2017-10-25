(function() {
  'use strict';

  angular
    .module('spikeListenerServiceMock', [])
    .service('spikeListenerService', function() {
      this.startListening = jasmine.createSpy('startListening');
      this.stopListening = jasmine.createSpy('stopListening');
    });
})();
