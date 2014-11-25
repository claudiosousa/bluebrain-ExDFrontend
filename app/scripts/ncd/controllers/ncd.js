(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name exdFrontendApp.controller:NcdCtrl
   * @description
   * # NcdCtrl
   * Controller for the neural circuit designer
   */
  angular.module('exdFrontendApp')
    .controller('NcdCtrl', function ($scope, $state) {
      // save the state object for use in the navbar
      $scope.$state = $state;

      // the blueprint variable will save the data
      // which is used to create a neural network
      // basically all the manipulations will be done
      // on this, for example blueprints see:
      // test/data/ncd
      $scope.blueprint = null;
    });
}());
