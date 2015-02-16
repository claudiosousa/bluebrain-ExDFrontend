(function () {
  'use strict';

  var module = angular.module('exdFrontendApp');
  module.factory('splash', ['$modal', '$rootScope', function ($modal, $rootScope) {

    $rootScope.headline = '';
    $rootScope.subHeadline = '';

    // we currently use $rootScope here which is not really best practice
    return {
      setHeadline: function (headline) {
        $rootScope.$apply(function() {
          $rootScope.headline = headline;
        });
      },
      setSubHeadline: function(subHeadline) {
        $rootScope.$apply(function() {
          $rootScope.subHeadline = subHeadline;
        });
      },
      open: function () {
        return $modal.open({
          backdrop: false,
          templateUrl: 'views/splash/content.html',
          windowTemplateUrl: 'views/splash/index.html'
        });
      }
    };
  }]);

}());
