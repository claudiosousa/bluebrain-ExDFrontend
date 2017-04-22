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
        .constant('RECONNECTING_TIMEOUT_MS', 3000)
        .directive('rosReconnecting', ['$timeout', 'hbpDialogFactory', 'RECONNECTING_TIMEOUT_MS',
            function($timeout, hbpDialogFactory, RECONNECTING_TIMEOUT_MS) {
                return {
                    restrict: 'C',
                    template: '<div class="ros-reconnecting-badge">' +
                    '<div class="ros-reconnecting-message">Reconnecting to ROS sockets...</div>' +
                    '<i class="fa fa-spinner fa-spin"></i></div>',
                    scope: {
                        onTimeout: "&onReconnectTimeout"
                    },
                    link: function(scope, element) {

                        var reconnectingTimer, unsubscribe;

                        function reconnectingTimeout() {
                            $timeout.cancel(reconnectingTimer);
                            unsubscribe();
                            element.hide();
                            hbpDialogFactory.alert({
                                title: 'Failed to reconnect to the server',
                                template: 'Could not reconnect to the server. Leaving the simulation now.'
                            }).then(function(){
                                scope.onTimeout && scope.onTimeout();
                            });
                        }

                        function reconnecting(establishing) {
                            $timeout.cancel(reconnectingTimer);
                            if (establishing) {
                                reconnectingTimer = $timeout(reconnectingTimeout, RECONNECTING_TIMEOUT_MS);
                                element.show();
                            } else {
                                element.hide();
                            }
                        }

                        unsubscribe = window.ROSLIB.PhoenixRos.onReconnecting(reconnecting);

                        scope.$on('$destroy', function() {
                            unsubscribe();
                        });
                    }
                };
            }
        ]);
}());