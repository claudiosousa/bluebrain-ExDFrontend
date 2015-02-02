(function() {
    'use strict';

    var module = angular.module('exdFrontendApp');

    // Splash screen

    module.factory('splash', ['$modal', '$rootScope', function($modal, $rootScope) {
        return {
            open: function (attrs, opts) {
                // Create a new scope so we can pass custom
                // variables into the splash modal
                var scope = $rootScope;
                angular.extend(scope, attrs);
                opts = angular.extend(opts || {}, {
                    backdrop: false,
                    scope: scope,
                    templateUrl: 'views/splash/content.html',
                    windowTemplateUrl: 'views/splash/index.html'
                });
                return $modal.open(opts);
            }
        };
    }]);
}());
