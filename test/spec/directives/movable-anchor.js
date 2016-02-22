'use strict';

describe('Directive: movable-anchor', function () {

  beforeEach(module('exdFrontendApp'));

  var $log, $document, $compile, $scope;
  var targetID = 'test_target';
  var anchorElement, anchorDOM, anchorElementScope, targetElement, htmlMock;

  var logMock = {error: jasmine.createSpy('error')};
  var startX = 110, startY = 110;
  var endX = 115, endY = 130;

  var mouseEventMock = {
    pageX: undefined,
    pageY: undefined,
    preventDefault: jasmine.createSpy('preventDefault'),
    stopPropagation: jasmine.createSpy('stopPropagation')
  };

  var touchEventMock = {
    originalEvent: {
      touches: [
        {
          pageX: undefined,
          pageY: undefined
        }
      ]
    },
    preventDefault: jasmine.createSpy('preventDefault'),
    stopPropagation: jasmine.createSpy('stopPropagation')
  };

  beforeEach(module(function ($provide) {
    $provide.value('$log', logMock);
  }));

  beforeEach(inject(function ($rootScope, _$compile_, _$log_, _$document_) {
    $scope = $rootScope.$new();

    $log = _$log_;
    $document = _$document_;
    $compile = _$compile_;

    // mocking document.getElementById()
    htmlMock = {};
    spyOn(document, 'getElementById').andCallFake(function (id) {
      if (!htmlMock[id]) {
        var newElement = document.createElement('div');
        htmlMock[id] = newElement;
      }
      return htmlMock[id];
    });

    targetElement = document.createElement('div');
    targetElement.id = targetID;
    targetElement.style.top = '10px';
    targetElement.style.left = '10px';
    targetElement.style.width = '10px';
    targetElement.style.height = '10px';
    spyOn(targetElement, 'getBoundingClientRect').andReturn(
      {
        top: parseInt(targetElement.style.top, 10),
        left: parseInt(targetElement.style.left),
        width: parseInt(targetElement.style.width),
        height: parseInt(targetElement.style.height)
      }
    );
    htmlMock[targetID] = targetElement;

    anchorElement = $compile('<div movable-anchor-for-id='+targetID+'></div>')($scope);
    $scope.$digest();
    anchorDOM = anchorElement[0];
    anchorDOM.style.top = '100px';
    anchorDOM.style.left = '100px';
    anchorDOM.style.width = '100px';
    anchorDOM.style.height = '100px';
    targetElement.appendChild(anchorDOM);

    anchorElementScope = anchorElement.isolateScope();

    spyOn(anchorElementScope, 'getEventCoordinates').andCallThrough();
    spyOn(anchorElementScope, 'onPointerDown').andCallThrough();
    spyOn(anchorElementScope, 'onPointerMove').andCallThrough();
    spyOn(anchorElementScope, 'onPointerUp').andCallThrough();
  }));

  it('should have a default sized window', function () {
    expect(window.innerWidth).toBe(400);
    expect(window.innerHeight).toBe(300);
  });

  it('should change the cursor to be the movable-cursor', function () {
    expect(anchorDOM.style.cursor).toBe('move');
    expect(anchorDOM.style.position).toBe('absolute');
  });

  it(' - getEventCoordinates() should return correct coordinates for mouse events', function () {
    mouseEventMock.pageX = 1;
    mouseEventMock.pageY = 2;

    var coordinates = anchorElementScope.getEventCoordinates(mouseEventMock);

    expect(coordinates.x).toBe(1);
    expect(coordinates.y).toBe(2);
  });

  it(' - getEventCoordinates() should return correct coordinates for touch events', function () {
    touchEventMock.originalEvent.touches[0].pageX = 3;
    touchEventMock.originalEvent.touches[0].pageY = 4;

    var coordinates = anchorElementScope.getEventCoordinates(touchEventMock);

    expect(coordinates.x).toBe(3);
    expect(coordinates.y).toBe(4);
  });

  //TODO: this seems to be a huge issue (triggering events to check that callback are called from listeners), try to solve it later
  /*it('should call onPointerDown() for "mousedown" event', function () {
    triggerMouseEvent(anchorDOM, 'mousedown');

    expect(anchorElementScope.onPointerDown).toHaveBeenCalled();
  });

  it('should NOT move the element on just mouse move', function () {
    expect(targetElement.style.top).toBe('10px');
    expect(targetElement.style.left).toBe('10px');

    triggerEvent(anchorDOM, 'mousemove');

    expect(targetElement.style.top).toBe('10px');
    expect(targetElement.style.left).toBe('10px');
  });*/

  it(' - onPointerDown() should work correctly', function () {
    spyOn($document, 'on').andCallThrough();

    mouseEventMock.pageX = startX;
    mouseEventMock.pageY = startY;

    mouseEventMock.preventDefault.reset();
    mouseEventMock.stopPropagation.reset();

    anchorElementScope.onPointerDown(mouseEventMock);

    expect(mouseEventMock.preventDefault).toHaveBeenCalled();
    expect(mouseEventMock.stopPropagation).toHaveBeenCalled();

    expect(anchorElementScope.startX).toBe(startX);
    expect(anchorElementScope.startY).toBe(startY);
    expect(anchorElementScope.targetX).toBe(10);
    expect(anchorElementScope.targetY).toBe(10);
    // event listeners should have been registered on $document
    expect($document.on).toHaveBeenCalledWith('mousemove touchmove', anchorElementScope.onPointerMove);
    expect($document.on).toHaveBeenCalledWith('mouseup touchend', anchorElementScope.onPointerUp);
  });

  it(' - onPointerMove() should move the target element', function () {
    anchorElementScope.startX = 110;
    anchorElementScope.startY = 110;
    anchorElementScope.targetX = 10;
    anchorElementScope.targetY = 10;

    mouseEventMock.pageX = endX;
    mouseEventMock.pageY = endY;

    mouseEventMock.stopPropagation.reset();

    anchorElementScope.onPointerMove(mouseEventMock);

    expect(mouseEventMock.stopPropagation).toHaveBeenCalled();

    expect(anchorElementScope.targetElement.style.left).toBe('15px');
    expect(anchorElementScope.targetElement.style.top).toBe('30px');
  });

  it('should NOT move the target element out of the window', function () {
    anchorElementScope.startX = 110;
    anchorElementScope.startY = 110;
    anchorElementScope.targetX = 10;
    anchorElementScope.targetY = 10;

    mouseEventMock.pageX = endX + 400;
    mouseEventMock.pageY = endY + 300;

    mouseEventMock.stopPropagation.reset();

    anchorElementScope.onPointerMove(mouseEventMock);

    expect(mouseEventMock.stopPropagation).toHaveBeenCalled();

    expect(anchorElementScope.targetElement.style.left).toBe('10px');
    expect(anchorElementScope.targetElement.style.top).toBe('10px');
  });

  it(' - onPointerUp() should work correctly', function () {
    spyOn($document, 'off').andCallThrough();

    mouseEventMock.stopPropagation.reset();

    anchorElementScope.onPointerUp(mouseEventMock);

    expect(mouseEventMock.stopPropagation).toHaveBeenCalled();

    expect($document.off).toHaveBeenCalledWith('mousemove touchmove', anchorElementScope.onPointerMove);
    expect($document.off).toHaveBeenCalledWith('mouseup touchend', anchorElementScope.onPointerUp);
  });

  //TODO: test touch events too

});
