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

        var firstSelectedServer = undefined;
        var i = 0;
        while(!angular.isDefined(firstSelectedServer) && i<serverNames.length) {
          if (serverEnabled.indexOf(serverNames[i].id) >= 0) {
            firstSelectedServer = serverNames[i];
          }
          i++;
        }
        return firstSelectedServer ? classesByState[firstSelectedServer.state] : classesByState.CRITICAL;
      };
    });
})();
