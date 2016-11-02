(function ()
{
  'use strict';

  angular.module('exdFrontendApp')
    .service('oidcClientService', ['$q', '$interval', 'bbpOidcSession', 'bbpConfig',
      function ($q, $interval, bbpOidcSession, bbpConfig)
      {
        var isEnsureToken = bbpConfig.get('auth.ensureToken', true);
        return {
          ensureSession: function ()
          {
            var deferred = $q.defer();
            var interval = $interval(function ()
            {
              if (bbpOidcSession.token() || !isEnsureToken)
              {
                $interval.cancel(interval);
                deferred.resolve();
              }
            }, 100);
            return deferred.promise;
          }
        };
      }]);
} ());
