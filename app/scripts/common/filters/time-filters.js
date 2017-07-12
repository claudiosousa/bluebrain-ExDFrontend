/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END**/
(function () {
  'use strict';

  // This file contains filters to display times and dates

  var module = angular.module('exdFrontendFilters', []);
  module.filter('timeDDHHMMSS', function() {
    return function(input) {
      if (typeof input !== 'number') {
        return '--\u00A0--:--:--';
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
      timeValue += timeDay.toFixed(0) + '\u00A0';
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
  })
  .filter('uptime', function() {
    return function (input) {
      if (input === undefined) {
        return 0;
      }
      var now = new Date().getTime();
      var creationDate = new Date(input).getTime();
      return (now - creationDate)/1000;
    };
  });

}());
