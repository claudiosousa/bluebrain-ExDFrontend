(function () {
  'use strict';

  angular.module('exdFrontendFilters')
    .filter('serverStatus', function () {
      var classesByState = {
        OK: '', //no styling applied if everything is normal
        WARNING: 'label-warning',
        CRITICAL: 'label-danger'
      };

      return function (serverNames, serverEnabled) {

        var firstSelectedServer = serverNames.find(function (server) {
          return serverEnabled.indexOf(server.id) >= 0;
        });
        return firstSelectedServer ? classesByState[firstSelectedServer.state] : classesByState.CRITICAL;
      };
    });
})();