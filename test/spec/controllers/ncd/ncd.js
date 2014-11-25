'use strict';

describe('Controller: NcdCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var NcdCtrl,
      scope,
      state;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope, _$state_) {
      scope = $rootScope.$new();
      state = _$state_;
      NcdCtrl = $controller('NcdCtrl', {
          $scope: scope
      });
  }));

  it('should attach $state to the scope for the navbar', function() {
      expect(scope.$state).toBe(state);
  });

  it('should have the blueprint attribute for storing a blueprint', function(){
    expect(scope.blueprint).toBeDefined();
  });
});
