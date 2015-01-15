    var myApp = angular.module("performActionModule",['hbpCommon']);
    myApp.controller('myController', ['$scope', '$timeout', function($scope, $timeout) {
        var done = function() {
            alert('done!');
        };

        $scope.doSomething = function() {
            return $timeout(done, 1000);
        };
    }]);