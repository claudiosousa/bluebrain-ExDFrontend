(function () {
  'use strict';

  var module = angular.module('collabServices', ['ngResource', 'bbpConfig',
    'nrpErrorHandlers']);

  module.factory('collabConfigService', ['$resource', 'serverError', 'bbpConfig', function ($resource, serverError, bbpConfig) {
    var baseUrl = bbpConfig.get('api.collabContextManagement.url');
    return $resource(baseUrl + '/collab/configuration/:contextId', {}, {
      clone: {
        method: 'PUT',
        interceptor: {responseError: serverError.display}
      },
      get: {
        method: 'GET',
        interceptor: {responseError: serverError.display}
      }
    });
  }]);

}());
