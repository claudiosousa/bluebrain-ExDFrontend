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
          $rootScope.devMode = !!$location.search().dev;
        });
      }

      function isDevMode() {
        return $rootScope.devMode;
      }

      function isPrivateExperiment() {
        return $rootScope.isPrivateExperiment;
      }

      function setPrivateExperiment(isPrivateExperiment) {
        $rootScope.isPrivateExperiment = isPrivateExperiment;
      }
    }]);

} ());
