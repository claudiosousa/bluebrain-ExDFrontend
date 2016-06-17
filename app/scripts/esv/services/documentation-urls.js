(function() {
  'use strict';

  angular.module('exdFrontendApp.Constants')
    .constant('HELP_BASE_URL', "https://developer.humanbrainproject.eu/docs"
  );

  angular.module('exdFrontendApp').factory('documentationURLs', [
    '$log',
    'backendInterfaceService',
    'nrpBackendVersions',
    'HELP_BASE_URL',
    function ($log, backendInterfaceService, nrpBackendVersions, HELP_BASE_URL) {
      function getDocumentVersion(moduleVersion)
      {
        var documentationVersion = moduleVersion.major + '.' + moduleVersion.minor + '.';
        // dev version, we take the previous patch version
        // WARNING: This does not work if the patch version is 0. We assume that X.X.0.devX will never exists
        // (in other words if the minor changes, then the first dev version has to be X.X.1.dev0).
        if ('dev' in moduleVersion) {
          var patchVersion = parseInt(moduleVersion.patch);
          if (patchVersion !== 0) {
            return documentationVersion.concat((patchVersion - 1).toString());
          }
          else {
            $log.error('Help URL cannot be computed for dev version ' + documentationVersion + moduleVersion.patch);
          }
        }
        return documentationVersion.concat(moduleVersion.patch);
      }

      return {
        getDocumentationURLs: function() {
          var promise = nrpBackendVersions(backendInterfaceService.getServerBaseUrl()).get().$promise.then(function(data) {
            var cleDocumentationVersion, backendDocumentationVersion, platformDocumentationVersion = 'latest';
            if ('hbp_nrp_cle_components' in data) {
              cleDocumentationVersion = getDocumentVersion(data.hbp_nrp_cle_components);
            }
            if ('hbp_nrp_backend_components' in data) {
              backendDocumentationVersion = getDocumentVersion(data.hbp_nrp_backend_components);
              platformDocumentationVersion = data.hbp_nrp_backend_components.major + '.' + data.hbp_nrp_backend_components.minor;
            }
            return {
                cleDocumentationURL:  HELP_BASE_URL + '/projects/hbp-nrp-cle/' + cleDocumentationVersion,
                backendDocumentationURL:  HELP_BASE_URL + '/projects/hbp_nrp_backend/' + backendDocumentationVersion,
                platformDocumentationURL: HELP_BASE_URL + '/projects/HBP%20Neurorobotics%20Platform/' + platformDocumentationVersion
            };
          });
          return promise;
        }
      };
    }]);
})();
