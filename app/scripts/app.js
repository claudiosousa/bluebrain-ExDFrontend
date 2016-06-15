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
    .module('exdFrontendApp', [
      'ngAnimate',
      'ngCookies',
      'ngResource',
      'n3-line-chart',
      'ngSanitize',
      'ngTouch',
      'ui.router',
      'ui.bootstrap',
      'ui.bootstrap.modal',
      'ui.codemirror',
      'angular.panels',
      'angular-toArrayFilter',
      'angulartics',
      'angulartics.google.analytics',
      'bbpOidcClient',
      'hbpCommon',
      'bbpConfig',
      'hbpDocumentClient',
      'hbpIdentity',
      'gzangular',
      'gz3dServices',
      'simulationControlServices',
      'colorableObjectModule',
      'simulationStateServices',
      'contextMenuStateService',
      'objectInspectorModule',
      'pythonCodeHelperServices',
      'simulationInfoService',
      'slurminfoService',
      'collabServices',
      'exdFrontendApp.Constants',
      'exdFrontendFilters',
      'nrpErrorHandlers',
      'nrpBackendAbout',
      'nrpAngulartics',
      'ngFileUpload',
      'nrpBrowserDetection',
      'vButton'])
    // Routes
    .config(function ($stateProvider, $urlRouterProvider) {
      // Configuring routes using `angular-ui-router` states.
      // (See https://github.com/angular-ui/ui-router/wiki)

      var homeState = {
        name: 'home',
        url: '/',
        templateUrl: 'views/common/home.html',
        controller: 'MainCtrl'
      };

      var gz3dViewState = {
        name: 'gz3d-view',
        url: '/esv-web/gz3d-view/:serverID/:simulationID/:mode?ctx',
        templateUrl: 'views/esv/gz3d-view.html',
        controller: 'Gz3dViewCtrl'
      };

      var esvWebState = {
        name: 'esv-web',
        url: '/esv-web',
        templateUrl: 'views/esv/esv-web.html',
        controller: 'experimentCtrl'
      };

      var esvCollabEditState = {
        name: 'esv-collab-edit',
        url: '/esv-collab/edit?ctx',
        templateUrl: 'views/esv/esv-collab-edit.html',
        controller: 'ESVCollabEditCtrl'
      };

      var registeredEsvCollabEditState = {
        name: 'registered-esv-collab-edit',
        url: '/esv-collab/edit?ctx/:experimentID',
        templateUrl: 'views/esv/esv-collab-run.html',
        controller: 'ESVCollabRunCtrl'
      };

      var esvCollabRunState = {
        name: 'esv-collab-run',
        url: '/esv-collab/run?ctx',
        templateUrl: 'views/esv/esv-collab-run.html',
        controller: 'ESVCollabRunCtrl'
      };

      var supportState = {
        name: 'support',
        url: '/support',
        templateUrl: 'views/common/support.html'
      };

      var newCollabOverviewState = {
        name: 'create-collab-overview',
        url: '/create-collab-overview',
        templateUrl: 'views/common/create-collab-overview.html'
      };

      var externalViewState = {
        name: 'external-view',
        url: '/external-view/:externalView',
        templateUrl: 'views/common/external-view.html',
        controller: 'externalViewCtrl'
      };

      var home = $stateProvider.state(homeState);
      home.state(esvWebState);
      home.state(esvCollabEditState);
      home.state(registeredEsvCollabEditState);
      home.state(esvCollabRunState);
      home.state(gz3dViewState);
      home.state(supportState);
      home.state(newCollabOverviewState);
      home.state(externalViewState);
      // Provide a default route.
      // (See https://github.com/angular-ui/ui-router/wiki/URL-Routing)
      $urlRouterProvider.otherwise('/');
    }).config(function (bbpOidcSessionProvider, bbpConfig) {
      // Set to true if you want to check for the existence of
      // a token while loading.
      if (!bbpConfig.get('localmode.forceuser', false)) {
        bbpOidcSessionProvider.ensureToken(true);
        localStorage.setItem('localmode.forceuser', false);
      } else {
        localStorage.setItem('localmode.forceuser', true);
      }
    });

  // load the configuration used by bbpConfig
  // and then bootstrap the application.
  angular.bootstrap().invoke(['$http', function ($http) {
    var boot = function () {

      // Google Analytics
      if (angular.isDefined(window.bbpConfig.environment)) {
        var stage = window.bbpConfig.environment;
        if (stage === "development") {
          /* global ga: false */
          ga('create', 'UA-62512653-1', 'auto');
        }
        else if (stage === "staging") {
          /* global ga: false */
          ga('create', 'UA-62512653-2', 'auto');
        }
        else if (stage === "production") {
          /* global ga: false */
          ga('create', 'UA-62512653-3', 'auto');
        }
      }

      angular.element(document).ready(function () {
        angular.bootstrap(document, ['exdFrontendApp']);
      });
    };

    if (window.bbpConfig) {
      boot();
    } else {
      $http.get('./config.json').then(function (res) {
        window.bbpConfig = res.data;
      }).then(boot);
    }
  }]);

  // Create the constant modules at the beginning so everyone can access it and
  // use it to define its own constants.
  angular.module('exdFrontendApp.Constants', []);

}());

// These are the two functions of JQuery mobile used by GZWeb. We deliberately
// chose to redeclare them as empty and not to include JQuery mobile. The
// reason is that JQuery mobile along with angular and the bootstrap based hbp template
// result in quite a layout mess. JQuery "improves" the layout by adding some divs and
// some css styles that try to make the page full screen but rather fail at this job in
// our case.

/* global $: false */
$.fn.buttonMarkup = function () {
};
$.fn.popup = function () {
};
$.fn.checkboxradio = function () {
};
$.fn.touchstart = function () {
};
$.fn.touchend = function () {
};
