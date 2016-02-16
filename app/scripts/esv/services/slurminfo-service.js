(function () {
  'use strict';

  var module = angular.module('slurminfoService', ['ngResource', 'bbpConfig',
    'nrpErrorHandlers']);

  module.factory('slurminfoService', ['$resource', 'serverError', 'bbpConfig', function ($resource, serverError, bbpConfig) {
    var baseUrl = bbpConfig.get('api.slurmmonitor.url');
    return $resource(baseUrl + '/api/v1/partitions/interactive', {}, {
      get: {
        method: 'GET',
        interceptor: {responseError: serverError.display}
      }
    });
  }]);

}());
