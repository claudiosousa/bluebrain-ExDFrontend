(function () {
  'use strict';

  angular.module('environmentServiceModule', []).factory('environmentService', ['$rootScope', '$location', function ($rootScope, $location) {

    function topWindowIsInDevMode() {
      return /[?&](dev$|dev&)/.test(window.top.location.href); //when in a iframe, test top window url
    }

    function initialize() {
      $rootScope.$on('$locationChangeStart', function () {
        $rootScope.devMode = !!$location.search().dev || topWindowIsInDevMode();
      });
    }
    return {
      initialize: initialize
    };
  }]);

} ());
