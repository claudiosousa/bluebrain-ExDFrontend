(function() {
    'use strict';


    function configureMiniBrowser(scope, rootScope, $http, bbpConfig, hbpFileStore) {
        var dialogOpen = false;
        scope.dialogOpen = dialogOpen;

        scope.selectEntity = function() {
            dialogOpen = false;
            scope.input.selectedEntity = scope.hoveredEntity;
            rootScope.$broadcast('exdConfigurationInputUriClose', scope);
        };

        scope.toggleDialog = function() {
            dialogOpen = !dialogOpen;
            if (dialogOpen) {
                rootScope.$broadcast('exdConfigurationInputUriOpen', scope);
            } else {
                rootScope.$broadcast('exdConfigurationInputUriClose', scope);
            }
        };

        scope.unselectEntity = function() {
            scope.input.selectedEntity = undefined;
        };

        scope.hovered = function(entity) {
            if (typeof entity.metadataLoaded !== 'undefined') {
                if (!entity.selectable) {
                    scope.hoveredEntity = undefined;
                    return;
                }
                else
                {
                    scope.hoveredEntity = entity;
                }
            }
        };

        scope.selectable = function(entity) {
            // Launch the loading of the metadata for the entity
            if (typeof entity.metadataLoaded === 'undefined') {
                var baseUrl = bbpConfig.get('api.document.v0');
                $http.get(baseUrl + '/file/' + entity._uuid + '/metadata').then(function(data) {
                    for (var key in data.data) {
                        entity[key] = data.data[key];
                    }
                    // If the entity has a thumbnail field, load the thumbnail url
                    if (typeof entity.thumbnail !== 'undefined') {
                        hbpFileStore.requestSignedUrl(entity.thumbnail).then(function(data) {
                            entity.thumbnailUrl = baseUrl + '/' + data.signed_url;
                        });
                    }
                });
                entity.metadataLoaded = true;
            }
            entity.selectable = true;
            // Correct way (according to many post on stackoverflow) to check if an object member is a function.
            var getType = {};
            if (scope.input.selectableExtended && getType.toString.call(scope.input.selectableExtended) === '[object Function]') {
                entity.selectable = scope.input.selectableExtended(entity);
            }
            entity.selectable = entity.selectable && (entity._contentType === scope.input.type);
            return entity.selectable; 
        };

        scope.$on('exdConfigurationInputUriOpen', function(event, sourceScope) {
            if (sourceScope.$id === scope.$id) {
                scope.dialogOpen = true;
            } else {
                scope.dialogOpen = false;
            }
        });

        scope.$on('exdConfigurationInputUriClose', function(event, sourceScope) {
            if (sourceScope.$id === scope.$id) {
                scope.dialogOpen = false;
            }
        });
    }

    angular.module('exDfrontendApp').directive('exdModelSelector', ['$http', '$q', 'hbpFileStore', 'bbpConfig', '$compile', '$rootScope',
            function($http, $q, hbpFileStore, bbpConfig, $compile, $rootScope) {
                return {
                    restrict: 'E',
                    templateUrl: 'partials/exd-input-file-button.html',
                    scope: {
                        input: '=exdInput',
                        imageDefaultThumbnail: '@exdImageDefaultThumbnail'
                    },
                    link: function($scope) {
                        configureMiniBrowser($scope, $rootScope, $http, bbpConfig, hbpFileStore);
                    }
                };
            }
        ]);
}());