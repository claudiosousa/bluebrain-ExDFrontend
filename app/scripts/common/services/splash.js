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

  // This file contains a service for the splash screen as well as a controller
  // which manages the scope of the displayed HTML. We use a simple observer here
  // in order to notify the controller whenever an update message comes in.

  var module = angular.module('exdFrontendApp');
  module.service('splash', ['$modal', function ($modal) {

    this.showButton = false;
    this.callbackOnClose = undefined;
    this.spin = true;

    // We have to work around a bit here: The controller of the HTML will register
    // a function as a callback. This function will then update the contents of the
    // HTML.
    this.setObserver = function (callback) {
      this.observer = callback;
    };

    this.setMessage = function (message) {
      // Notify our controller that we have an update!
      if (angular.isDefined(this.observer)) {
        this.observer(message);
      }
    };

    this.open = function (showButton, callbackOnClose) {
      this.spin = true;
      this.showButton = showButton;
      this.callbackOnClose = callbackOnClose;
      if (angular.isDefined(this.modal)) { this.modal.close(); }
      this.modal = $modal.open({
        backdrop: false,
        animation:true,
        controller: 'ModalInstanceCtrl',
        templateUrl: 'views/splash/content.html',
        windowTemplateUrl: 'views/splash/index.html'
      });
      return this.modal;
    };

    this.close = function() {
      // Support multiple calls to close
      if (angular.isDefined(this.modal)) {
        this.modal.close();
      }
      if (angular.isDefined(this.callbackOnClose)) {
        this.callbackOnClose();
      }
      this.callbackOnClose = undefined;
      this.modal = undefined;
    };

  }]);

  module.controller('ModalInstanceCtrl', ['$scope', '$log', 'splash', '$timeout',
    function($scope, $log, splash, $timeout) {
      $scope.headline = '';
      $scope.subHeadline = '';
      $scope.progressInformation = '';
      $scope.showButton = splash.showButton;
      $scope.animate = false;

      $timeout(function () {$scope.animate = true;}, 100);

      splash.setObserver(function (message) {
        if (!message.headline && !message.subHeadline) {
          $log.error('Wrong message format!');
          return;
        }

        $timeout(function () {
          $scope.headline = message.headline ? message.headline : '';
          $scope.subHeadline = message.subHeadline ? message.subHeadline : '';
          $scope.progressInformation = message.progressInformation ? message.progressInformation : '';
          $scope.spin = splash.spin;
        });
      });

      $scope.close = function() {
        splash.close();
      };

    }]);

}());
