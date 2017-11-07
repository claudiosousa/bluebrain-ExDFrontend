'use strict';

describe('Directive: context-menu', function() {
  var $rootScope, $compile, $scope, element;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(
    inject(function(_$rootScope_, _$compile_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $scope = $rootScope.$new();
      element = $compile('<context-menu />')($scope);
      $scope.$digest();
    })
  );

  it('should replace the element with the appropriate content', function() {
    expect(element.prop('outerHTML')).toContain('<!-- context menu -->');
  });
});
