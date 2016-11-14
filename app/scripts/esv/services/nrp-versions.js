(function () {
  'use strict';

  var getLatestReleasedVersion = function (version) {
    var versionComponents = {};
    var versionRegex = /^(\d+)\.(\d+)\.(\d+)(\.(\w+))?$/g;
    var match = versionRegex.exec(version);
    if (match && match.length >= 4) {
      versionComponents.major = match[1];
      versionComponents.minor = match[2];
      versionComponents.patch = match[3];
      if (match.length === 6) {
        versionComponents.dev = match[5];
      }
      return versionComponents;
    }
  };

  var parseResponseComponentVersions = function (data) {
    var result = {};

    angular.forEach(angular.fromJson(data), function (value, key) {
      result[key] = value;
      var components = getLatestReleasedVersion(value);
      if (components) {
        result[key + '_components'] = components;
      }
    });
    return result;
  };

  angular.module('nrpBackendAbout', ['ngResource', 'nrpErrorHandlers'])
    // This service provides the versions of the Closed Loop Engine and the Experiment Designer back-ends
    .factory('nrpBackendVersions', ['$resource', 'serverError', function ($resource, serverError) {
      return function (baseUrl) {
        return $resource(baseUrl + '/version', {}, {
          get: {
            method: 'GET',
            interceptor: { responseError: serverError.displayHTTPError },
            transformResponse: parseResponseComponentVersions
          }
        });
      };
    }])

    .factory('nrpFrontendVersion', ['$resource', 'serverError', function ($resource, serverError) {
      return $resource('version.json', {}, {
        get: {
          method: 'GET',
          interceptor: { responseError: serverError.displayHTTPError },
          transformResponse: parseResponseComponentVersions
        }
      });
    }]);

} ());
