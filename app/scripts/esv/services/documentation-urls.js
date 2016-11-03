(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
    .constant('HELP_BASE_URL', "https://developer.humanbrainproject.eu/docs"
    );

  angular.module('exdFrontendApp').factory('documentationURLs', ['HELP_BASE_URL',
    function (HELP_BASE_URL) {
      return {
        getDocumentationURLs: function () {
          return {
            cleDocumentationURL: HELP_BASE_URL + '/hbp-nrp-cle/latest/',
            backendDocumentationURL: HELP_BASE_URL + '/hbp_nrp_backend/latest/',
            platformDocumentationURL: HELP_BASE_URL + '/HBP Neurorobotics Platform/latest/'
          };
        }
      };
    }]);
})();
