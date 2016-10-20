(function () {
  'use strict';

/* global console: false */

  // This file contains a service for the splash screen as well as a controller
  // which manages the scope of the displayed HTML. We use a simple observer here
  // in order to notify the controller whenever an update message comes in.

  var module = angular.module('exdFrontendApp');
  module.service('assetLoadingSplash', ['$modal', function ($modal) {
    var myModal;
    var progressObserver;

    // We have to work around a bit here: The controller of the HTML will register
    // a function as a callback. This function will then update the contents of the
    // HTML.
    var setProgressObserver = function (callback) {
      progressObserver = callback;
    };

    var setProgress = function(data) {
      // Notify our controller that we have an update!
      if (progressObserver) {
        progressObserver(data);
      }
    };

    var open = function (callbackOnClose) {
      this.callbackOnClose = callbackOnClose;
      if (angular.isDefined(myModal)){ myModal.close(); }
      myModal = $modal.open( {
        backdrop: false,
        animation: true,
        controller: 'AssetLoadingSplashCtrl',
        templateUrl: 'views/splash/asset-loading-splash.html',
        windowTemplateUrl: 'views/splash/index.html'
      });
      return myModal;
    };

    var close = function() {
      if (angular.isDefined(myModal)) {
        myModal.close();
      }
      if (angular.isDefined(this.callbackOnClose)) {
        this.callbackOnClose();
      }
      myModal = undefined;
    };

    return {
      open: open,
      close: close,
      setProgress: setProgress,
      setProgressObserver: setProgressObserver
    };

  }]);

  module.controller('AssetLoadingSplashCtrl', ['$scope', '$log', '$filter', '$timeout', 'assetLoadingSplash', function ($scope, $log, $filter, $timeout, assetLoadingSplash) {
    $scope.progressData = {};
    $scope.percentage = 0;
    $scope.isError = false;
    $scope.loadedAssets = 0;
    $scope.totalAssets = 0;

    $scope.close = function() {
      assetLoadingSplash.close();
    };

    assetLoadingSplash.setProgressObserver(function(data) {
      var isDone = true;
      var loadedAssets = 0;

      $scope.$apply(function() { $scope.totalAssets = data.assets.length; });

      angular.forEach(data.assets, function(element, index) {
        loadedAssets += element.done ? 1 : 0;
        isDone = isDone && element.done;
        $scope.isError = $scope.isError || element.error;
      });
      if (data.prepared && isDone && !$scope.isError ) { // if there were errors, a button is showed for the user to explicitly close the splash
          assetLoadingSplash.close();
      }
      // We use $timeout to prevent "digest already in progress" error.
      $timeout(function() {
        $scope.$apply(function() {
          $scope.progressData = data;
          $scope.loadedAssets = loadedAssets;
        });
      });
    });
    // Give 15 seconds for assets to be loaded
    $timeout(function() {
      if($scope.loadedAssets === 0){
        console.error("Asset loading timeout occured.");
        $scope.isError = true;
      }
    }, 15000);
  }]);

}());
