    var myApp = angular.module("dateFormatModule",['hbpCommon']);
    myApp.controller('DateController', ['$scope', function($scope) {
        $scope.now = new Date();
      }]);