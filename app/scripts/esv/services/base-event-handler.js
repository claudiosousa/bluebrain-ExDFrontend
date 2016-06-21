(function () {
  'use strict';

  /* global console: false */

  angular.module('exdFrontendApp').service('baseEventHandler', function() {
      this.suppressAnyKeyPress = function(event) {
          event.stopPropagation();
      };
  });
}());
