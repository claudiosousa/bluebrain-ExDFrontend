  var myApp = angular.module("testModule",['hbpCommon']);
  myApp.controller('Controller', ['$scope', function($scope) {
      $scope.contentTypes = [ 'image/png', 'image/jpeg', 'application/vnd.bbp.Simulation.BlueConfig'];
  }]);