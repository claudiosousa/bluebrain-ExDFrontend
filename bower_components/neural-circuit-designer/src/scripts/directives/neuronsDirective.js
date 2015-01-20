(function(){
    'use strict';

    angular.module('ncdModule').directive('ncdNeurons', function(){
        return {
            restrict: 'E',
            templateUrl: 'neurons.html'
        };
    });
})();
