'use strict';

describe('Directive: context-menu', function () {

  var $rootScope, element;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(inject(function (
    _$rootScope_,
    $compile) {
    $rootScope = _$rootScope_;
    $rootScope.htmlProp = '<span>1+1={{1+1}}</span>';
    element = $compile('<div bind-html-and-compile="htmlProp"/>')($rootScope);
    $rootScope.$digest();
  }));

  it('should bind the compiled template', function () {
    expect(element.prop('outerHTML')).toContain('1+1=2');
  });

});
