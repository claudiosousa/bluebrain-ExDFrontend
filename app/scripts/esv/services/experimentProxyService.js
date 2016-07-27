(function () {
  'use strict';

  angular.module('experimentServices', ['environmentServiceModule'])
    .service('experimentProxyService',
    ['$http', '$q', 'bbpConfig',
      function ($http, $q, bbpConfig) {

        var getProxyUrl = function () {
          return bbpConfig.get('api.proxy.url');
        };

        return {
          getExperiments: getExperiments,
          getImages: getImages,
          getServerConfig: _.memoize(getServerConfig)
        };

        function getServerConfig(serverId) {
          return $http.get(getProxyUrl() + '/server/' + serverId)
            .then(function (response) { return response.data; });
        }

        function getImages(experimentIds) {
          return $http.get(getProxyUrl()  + '/experimentImage/' + experimentIds.join(','))
            .then(function (response) { return response.data; });
        }

        function getExperiments(contextId, experimentId) {
          var url = getProxyUrl()  + '/experiments';
          if (experimentId) {
            url += '?contextId=' + contextId + '&experimentId=' + experimentId;
          }
          return $http.get(url)
            .then(function (response) { return response.data; });
        }
      }
    ]);
})();