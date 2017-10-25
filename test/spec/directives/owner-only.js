'use strict';

describe('Directive: owner-only', function() {
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  var isOwner = false,
    $rootScope,
    $compile;
  var userContextServiceMock = {
    isOwner: function() {
      return isOwner;
    }
  };

  beforeEach(
    module(function($provide) {
      $provide.value('userContextService', userContextServiceMock);
    })
  );

  beforeEach(
    inject(function(_$rootScope_, _$compile_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    })
  );

  var DISABLED_TOOTLTIP = 'Restricted to owner only';
  it('should set the right attributes for watchers', function() {
    var element = $compile('<div owner-only></>')($rootScope);
    $rootScope.$digest();

    expect(element.attr('title')).toBe(DISABLED_TOOTLTIP);
    expect(element.attr('disabled')).toBe('disabled');
  });

  it('should set no attributes for owners', function() {
    isOwner = true;
    var element = $compile('<div owner-only></>')($rootScope);
    $rootScope.$digest();

    expect(element.attr('title')).toBeUndefined();
    expect(element.attr('disabled')).toBeUndefined();
  });
});
