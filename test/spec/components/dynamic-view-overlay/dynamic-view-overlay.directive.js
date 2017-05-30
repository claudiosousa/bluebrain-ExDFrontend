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

  beforeEach(function() {
    spyOn(elementScope, 'onResizeBegin').and.callThrough();
    spyOn(elementScope, 'onResizeEnd').and.callThrough();
  });

  it('should react to resizing', function() {
    elementScope.onResizeBegin();
    expect(element.hasClass('resizing')).toBe(true);

    elementScope.onResizeEnd();
    $timeout.flush();
    expect(element.hasClass('resizing')).toBe(false);
  });

});
