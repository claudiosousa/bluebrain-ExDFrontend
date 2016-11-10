'use strict';

describe('Directive: transferFunctionEditorButtons', function () {

  var $rootScope, $compile;
  var TEMPLATE_HTML = '<transfer-function-editor-buttons></<transfer-function-editor-buttons>';

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(inject(function (_$rootScope_, _$compile_, $httpBackend) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $rootScope.create = jasmine.createSpy('create');
    $httpBackend.whenGET(/.*/).respond(200);
  }));

  it('should create TFs at the beginning by default', function () {
    var renderContainer = $compile(TEMPLATE_HTML)($rootScope);
    $rootScope.$digest();
    renderContainer.find('button').first().click();
    expect($rootScope.create).toHaveBeenCalled();
    expect($rootScope.create.mostRecentCall.args[0]).toBeFalsy();
  });

  it('should be able to create TFs at the end', function () {
    var renderContainer = $compile(angular.element(TEMPLATE_HTML).attr('append-at-end', 'true'))($rootScope);
    $rootScope.$digest();
    renderContainer.find('button').first().click();
    expect($rootScope.create).toHaveBeenCalled();
    expect($rootScope.create.mostRecentCall.args[0]).toBeTruthy();
  });
});
