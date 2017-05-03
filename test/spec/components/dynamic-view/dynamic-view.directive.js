'use strict';

describe('Directive: dynamic-view', function() {

  var $compile, $rootScope;
  var element, elementScope;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(inject(function(_$rootScope_, _$compile_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
  }));

  beforeEach(function() {
    var $scope = $rootScope.$new();
    element = $compile('<dynamic-view></dynamic-view>')($scope);
    $scope.$digest();

    elementScope = element.isolateScope();
  });

  beforeEach(function() {
    spyOn(elementScope, 'setViewContent').and.callThrough();
    spyOn(elementScope, 'setViewContentViaDirective').and.callThrough();
  });

  it('should always have a view container element defined', function() {
    expect(elementScope.viewContainer).toBeDefined();
  });

  it('should allow the definition of default content (a directive) via an attribute', function() {
    var $scope = $rootScope.$new();
    element = $compile('<dynamic-view dynamic-view-default-directive="my-directive"></dynamic-view>')($scope);
    $scope.$digest();

    elementScope = element.isolateScope();

    expect(elementScope.viewContainer.innerHTML).toContain('my-directive');
    expect(elementScope.viewContent).toBe('<my-directive></my-directive>');
  });

  it('should allow to set a directive as content (directive is compiled)', function() {
    var directiveName = 'my-directive';

    elementScope.setViewContentViaDirective(directiveName);

    expect(elementScope.viewContent).toContain(directiveName);
    expect(elementScope.viewContainer.innerHTML).toContain(directiveName);
  });

  it('should allow to set arbitrary content', function() {
    var content = 'some_test_content';

    elementScope.setViewContent(content);

    expect(elementScope.viewContent).toBe(content);
    expect(elementScope.viewContainer.innerHTML).toContain(content);
  });

});
