  var myApp = angular.module("testModule",['hbpCommon']);
  myApp.controller('Controller', ['$scope', function($scope) {
      $scope.file= {
          name: 'wallpaper.png',
          contentType: 'image/png'
      };
    }]);