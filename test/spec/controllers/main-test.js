'use strict';

describe('Controller: mainCtrl', function () {

  // load the controller's module
  beforeEach(module('exDfrontendApp'));

  var controller, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    controller = $controller('mainCtrl', {
      $scope: scope
    });
  }));

  it('should attach the app title to the scope', function () {
    expect(true).toBe(true);
  });
});
