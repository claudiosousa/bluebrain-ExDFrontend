(function() {
    'use strict';

    /**
     * @ngdoc
     * @name MainCtrl
     *
     * @description
     * `MainCtrl` is the main application controller and his associated
     * to the `home` state.
     */
    angular.module('exdFrontendApp')
        .controller('MainCtrl', ['$scope', '$window', 'browserSupport', 'joinWithEndExceptionFilter', 
          function($scope, $window, browserSupport, joinWithEndExceptionFilter) {
            $scope.dismissWarning = $window.sessionStorage.getItem('unsupportedBrowserWarning') === 'dismissed';
            $scope.isSupportedBrowser = browserSupport.isSupported();
            $scope.supportedBrowsers = [''];
            if ($scope.dismissWarning === false && $scope.isSupportedBrowser === false) {
              $scope.supportedBrowsers = browserSupport.SUPPORTED_BROWSERS;
              $scope.browser = browserSupport.getBrowserVersion();
              if ($scope.browser === 'unknown') {
                $scope.browser = 'your browser';
              }
              $scope.dismissBrowserWarning = function() {
                /* global _ : false */
                _.defer(function() { 
                    $scope.$apply(function () {
                      $window.sessionStorage.setItem('unsupportedBrowserWarning', 'dismissed');
                      $scope.dismissWarning = true;
                  });
                });
              };
            }
        }]);
}());