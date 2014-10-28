(function() {
  'use strict';

  // Load a dummy environment configuration to be loaded by bbpConfig.
  window.bbpConfig = {
    api: {
      document: {
        v0: 'https://services-dev.humanbrainproject.eu/document/v0/api'
      },
      user: {
        v0: 'https://services-dev.humanbrainproject.eu/oidc/v0/api'
      }
    },
    auth: {
      url: 'https://services-dev.humanbrainproject.eu/oidc',
      clientId: 'portal-client'
    }
  };

  var myApp = angular.module('myApp', ['hbpDocumentClient', 'bbpOidcClient']);

  // Ensure user is authenticated
  myApp.config(function(bbpOidcSessionProvider) {
    bbpOidcSessionProvider.ensureToken(true);
  });

  // A controller that list all projects
  myApp.controller('projectListCtrl', function($scope, $log, hbpProjectStore) {
    $scope.projects = [];
    hbpProjectStore.getAll().then(
      function(projects) {
        $log.log(projects);
        $scope.projects.push.apply($scope.projects, projects);
      },
      function(response) {
        $log.error(
          'Cannot get projects',
          response.status,
          response.data.code,
          response.data.reason
        );
      }
    );
  });
}());
