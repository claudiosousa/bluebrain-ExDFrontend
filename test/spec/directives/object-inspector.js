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

describe('Directive: transform-input-num', function () {

  var $rootScope, $compile, $scope, $document;
  var transformInputNumElement;

  var triggerPointerEvent = function (element, eventType) {
    var clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent(eventType, true, true);
    clickEvent.stopPropagation = jasmine.createSpy('stopPropagation');
    element.dispatchEvent(clickEvent);

    return clickEvent;
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(inject(function (_$rootScope_,
                              _$compile_,
                              _$document_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $document = _$document_;
    $scope = $rootScope.$new();
    transformInputNumElement = $compile('<input transform-input-num type="number"/>')($scope)[0];
    $scope.$digest();
  }));

  it('should produce an element that stops propagation of pointer events', function () {
    var eventMouseDown = triggerPointerEvent(transformInputNumElement, 'mousedown');
    expect(eventMouseDown.stopPropagation).toHaveBeenCalled();
    var eventTouchStart = triggerPointerEvent(transformInputNumElement, 'touchstart');
    expect(eventTouchStart.stopPropagation).toHaveBeenCalled();
    var eventMouseMove = triggerPointerEvent(transformInputNumElement, 'mousemove');
    expect(eventMouseMove.stopPropagation).toHaveBeenCalled();
    var eventTouchMove = triggerPointerEvent(transformInputNumElement, 'touchmove');
    expect(eventTouchMove.stopPropagation).toHaveBeenCalled();
    var eventMouseUp = triggerPointerEvent(transformInputNumElement, 'mouseup');
    expect(eventMouseUp.stopPropagation).toHaveBeenCalled();
    var eventTouchEnd = triggerPointerEvent(transformInputNumElement, 'touchend');
    expect(eventTouchEnd.stopPropagation).toHaveBeenCalled();
  });

});
