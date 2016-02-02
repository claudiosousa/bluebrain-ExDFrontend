'use strict';

describe('Directive: interactive', function () {

  var $rootScope, $compile, $scope, $document;
  var inputElement;

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
    inputElement = $compile('<input interactive type="text"/>')($scope)[0];
    $scope.$digest();
  }));

  it('should produce an element that stops propagation of pointer events', function () {
    var eventMouseDown = triggerPointerEvent(inputElement, 'mousedown');
    expect(eventMouseDown.stopPropagation).toHaveBeenCalled();
    var eventTouchStart = triggerPointerEvent(inputElement, 'touchstart');
    expect(eventTouchStart.stopPropagation).toHaveBeenCalled();
    var eventMouseMove = triggerPointerEvent(inputElement, 'mousemove');
    expect(eventMouseMove.stopPropagation).toHaveBeenCalled();
    var eventTouchMove = triggerPointerEvent(inputElement, 'touchmove');
    expect(eventTouchMove.stopPropagation).toHaveBeenCalled();
    var eventMouseUp = triggerPointerEvent(inputElement, 'mouseup');
    expect(eventMouseUp.stopPropagation).toHaveBeenCalled();
    var eventTouchEnd = triggerPointerEvent(inputElement, 'touchend');
    expect(eventTouchEnd.stopPropagation).toHaveBeenCalled();
  });

});
