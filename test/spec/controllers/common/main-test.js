'use strict';

describe('Controller: MainCtrl', function() {
  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('nrpUserMock'));

  var scope, $log, $controller;

  // Initialize the controller and a mock scope
  beforeEach(
    inject(function(_$controller_, _$window_, _$log_, $rootScope) {
      $controller = _$controller_;
      scope = $rootScope.$new();
      spyOn(scope, '$apply');
      /* global _: false */
      spyOn(_, 'defer');
      $log = _$log_;
      $controller('MainCtrl', {
        $scope: scope
      });
    })
  );

  it('should retrieve collabItemurl ', function() {
    var testUrl = scope.getCollabItemUrl('test');
    expect(testUrl).toBe('http://localhost/testUrl');
  });

  it('should not fail if "collab" config is missing', function() {
    delete window.bbpConfig.collab;
    spyOn($log, 'error');
    $controller('MainCtrl', {
      $scope: scope
    });
    expect($log.error).toHaveBeenCalled();
  });
});
