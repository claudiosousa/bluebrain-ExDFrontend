
'use strict';

describe('Directive: environment-rendering', function () {

  var element;

  var $compile,
    $rootScope;

  beforeEach(module('environmentRenderingModule'));

  beforeEach(function () {
    // inject service for testing.
    inject(function (_$compile_,
                     _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    });
  });

  beforeEach(function () {
    element = $compile('<environment-rendering></environment-rendering>')($rootScope);
  });

  it(' - compile element', function () {
    expect(element).toBeDefined();
  });

});
