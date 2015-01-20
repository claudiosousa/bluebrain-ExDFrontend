(function(){
    'use strict';

    angular.module('ncdModule').directive('ncdLayers', function(){
        return {
            restrict: 'E',
            templateUrl: 'layers.html'
        };
    });
})();
