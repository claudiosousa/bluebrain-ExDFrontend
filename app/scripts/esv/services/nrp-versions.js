(function() {
  'use strict';

  var module = angular.module('nrpBackendAbout', ['ngResource', 'nrpErrorHandlers']);
  // This service provides the versions of the Closed Loop Engine and the Experiment Designer back-ends
  module.factory('nrpBackendVersions', ['$resource', 'serverError', function($resource, serverError) {
    return function(baseUrl) {
      return $resource(baseUrl + '/version', {}, {
        get: {
          method: 'GET',
          interceptor : {responseError : serverError},
          transformResponse: function(data) {
            var result = {};
            var getLatestReleasedVersion = function(version)
            {
              var versionComponents = {};
              var versionRegex = /^(\d+)\.(\d+)\.(\d+)(\.(\w+))?$/g;
              var match = versionRegex.exec(version);
              if (match && match.length >= 4)
              {
                versionComponents.major = match[1];
                versionComponents.minor = match[2];
                versionComponents.patch = match[3];
                if (match.length === 6)
                {
                  versionComponents.dev = match[5];
                }
                return versionComponents;
              }
            };
            angular.forEach(angular.fromJson(data), function(value, key) {
              result[key] = value;
              var components = getLatestReleasedVersion(value);
              if (components) {
                result[key + '_components'] =  components;
              }
            });
            return result;
          }
        }
      });
    };
  }]);

  module.factory('nrpFrontendVersion', ['$resource', function($resource) {
    return $resource('version.json');
  }]);

}());
