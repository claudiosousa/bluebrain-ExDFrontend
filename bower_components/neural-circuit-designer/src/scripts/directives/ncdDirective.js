(function(){
    'use strict';

    angular.module('ncdModule').directive('ncdApp', function(){
        return {
            restrict: 'E',
            templateUrl: 'main.html',
            scope: {
                blueprint: '=',
                pynnscript: '='
            },
            link: function($scope){
                $scope.tabs = {
                    alltabs: ['Raw', 'Neurons', 'Layers'],
                    current: 0
                };
            }
        };
    });
})();
