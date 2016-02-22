'use strict';

describe('Directive: object-inspector', function () {

  var $rootScope, $compile, $scope, $document;
  var objectInspectorElement;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(inject(function (_$rootScope_,
                              _$compile_,
                              _$document_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $document = _$document_;
    $scope = $rootScope.$new();
    objectInspectorElement = $compile('<object-inspector />')($scope);
    $scope.$digest();
  }));

  it('should produce an element that is movable and resizeable', function () {
    expect(objectInspectorElement.prop('outerHTML')).toContain('movable');
    expect(objectInspectorElement.prop('outerHTML')).toContain('resizeable');
  });

});
