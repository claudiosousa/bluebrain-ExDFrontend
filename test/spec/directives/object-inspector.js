'use strict';

describe('Directive: object-inspector', function () {

  var $rootScope, $compile, $scope, $document;
  var objectInspectorElement, objectInspectorService;

  var baseEventHandlerMock = {
    suppressAnyKeyPress: jasmine.createSpy('suppressAnyKeyPress')
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module(function ($provide) {
    $provide.value('baseEventHandler', baseEventHandlerMock);
  }));

  beforeEach(inject(function (_$rootScope_,
                              _$compile_,
                              _$document_,
                              _objectInspectorService_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $document = _$document_;
    objectInspectorService = _objectInspectorService_;
    $scope = $rootScope.$new();
    objectInspectorElement = $compile('<object-inspector />')($scope);
    $scope.$digest();
  }));

  it('should produce an element that is movable and resizeable', function () {
    expect(objectInspectorElement.prop('outerHTML')).toContain('movable');
  });


  it('should hide objectInspectorService when closing', function () {
    objectInspectorService.isShown = true;
    $scope.$destroy();
    expect(objectInspectorService.isShown).toBe(false);
  });

  it('should call baseEventHandler.suppressAnyKeyPress on suppressKeyPress', function () {
    $scope.$$childTail.suppressKeyPress();
    expect(baseEventHandlerMock.suppressAnyKeyPress).toHaveBeenCalled();
  });

});
