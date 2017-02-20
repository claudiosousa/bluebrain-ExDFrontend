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