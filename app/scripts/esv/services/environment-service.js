(function () {
  'use strict';

  angular.module('environmentServiceModule', []).factory('environmentService', ['$rootScope', '$location', function ($rootScope, $location) {

    function initialize() {
      $rootScope.$on('$locationChangeStart', function () {
        $rootScope.devMode = !!$location.search().dev;
      });
    }
    return {
      initialize: initialize
    };
  }]);

} ());
