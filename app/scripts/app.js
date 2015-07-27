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

    var app = angular
        .module('exdFrontendApp', ['ngAnimate',
                                   'ngCookies',
                                   'ngResource',
                                   'ngSanitize',
                                   'ngTouch',
                                   'ui.router',
                                   'ui.bootstrap',
                                   'ui.codemirror',
                                   'angular.panels',
                                   'bbpOidcClient',
                                   'hbpCommon',
                                   'bbpConfig',
                                   'hbpDocumentClient',
                                   'gzangular',
                                   'gz3dServices',
                                   'simulationControlServices',
                                   'exdFrontendApp.Constants',
                                   'exdFrontendFilters',
                                   'nrpErrorHandlers',
                                   'nrpBackendAbout',
                                   'nrpBrowserDetection'])
        // Routes
        .config(function($stateProvider, $urlRouterProvider) {
            // Configuring routes using `angular-ui-router` states.
            // (See https://github.com/angular-ui/ui-router/wiki)
            $stateProvider.state('gz3d-view', {
                url: '/esv-web/gz3d-view/:serverID/:simulationID/:mode',
                templateUrl: 'views/esv/gz3d-view.html',
                controller: 'Gz3dViewCtrl'
            }).state('esv-web', {
              url: '/esv-web',
              templateUrl: 'views/esv/esv-web.html',
              controller: 'experimentCtrl'
            }).state('home', {
              url: '/',
              templateUrl: 'views/common/home.html'
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

  // Create the constant modules at the beginning so everyone can access it and
  // use it to define its own constants.
  angular.module('exdFrontendApp.Constants', []);

    // Since angular is a "single page" application (navigating never trigger a reload of index.html),
    // we have to notify Google Analytics when the page change. For that, we register on
    // $stateChangeSuccess which is an UI router event.
    app.run(['$rootScope', '$location', '$window', function($rootScope, $location, $window){
      $rootScope.$on('$stateChangeSuccess',
        function(event){
          if ($window.ga) {
            $window.ga('send', 'pageview', {page: $location.path()});
          }
        });
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
