(function() {
    'use strict';

    /**
     * @ngdoc overview
     * @name exdFrontendApp
     * @description
     * # exdFrontendApp
     *
     * Main module of the application.
     */

    angular
        .module('exdFrontendApp', ['ngAnimate', 'ngCookies', 'ngResource', 'ngSanitize', 'ngTouch', 'ui.router', 'ui.bootstrap', 'bbpOidcClient', 'hbpCommon', 'bbpConfig', 'hbpDocumentClient', 'gzangular'])
        // Routes
        .config(function($stateProvider, $urlRouterProvider) {
            // Configuring routes using `angular-ui-router` states.
            // (See https://github.com/angular-ui/ui-router/wiki)
            $stateProvider.state('home', {
                url: '/',
                templateUrl: 'views/common/main.html',
                controller: 'mainCtrl'
            }).state('new', {
                url: '/new',
                templateUrl: 'views/exd/new.html',
                controller: 'NewCtrl'
            }).state('gz3d-view', {
                url: '/gz3d-view',
                templateUrl: 'views/esv/gz3d-view.html',
                controller: 'Gz3dViewCtrl'
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
                angular.bootstrap(document, ['exdFrontendApp']);
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

// These are the two functions of JQuery mobile used by GZWeb. We deliberately
// chose to redeclare them as empty and not to include JQuery mobile. The
// reason is that JQuery mobile along with angular and the bootstrap based hbp template
// result in quite a layout mess. JQuery "improves" the layout by adding some divs and
// some css styles that try to make the page full screen but rather fail at this job in
// our case.

/* global $: false */
$.fn.buttonMarkup = function(){};
$.fn.popup = function(){};
$.fn.checkboxradio = function(){};
$.fn.touchstart = function(){};
$.fn.touchend = function(){};
