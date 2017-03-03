(function() {
  'use strict';

  angular.module('environmentServiceModule', [])
    .factory('environmentService', ['$rootScope', '$location', function($rootScope, $location) {

      return {
        initialize: initialize,
        isDevMode: isDevMode,
        isPrivateExperiment: isPrivateExperiment,
        setPrivateExperiment: setPrivateExperiment
      };

      function initialize() {
        $rootScope.$on('$locationChangeStart', function() {
          $rootScope.devMode = isDevMode();
        });
      }

      function isDevMode() {
        return !!$location.search().dev;
      }

      function isPrivateExperiment() {
        return $rootScope.isPrivateExperiment;
      }

      function setPrivateExperiment(isPrivateExperiment) {
        $rootScope.isPrivateExperiment = isPrivateExperiment;
      }
    }]);

}());
