
(function() {
    'use strict';
    angular.module('exdFrontendApp')
        .directive('simulationTimeoutExtender', ['hbpDialogFactory', 'backendInterfaceService',
            function(hbpDialogFactory, backendInterfaceService) {
                return {
                    restrict: 'E',
                    scope: {
                        extentTimeoutCondition: '@'
                    },
                    link: function(scope, element, attrs) {
                        if (!attrs.extentTimeoutCondition)
                            throw 'Directive \'simulation-timeout-extender\' requires \'extentTimeoutCondition\' attribute to be defined';

                        var timeoutExtendRefused = false,
                            popupIsOpen = false;

                        scope.$watch(function() {
                            return scope.$eval(attrs.extentTimeoutCondition);
                        }, function(extend) {
                            if (extend && !timeoutExtendRefused && !popupIsOpen) {
                                popupIsOpen = true;
                                return hbpDialogFactory.confirm({
                                    title: 'Your simulation will soon reach it\'s timeout.',
                                    confirmLabel: 'Yes',
                                    cancelLabel: 'No',
                                    template: 'Would you like to extend the simulation timeout?',
                                    closable: false
                                }).then(function() {

                                    return backendInterfaceService
                                        .extendTimeout()
                                        .catch(function(err) {
                                            timeoutExtendRefused = true;

                                            if (err && err.status === 402) {
                                                hbpDialogFactory.alert({
                                                    title: 'Error.',
                                                    template: 'Your cluster job allocation cannot be extended further'
                                                });
                                            }
                                        });
                                }).catch(function() { timeoutExtendRefused = true; })
                                    .finally(function(){ popupIsOpen = false;} );
                            }
                        });
                    }
                };
            }
        ]);
} ());
