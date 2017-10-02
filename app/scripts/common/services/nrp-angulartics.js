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
(function() {
  'use strict';
  /* global console: false */
  /* global moment: false */
  var module = angular.module('nrpAngulartics', [
    'nrpUser',
    'angulartics',
    'angulartics.google.analytics']);

  module.factory('nrpAnalytics', [
    '$analytics',
    '$log',
    'nrpUser',
    function($analytics, $log, nrpUser) {
      var durationClocks = {};

      function eventTrack (actionName, options) {
        if (_.isObject(options) && _.isBoolean(options.value)) {
          options.value = _.toInteger(options.value);
        }
        return nrpUser.getCurrentUser().then(function(user) {
          var extendedOptions = _.extend(options, {
            label: user.displayName
          });
          $analytics.eventTrack(actionName, extendedOptions);
        });
      }

      function tickDurationEvent (actionName) {
        durationClocks[actionName] = moment();
      }
      function durationEventTrack (actionName, options) {
        if (_.isUndefined(durationClocks[actionName])) {
          $log.debug('Analytics duration: missing tick for action: '+ actionName);
          return;
        }
        var duration = moment() - durationClocks[actionName];
        var extendedOptions = _.extend(options, {
          value: duration / 1000
        });
        eventTrack(actionName, extendedOptions);
        delete durationClocks[actionName];
      }

      return {
        eventTrack: eventTrack,
        tickDurationEvent: tickDurationEvent,
        durationEventTrack: durationEventTrack
      };
    }]);
}());
