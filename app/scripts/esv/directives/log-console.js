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

    angular.module('exdFrontendApp')
      .directive('logConsole', [
        '$log',
        '$filter',
        '$timeout',
        'RESET_TYPE',
        'STATE',
        'roslib',
        'stateService',
        'simulationInfo',
        'bbpConfig',
        function($log,
                 $filter,
                 $timeout,
                 RESET_TYPE,
                 STATE,
                 roslib,
                 stateService,
                 simulationInfo,
                 bbpConfig) {
            //auto scroll when the distance from bottom of the scrollable area <= than AUTO_SCROLL_MAX_DISTANCE
            var AUTO_SCROLL_MAX_DISTANCE = 10;
            var MAX_VISIBLE_LOGS = 100; //number of last received logs kept visible

            return {
                templateUrl: 'views/esv/log-console.html',
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

                    var logList = element.find('.log-list')[0];

                    function newMessageReceived(message) {
                        $timeout(function() {
                            scope.logReceived();

                            scope.logs.push({
                                time: moment().format('HH:mm:ss'),
                                msg: message.data
                            });
                            scope.logs.splice(0, scope.logs.length - MAX_VISIBLE_LOGS);
                            if (logList.scrollHeight - (logList.scrollTop + logList.clientHeight) < AUTO_SCROLL_MAX_DISTANCE) {
                                $timeout(function() {
                                    logList.scrollTop = logList.scrollHeight;
                                });
                            }
                        });
                    }

                    var rosTopics = bbpConfig.get('ros-topics');
                    var rosConnection = roslib.getOrCreateConnectionTo(simulationInfo.serverConfig.rosbridge.websocket);
                    var topicSubscriber = roslib.createStringTopic(rosConnection, rosTopics.logs);
                    var topicSubscription = topicSubscriber.subscribe(newMessageReceived, true);

                    var unubscribeReset = scope.$on('RESET', function() {
                        newMessageReceived({
                            data: 'Reset EVENT occurred...'
                        });
                    });

                    scope.$on('$destroy', function() {
                        unubscribeReset();
                        topicSubscriber.unsubscribe(topicSubscription);
                    });
                }
            };
        }
    ]);
}());
