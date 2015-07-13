'use strict';

describe('Directive: Movable', function () {

  beforeEach(module('exdFrontendApp'));

  var element;
  var $log;
  var $scope;
  var $document;

  var logMock = {error: jasmine.createSpy('error')};
  var startX = 110;
  var startY = 110;

  beforeEach(module(function ($provide) {
    $provide.value('$log', logMock);
  }));

  beforeEach(inject(function ($rootScope, $compile, _$log_, _$document_) {
    $scope = $rootScope.$new();
    element = $compile('<div movable></div>')($scope);
    $log = _$log_;
    $document = _$document_;
    element.css({
      top:    '100px',
      left:   '100px',
      width:  '100px',
      height: '100px'
    });
    $scope.$digest();
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

  it('should NOT move the element out of the window', function () {
    var endX = 100;
    var endY = 100;
    var originalTop = element.css('top');
    var originalLeft = element.css('left');
    element.triggerHandler({type: 'mousedown', pageX: startX, pageY: startY});
    $scope.$digest();
    $document.triggerHandler({type: 'mousemove', pageX: endX, pageY: endY});
    $scope.$digest();
    expect(element.css('top')).toBe(originalTop);
    expect(element.css('left')).toBe(originalLeft);

    $document.triggerHandler({type: 'mouseup', pageX: endX, pageY: endY});
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

});
