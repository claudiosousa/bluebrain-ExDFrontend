(function () {
  'use strict';

  // This file contains filters used to display formatted string list
  var module = angular.module('exdFrontendFilters');
  module.filter('joinWithEndException', function() {
    return function(input, separator, exceptionalSeparator) {
        var l = input.length;
        if (l < 2) {
          return input[0];
        } 

        if (separator === undefined) {
          separator = ', ';
        }

        if (exceptionalSeparator === undefined) {
          return input.join(separator);
        } 
         
        var result = '';
        for (var i = 0; i < l - 2; i += 1) {
           result += input[i] + separator;
        }
        result += input[l - 2] + exceptionalSeparator + input[l - 1];
        return result;
    };
  });
})();
