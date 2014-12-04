(function(){
    // This file is taken from the platform team, it should not be edited
    // we consider all directives to be tested.

    // We should ask them to include those directives in the common package
    // together with a small documentation
    'use strict';

    var module = angular.module('exdFrontendApp')
        .directive('bbpConfigurationInput', ['$compile', '$parse', function($compile, $parse) {
            return {
                restrict: 'E',
                //terminal: true,
                //priority: 1000,
                link: {
                    pre: function(scope, element,attrs, ngModel) {
                        element.html('<bbp-configuration-input-'+scope.input.type+'></bbp-configuration-input-'+scope.input.type+'>');
                    },
                    post: function(scope, element,attrs, ngModel) {
                        $compile(element.contents())(scope);
                        element.replaceWith(element.children());
                    }
                },
                scope: {
                    input:  '=bbpInput',
                }

            };
        }])
        .directive('bbpConfigurationInputDefault', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/task-input/default.html',
                restrict: 'E'
            };
        }])
        .directive('bbpConfigurationInputInteger', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/task-input/integer.html',
                restrict: 'E'
            };
        }])
        .directive('bbpConfigurationInputDouble', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/task-input/double.html',
                restrict: 'E'
            };
        }])
        .directive('bbpConfigurationInputBoolean', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/task-input/boolean.html',
                restrict: 'E'
            };
        }])
        .directive('bbpConfigurationInputString', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/task-input/string.html',
                restrict: 'E'
            };
        }])
        .directive('bbpConfigurationInputEnum', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/task-input/enum.html',
                restrict: 'E'
            };
        }])
        .directive('bbpConfigurationInputList', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/task-input/list.html',
                restrict: 'E',
                link: function($scope) {
                    var counter = 0;
                    if($scope.input.value === undefined) {
                        $scope.input.value = [];
                    } else {
                        // it's okay to use ++ in a for loop like this
                        for(var i = 0; i < $scope.input.value.length; i++) {// jshint ignore: line
                            $scope.input.value[i].source.type.object = $scope.input.source.type.contents.subtype.object;
                        }
                    }

                    $scope.addItem = function(event) {
                        event.preventDefault();
                        $scope.input.value.push({
                            id: counter,
                            type: $scope.input.subtype,
                            source: {
                                type: {
                                    object: $scope.input.source.type.contents.subtype.object
                                }
                            }
                        });
                        counter += 1;
                    };

                    $scope.removeItem = function(event, index) {
                        event.preventDefault();
                        $scope.input.value.splice(index,1);
                    };
                }
            };
        }])
        .directive('bbpConfigurationInputDate', ['$compile', function($compile) {
            return {
                templateUrl: 'partials/task-input/date.html',
                restrict: 'E',
                link: function(scope, elm, attrs, ngModel) {

                    scope.date = {};

                    var parseDate = function (date) {
                        var base = date.split('T');
                        scope.date.date = base[0];
                        if (base.length > 1) {
                            var time = base[1].split(':');

                            if (time.length > 2) {
                                scope.date.hours = time[0];
                                scope.date.minutes = time[1];
                                scope.date.seconds = time[2];
                            }
                        }
                    };

                    var formateDate = function (date) {
                        scope.input.value = date.date + 'T' + date.hours + ':' + date.minutes + ':' + date.seconds;
                    };

                    scope.$watch('date', function(newValue, oldValue){
                        formateDate(newValue);
                    }, true);

                    parseDate(scope.input.value);
                }
            };
        }]);

    // scope for the directive based on the mini-browser
    (function() {
        /**
         * Helper function to set the
         * common behaviors for the minibrowser
         * on the various field which need it.
         */
        function configureMiniBrowser(scope, rootScope) {
            var dialogOpen = false;
            scope.dialogOpen = dialogOpen;

            scope.selectEntity = function (entity) {
                scope.input.entity = entity;
                dialogOpen = false;
                rootScope.$broadcast('bbpConfigurationInputUriClose', scope);
            };

            scope.toggleDialog = function() {
                dialogOpen = !dialogOpen;
                if(dialogOpen) {
                    rootScope.$broadcast('bbpConfigurationInputUriOpen', scope);
                } else {
                    rootScope.$broadcast('bbpConfigurationInputUriClose', scope);
                }
            };

            scope.openDialog = function() {
                dialogOpen = true;
                rootScope.$broadcast('bbpConfigurationInputUriOpen', scope);
            };

            scope.$on('bbpConfigurationInputUriOpen', function(event, sourceScope) {
                if(sourceScope.$id === scope.$id) {
                    scope.dialogOpen = true;
                } else {
                    scope.dialogOpen = false;
                }
            });

            scope.$on('bbpConfigurationInputUriClose', function(event, sourceScope) {
                if(sourceScope.$id === scope.$id) {
                    scope.dialogOpen = false;
                }
            });
        }

        /**
         * bbpConfigurationInputUri let you select a File.
         */
        module.directive('bbpConfigurationInputUri', ['$compile', '$rootScope', function($compile, $rootScope) {
            return {
                templateUrl: 'partials/task-input/uri.html',
                restrict: 'E',
                link: function ($scope, attr, element) {
                    configureMiniBrowser($scope, $rootScope);
                    $scope.selectable = function(entity) {
                        return entity._contentType === $scope.input.contentType;
                    };
                }
            };
        }])
        /**
         * This directive let you choose a project
         */
        .directive('bbpConfigurationInputDestination', ['$compile', '$rootScope', function($compile, $rootScope) {
            return {
                templateUrl: 'partials/task-input/uri.html',
                restrict: 'E',
                link: function ($scope) {
                    configureMiniBrowser($scope, $rootScope);
                    var writableContainer = function(entity) {
                        if (entity._entityType === 'project') {
                            return entity.canWrite;
                        } else if (entity._entityType === 'folder') {
                            // Seeing a folder means that we selected
                            // a writable project.
                            return true;
                        }
                        return false;
                    };
                    $scope.selectable = writableContainer;
                    $scope.browsable = writableContainer;
                }
            };
        }]);
    }());
}());
