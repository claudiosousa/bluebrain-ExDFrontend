(function () {
  'use strict';

  var parseBackendVersion = function(data){
    var result = {};
    var versionString = "Backend:\n";
    angular.forEach(angular.fromJson(data), function (value, key) {
      versionString += "\t" + key + ": " + value + "\n";
    });
    result.toString = versionString;
    return result;
  };
  var parseFrontendVersion = function(data){
    var result = {};
    result.toString = "Frontend: "+ angular.fromJson(data).hbp_nrp_esv + "\n";
    return result;
  };
  angular.module('nrpBackendAbout', ['ngResource', 'nrpErrorHandlers'])
    // This service provides the versions of the Frontend and backend as a string
    .factory('nrpBackendVersions', ['$resource', 'serverError', function ($resource, serverError) {
      return function (baseUrl) {
        return $resource(baseUrl + '/version', {}, {
          get: {
            method: 'GET',
            interceptor: { responseError: serverError.displayHTTPError },
            transformResponse: parseBackendVersion
          }
        });
      };
    }])

    .factory('nrpFrontendVersion', ['$resource', 'serverError', function ($resource, serverError) {
      return $resource('version.json', {}, {
        get: {
          method: 'GET',
          interceptor: { responseError: serverError.displayHTTPError },
          transformResponse: parseFrontendVersion
        }
      });
    }]);

} ());
