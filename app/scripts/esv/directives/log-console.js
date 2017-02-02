(function() {
    'use strict';

    angular.module('exdFrontendApp').directive('logConsole', ['$log', '$filter', 'roslib', '$timeout', 'RESET_TYPE', 'stateService', 'STATE',
        function($log, $filter, roslib, $timeout, RESET_TYPE, stateService, STATE) {
            //auto scroll when the distance from bottom of the scrollable area <= than AUTO_SCROLL_MAX_DISTANCE
            var AUTO_SCROLL_MAX_DISTANCE = 10;
            var MAX_VISIBLE_LOGS = 100; //number of last received logs kept visible

            return {
                templateUrl: 'views/esv/log-console.html',
                restrict: 'E',
                replace: true,
                scope: {
                    server: '@',
                    topic: '@',
                    toggleVisibility: '&',
                    logReceived: '&'
                },
                link: function(scope, element) {
                    ['server', 'topic']
                    .forEach(function(mandatoryProp) {
                        if (angular.isUndefined(scope[mandatoryProp])) {
                            $log.error('The ' + mandatoryProp + ' property was not specified!');
                        }
                    });

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

                    var rosConnection = roslib.getOrCreateConnectionTo(scope.server);
                    var topicSubscriber = roslib.createStringTopic(rosConnection, scope.topic);
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
