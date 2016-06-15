'use strict';

describe('Controller: externalViewCtrl', function () {

  beforeEach(module('exdFrontendApp'));

  var scope, sce;

  beforeEach(inject(function ($controller, $rootScope, $stateParams, $sce) {
    sce = $sce;
    $stateParams.externalView = 'testkey';
    scope = $rootScope.$new();

    window.bbpConfig.collab = {
      externalViews: {
        'testkey': 'testurl'
      }
    };

    $controller('externalViewCtrl', {
      $scope: scope
    });
  }));

  it('should map using \'externalViews\' config', function () {
    expect(sce.getTrustedResourceUrl(scope.srcUrl)).toBe('testurl');
  });
});
