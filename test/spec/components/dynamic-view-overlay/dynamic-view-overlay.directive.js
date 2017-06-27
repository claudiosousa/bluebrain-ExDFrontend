'use strict';

describe('Directive: dynamic-view-overlay', function() {

  var $compile, $rootScope, $timeout;
  var element, elementScope;

  beforeEach(module('dynamicViewOverlayModule'));
  beforeEach(module('exd.templates'));
  beforeEach(module('nrpAnalyticsMock'));

  beforeEach(inject(function(_$rootScope_, _$compile_, _$timeout_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $timeout = _$timeout_;
  }));

  beforeEach(function() {
    var $scope = $rootScope.$new();
    element = $compile('<dynamic-view-overlay></dynamic-view-overlay>')($scope);
    $scope.$digest();

    elementScope = element.isolateScope();
  });

  it('should have a controller defined as vm', function() {
    expect(elementScope.vm).toBeDefined();
  });

});
