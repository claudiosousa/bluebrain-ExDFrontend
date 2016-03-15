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

  module.controller('ModalInstanceCtrl', function ($scope, $log, splash) {
    $scope.headline = '';
    $scope.subHeadline = '';
    $scope.progressInformation = '';
    $scope.showButton = splash.showButton;


    splash.setObserver(function (message) {
      if (!message.headline && !message.subHeadline) {
        $log.error('Wrong message format!');
        return;
      }

      // Unfortunately we have to use _.defer and $apply here, but otherwise the contents in
      // the HTML do not get updated correctly. (We get a "digest already in progress" error.)
      _.defer(function() { // jshint ignore:line
        $scope.$apply(function () {
          $scope.headline = message.headline ? message.headline : '';
          $scope.subHeadline = message.subHeadline ? message.subHeadline : '';
          $scope.progressInformation = message.progressInformation ? message.progressInformation : '';
          $scope.spin = splash.spin;
        });
      });

    });

    $scope.close = function() {
      splash.close();
    };

  });

}());
