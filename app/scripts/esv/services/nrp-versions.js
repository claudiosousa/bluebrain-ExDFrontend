(function() {
  'use strict';

  var module = angular.module('nrpBackendAbout', ['ngResource', 'nrpErrorHandlers']);
  // This service provides the versions of the Closed Loop Engine and the Experiment Designer back-ends
  module.factory('nrpBackendVersions', ['$resource', 'serverError', function($resource, serverError) {
    return function(baseUrl) {
      return $resource(baseUrl + '/version', {}, {
        get: {
          method: 'GET',
          interceptor : {responseError : serverError}
        }
      });
    };
  }]);

  module.factory('nrpFrontendVersion', ['$resource', function($resource) {
    return $resource('version.json');
  }]);
}());
