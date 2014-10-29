(function() {
    'use strict';

    /**
     * @ngdoc overview
     * @name exDfrontendApp
     * @description
     * # exDfrontendApp
     *
     * Main module of the application.
     */
    angular
        .module('exDfrontendApp', ['ngAnimate', 'ngCookies', 'ngResource', 'ngSanitize', 'ngTouch', 'ui.router', 'ui.bootstrap', 'bbpOidcClient', 'hbpCommon', 'bbpConfig', 'hbpDocumentClient'])
        // Routes
        .config(function($stateProvider, $urlRouterProvider) {
            // Configuring routes using `angular-ui-router` states.
            // (See https://github.com/angular-ui/ui-router/wiki)
            $stateProvider.state('home', {
                url: '/',
                templateUrl: 'views/main.html',
                controller: 'mainCtrl'
            }).state('new', {
                url: '/new',
                templateUrl: 'views/new.html',
                controller: 'NewCtrl'
            });
            // Provide a default route.
            // (See https://github.com/angular-ui/ui-router/wiki/URL-Routing)
            $urlRouterProvider.otherwise('/');
        })
        // Authentication
        .config(function(bbpOidcSessionProvider) {
            // Set to true if you want to automatically prompt login
            // when user has no valid token.
            bbpOidcSessionProvider.alwaysPromptLogin(true);

            // Set to true if you want to check for the existance of
            // a token while loading.
            bbpOidcSessionProvider.ensureToken(true);
        });

    // load the configuration used by bbpConfig
    // and then bootstrap the application.
    angular.bootstrap().invoke(['$http', function($http) {
        var boot = function() {
            angular.element(document).ready(function() {
                angular.bootstrap(document, ['exDfrontendApp']);
            });
        };
        if (window.bbpConfig) {
            boot();
        } else {
            $http.get('./config.json').then(function(res) {
                window.bbpConfig = res.data;
            }).then(boot);
        }
    }]);
}());