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

  //auto scroll when the distance from bottom of the scrollable area <= than AUTO_SCROLL_MAX_DISTANCE
  const AUTO_SCROLL_MAX_DISTANCE = 10;
  const MAX_VISIBLE_LOGS = 100; //number of last received logs kept visible

  class LogConsoleController
  {

    constructor($scope, $timeout, $element, stateService, clientLoggerService, STATE,
                LOG_TYPE) {
      this.logs = [];
      this.stateService = stateService;

      this.STATE = STATE;

      // notify toolbar to reset the displayed log counter
      const history = clientLoggerService.getLogHistory;
      clientLoggerService.resetLoggedMessages();
      for(let index in history)
      {
        if(history.hasOwnProperty(index)) {
          if (history[index].level === LOG_TYPE.INFO) {
            this.logs.push({
              time: history[index].time,
              msg: history[index].message
            });
          }
        }
      }

      const logList = $element.find('.log-list')[0];

      let logSubscription = clientLoggerService.logs.filter(log => log.level === LOG_TYPE.INFO).
          map(log => log.message).
          subscribe(m => this.newMessageReceived(m));

      const that = this;

      this.newMessageReceived = function(message) {
        $timeout(() => {
            that.logs.push({
            time: moment().format('HH:mm:ss'),
            msg: message
          });

          //remove extra logs
          that.logs.splice(0, that.logs.length - MAX_VISIBLE_LOGS);

          //set vertical scroll to bottom after new log current log is at the bottom
          if (logList.scrollHeight - (logList.scrollTop + logList.clientHeight) < AUTO_SCROLL_MAX_DISTANCE) {
            setTimeout(() => logList.scrollTop = logList.scrollHeight);
          }
        });
      };


      $scope.$on('$destroy', function() {
        logSubscription.unsubscribe();
      });
    }
  }

  angular.module('clientLoggerModule').controller('LogConsoleController', [
    '$scope',
    '$timeout',
    '$element',
    'stateService',
    'clientLoggerService',
    'STATE',
    'LOG_TYPE',
    (...args) => new LogConsoleController(...args)
  ]);
})();
