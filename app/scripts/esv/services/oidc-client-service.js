(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .service('oidcClientService', ['$q', 'bbpOidcSession', function ($q, bbpOidcSession) {
      return {
        ensureSession: function () {
          var deferred = $q.defer();
          var interval = setInterval(function () {
            if (bbpOidcSession.token()) {
              clearInterval(interval);
              deferred.resolve();
            }
          }, 100);
          return deferred.promise;
        }
      };
    }]);
} ());
