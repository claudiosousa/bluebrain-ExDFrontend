'use strict';

describe('Directive: Movable', function () {

  beforeEach(module('exdFrontendApp'));

  var element,
    $scope,
    $document,
    $rootScope,
    $compile;

  var logMock = {error: jasmine.createSpy('error')};
  var startX = 110;
  var startY = 110;

  beforeEach(module(function ($provide) {
    $provide.value('$log', logMock);
  }));


  function createMovableElement(useAnchor) {
    $scope = $rootScope.$new();
    element = $compile('<div movable ' + (useAnchor ? 'movable-anchor="*"' : '') + '><div></div></div>')($scope);
    $scope.$digest();
    element.css({
      top:    '100px',
      left:   '100px',
      width:  '100px',
      height: '100px'
    });
  }

  beforeEach(inject(function (_$rootScope_, _$compile_, _$document_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $document = _$document_;

    createMovableElement();
  }));

  it('should change the cursor to be the movable-cursor', function () {
    expect(element.css('cursor')).toBe('move');
    expect(element.css('position')).toBe('absolute');
  });

  it('should NOT move the element on just mouse move', function () {
    spyOn(element, 'css');
    element.triggerHandler({type: 'mousemove', pageX: 110, pageY: 110});
    expect(element.css).not.toHaveBeenCalled();
  });

  it('should move the element on mouse move', function () {
    var endX = 115;
    var endY = 130;
    var originalTop = element.offset().top;
    var originalLeft = element.offset().left;
    element.triggerHandler({type: 'mousedown', pageX: startX, pageY: startY});
    $scope.$digest();
    $document.triggerHandler({type: 'mousemove', pageX: endX, pageY: endY});
    $scope.$digest();
    expect(element.css('top')).toBe(originalTop + (endY - startY) + 'px');
    expect(element.css('left')).toBe(originalLeft + (endX - startX) + 'px');

    $document.triggerHandler({type: 'mouseup', pageX: endX, pageY: endY});

    // Should not trigger any more
    $document.triggerHandler({type: 'mousemove', pageX: 120, pageY: 140});
    $scope.$digest();
    // should still be the same as above
    expect(element.css('top')).toBe(originalTop + (endY - startY) + 'px');
    expect(element.css('left')).toBe(originalLeft + (endX - startX) + 'px');
  });

  it('should move the element out of the window', function () {
    var endX = 100;
    var endY = 100;
    var originalTop = element.offset().top;
    var originalLeft = element.offset().left;
    element.triggerHandler({ type: 'mousedown', pageX: startX, pageY: startY });
    $scope.$digest();
    $document.triggerHandler({ type: 'mousemove', pageX: endX, pageY: endY });
    $scope.$digest();
    expect(element.css('top')).toBe(originalTop + endX - startX + 'px');
    expect(element.css('left')).toBe(originalLeft + endY - startY + 'px');

    $document.triggerHandler({ type: 'mouseup', pageX: endX, pageY: endY });
  });

  it('should move the element with a touch gesture', function () {
    var endX = 115;
    var endY = 130;
    var originalTop = element.offset().top;
    var originalLeft = element.offset().left;
    element.triggerHandler({type: 'touchstart', originalEvent : {
      touches : [ { pageX : startX, pageY: startY } ]
    }});
    $scope.$digest();
    $document.triggerHandler({type: 'touchmove', originalEvent : {
      touches : [ { pageX : endX, pageY: endY } ]
    }});
    $scope.$digest();
    expect(element.css('top')).toBe(originalTop + (endY - startY) + 'px');
    expect(element.css('left')).toBe(originalLeft + (endX - startX) + 'px');

    $document.triggerHandler({type: 'touchend', originalEvent : {
      touches : [ { pageX : endX, pageY: endY } ]
    }});

    // Should not trigger any more
    $document.triggerHandler({type: 'touchmove', originalEvent : {
      touches : [ { pageX : 120, pageY: 140 } ]
    }});
    $scope.$digest();
    // should still be the same as above
    expect(element.css('top')).toBe(originalTop + (endY - startY) + 'px');
    expect(element.css('left')).toBe(originalLeft + (endX - startX) + 'px');
  });

  it('should move element using movable anchor', function () {
    createMovableElement(true);
    var delta = 112;

    var originalTop = element.offset().top;
    var originalLeft = element.offset().left;
    var child = element.children().first();

    child.triggerHandler({ type: 'mousedown', pageX: 0, pageY: 0 });
    $scope.$digest();
    $document.triggerHandler({ type: 'mousemove', pageX: delta, pageY: delta });
    $scope.$digest();
    expect(element.css('top')).toBe(originalTop + delta + 'px');
    expect(element.css('left')).toBe(originalLeft + delta + 'px');
  });

  it('should NOT move element using outside movable anchor', function () {
    createMovableElement(true);

    var originalTop = element.css('top');
    var originalLeft = element.css('left');
    element.triggerHandler({ type: 'mousedown', pageX: 0, pageY: 0 });
    $scope.$digest();
    $document.triggerHandler({ type: 'mousemove', pageX: 10, pageY: 10 });
    expect(element.css('top')).toBe(originalTop);
    expect(element.css('left')).toBe(originalLeft);
  });
});
