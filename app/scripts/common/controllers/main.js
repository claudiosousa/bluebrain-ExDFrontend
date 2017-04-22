/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/
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