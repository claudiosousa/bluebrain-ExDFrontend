(function () {
  'use strict';

  angular.module('experimentServices', ['environmentServiceModule'])
    .service('experimentProxyService',
    ['$http', '$q', 'bbpConfig', 'serverError',
      function ($http, $q, bbpConfig, serverError) {

        var getProxyUrl = function () {
          return bbpConfig.get('api.proxy.url');
        };

        return {
          getExperiments: getExperiments,
          getImages: getImages,
          getServerConfig: _.memoize(getServerConfig),
          getJoinableServers: getJoinableServers,
          getAvailableServers: getAvailableServers
        };

        function getServerConfig(serverId) {
          return $http.get(getProxyUrl() + '/server/' + serverId)
            .then(function (response) { return response.data; })
            .catch(serverError.displayHTTPError);
        }

        function getImages(experimentIds) {
          return $http.get(getProxyUrl()  + '/experimentImage/' + experimentIds.join(','))
            .then(function (response) { return response.data; })
            .catch(serverError.displayHTTPError);
        }

        function getExperiments() {
          var url = getProxyUrl()  + '/experiments';
          return $http.get(url)
            .then(function (response) { return response.data; });
        }

        function getJoinableServers(contextId) {
          return $http.get(getProxyUrl() + '/joinableServers/' + contextId)
            .then(function (response) { return response.data; })
            .catch(serverError.displayHTTPError);
        }

        function getAvailableServers(experimentId) {
          return $http.get(getProxyUrl() + '/availableServers/' + experimentId)
            .then(function (response) { return response.data; })
            .catch(serverError.displayHTTPError);
        }
      }
    ]);
})();
