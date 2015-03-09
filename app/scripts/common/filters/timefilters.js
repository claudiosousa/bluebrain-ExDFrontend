(function () {
  'use strict';

  // This file contains filters to display times and dates

  var module = angular.module('exdFrontendFilters', []);

  module.filter('timeDDHHMMSS', function() {
    return function(input) {
      if (typeof input != 'number') {
        return '-- --:--:--';
      }
      var timeValue = '';
      var timeSec = input;
      var timeDay = Math.floor(timeSec / 86400);
      timeSec -= timeDay * 86400;
      var timeHour = Math.floor(timeSec / 3600);
      timeSec -= timeHour * 3600;
      var timeMin = Math.floor(timeSec / 60);
      timeSec = Math.floor(timeSec) - timeMin * 60;
      if (timeDay < 10) {
      timeValue += '0';
      }
      timeValue += timeDay.toFixed(0) + ' ';
      if (timeHour < 10) {
      timeValue += '0';
      }
      timeValue += timeHour.toFixed(0) + ':';
      if (timeMin < 10) {
      timeValue += '0';
      }
      timeValue += timeMin.toFixed(0) + ':';
      if (timeSec < 10) {
      timeValue += '0';
      }
      timeValue += timeSec.toFixed(0);

      return timeValue;
    };
  });

}());
