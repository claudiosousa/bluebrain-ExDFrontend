(function () {
  'use strict';

  /**
   * @ngdoc
   * @name MainCtrl
   *
   * @description
   * `MainCtrl` is the main application controller and is associated
   * to the `home` state.
   */
  angular.module('exdFrontendApp')
    .controller('MainCtrl', ['$scope', '$window', 'browserSupport', 'bbpConfig', '$log', 'nrpUser',
      function ($scope, $window, browserSupport, bbpConfig, $log, nrpUser) {
        nrpUser.isMemberOfClusterReservationGroup().then(function(response) {
          $scope.displayClusterReservationForm = response;
        });
        // Unsupported browser warning
        $scope.dismissWarning = $window.sessionStorage.getItem('unsupportedBrowserWarning') === 'dismissed';
        $scope.isSupportedBrowser = browserSupport.isSupported();
        $scope.supportedBrowsers = [''];

        // Cluster reservation form
        $scope.dismissReservationForm = $window.sessionStorage.getItem('reservationForm') === 'dismissed';

        var collabIds;
        try {
          collabIds = bbpConfig.get('collab.collabIds');
        } catch (e) {
          $log.error('\'collabIds\' is missing in your app/config.json. Please update it from app/config.json.sample');
        }

        $scope.getCollabItemUrl = function (collabItem) {
          return (collabIds && collabIds.neuroroboticsCollabBaseUrl) +
            (collabIds && collabIds.pagesId && collabIds.pagesId[collabItem]);
        };

        if ($scope.dismissWarning === false && $scope.isSupportedBrowser === false) {
          $scope.supportedBrowsers = browserSupport.SUPPORTED_BROWSERS;
          $scope.browser = browserSupport.getBrowserVersion();
          if ($scope.browser === 'unknown') {
            $scope.browser = 'your browser';
          }
          $scope.dismissBrowserWarning = function () {
            _.defer(function () {
              $scope.$apply(function () {
                $window.sessionStorage.setItem('unsupportedBrowserWarning', 'dismissed');
                $scope.dismissWarning = true;
              });
            });
          };
        }

        $scope.setClusterReservation = function() {
          $window.sessionStorage.setItem('clusterReservation', $scope.clusterReservationName);
        };

        $scope.dismissClusterReservationForm = function () {
            _.defer(function () {
              $scope.$apply(function () {
                $window.sessionStorage.setItem('reservationForm', 'dismissed');
                $scope.dismissReservationForm = true;
              });
            });
          };
      }]);
} ());