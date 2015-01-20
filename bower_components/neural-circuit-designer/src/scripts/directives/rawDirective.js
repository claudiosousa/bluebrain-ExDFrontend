(function(){
    'use strict';

    angular.module('ncdModule').directive('ncdRaw', function(){
        return {
            restrict: 'E',
            templateUrl: 'raw.html'
        };
    });
})();

