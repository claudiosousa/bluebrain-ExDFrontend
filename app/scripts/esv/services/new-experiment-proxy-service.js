(function () {
    'use strict';
    angular.module('exdFrontendApp')
        .service('newExperimentProxyService',
        ['$http', 'bbpConfig',
            function ($http, bbpConfig) {
              /**
               *  Fetches the proxyUrl
               *  
               *  Example usage : 
               *  var proxyUrl = newExperimentProxyService.getProxyUrl();
               *  which will fetch the proxy url to use in subsequent HTTP requests
               *
               *  @return the proxy Url, as appears in the config.json file
              **/
               this.getProxyUrl = function () {
                    return bbpConfig.get('api.proxy.url');
                };
              /**
               *  Performs an HTTP request to the proxy to fetch an entity from the models
               *  (i.e. robot, environment, brain etc).
               *  
               *  Example usage : 
               *  var robotsJSONPromise = newExperimentProxyService.getEntity('robots');
               *  which will fetch a promise containing the JSON with the response
               *
               *  @return a promise containing the JSON with the response from the proxy. The 
               *  promise itself contains an array of entities. 
              **/
                this.getEntity = function (entityName) {
                    return $http({
                        url: this.getProxyUrl() + '/models/' + entityName,
                        method: 'GET'
                    });
                };
            }
        ]);
})();
