/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
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
 * ---LICENSE-END **/

(function() {
    'use strict';

    angular.module('clientLoggerModule')
        .directive('logConsole', [
            '$timeout',
            'STATE',
            'stateService',
            'clientLoggerService',
            function(
                $timeout,
                STATE,
                stateService,
                clientLoggerService) {
                //auto scroll when the distance from bottom of the scrollable area <= than AUTO_SCROLL_MAX_DISTANCE
                const AUTO_SCROLL_MAX_DISTANCE = 10;
                const MAX_VISIBLE_LOGS = 100; //number of last received logs kept visible
                const LOG_LEVEL_INFO = 1;

                return {
                    templateUrl: 'components/client-logger/log-console/log-console.template.html',
                    restrict: 'E',
                    replace: true,
                    scope: {
                        toggleVisibility: '&',
                        logReceived: '&'
                    },
                    link: function(scope, element) {

                        scope.logs = [];
                        scope.STATE = STATE;
                        scope.stateService = stateService;

                        const logList = element.find('.log-list')[0];

                        let logSubscription = clientLoggerService.logs
                            .filter(log => log.level === LOG_LEVEL_INFO)
                            .map(log => log.message)
                            .subscribe(newMessageReceived);


                        function newMessageReceived(message) {
                            $timeout(() => {
                                //notify log received
                                scope.logReceived();

                                scope.logs.push({
                                    time: moment().format('HH:mm:ss'),
                                    msg: message
                                });

                                //remove extra logs
                                scope.logs.splice(0, scope.logs.length - MAX_VISIBLE_LOGS);

                                //set vertical scroll to bottom after new log current log is at the botom
                                if (logList.scrollHeight - (logList.scrollTop + logList.clientHeight) < AUTO_SCROLL_MAX_DISTANCE) {
                                    setTimeout(() => logList.scrollTop = logList.scrollHeight);
                                }
                            });
                        }

                        let unsubscribeReset = scope.$on('RESET', () => newMessageReceived('Reset EVENT occurred...'));

                        scope.$on('$destroy', function() {
                            unsubscribeReset();
                            logSubscription.unsubscribe();
                        });
                    }
                };
            }
        ]);
}());
