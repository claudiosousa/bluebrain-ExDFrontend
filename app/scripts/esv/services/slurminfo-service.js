(function () {
  'use strict';

  var module = angular.module('slurminfoService', ['ngResource', 'bbpConfig',
    'nrpErrorHandlers']);

  module.factory('slurminfoService', ['$resource', 'serverError', 'bbpConfig', function ($resource, serverError, bbpConfig) {
    var baseUrl = bbpConfig.get('api.slurmmonitor.url');

    // When we can't access the viz cluster frontend no error message is returned
    // We therefore add one here
    var errorWrapper = _.wrap(serverError.displayHTTPError, function(errDisplayFn, response) {
      if (response.status === -1) {
        response = angular.extend(response, {
          data: "Could not probe vizualization cluster"
        });
      }
      errDisplayFn(response);
    });

    return $resource(baseUrl + '/api/v1/partitions/interactive', {}, {
      get: {
        method: 'GET',
        // If we can't access server frontend, only display error once
        // Since we are probing every minute
        interceptor: {responseError: _.once(errorWrapper)}
      }
    });
  }]);

}());
