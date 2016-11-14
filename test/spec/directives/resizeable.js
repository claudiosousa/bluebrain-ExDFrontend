'use strict';

describe('Directive: resizeable', function () {

  var scope, compile, element, document, window, resizeDiv;
  var mockedMouseDownEventStopPropagation;
  var startHeight, startWidth;

  // Note that we set those two values to '0'. This is mainly due to the problem that phantomjs
  // does not eat these values for 'top' and 'left' in the CSS – they are always set to '0'.
  // So in principal this test should also work with non zero values, but due to phantomjs it does not.
  var elementToResize = {top: 0, left: 0, initialWidth: 100, initialHeight: 45};

  beforeEach(module('exdFrontendApp'));
  beforeEach(inject(function ($rootScope, $compile, $document, $window) {
    scope = $rootScope.$new();
    compile = $compile;
    document = $document;
    window = $window;
    startHeight = window.innerHeight;
    startWidth = window.innerWidth;
    scope.onResizeEnd = jasmine.createSpy('onResizeEnd');
    mockedMouseDownEventStopPropagation = jasmine.createSpy('stopPropagation');
  }));

  describe('Resizing divs with the aspect ratio not taken into consideration', function () {

    beforeEach(function () {
      element = compile('<div resizeable></div>')(scope);
      resizeDiv = angular.element(element.children()[0]);
    });

    it('should replace the element with the appropriate content', function () {
      // Compile a piece of HTML containing the directive
      expect(element.prop('outerHTML')).toContain('<div resizeable="" class="ng-scope"><div class="resizeable"></div></div>');
    });

    it('should check for the default window height and width', function () {
      // Default height and width
      expect(window.innerHeight).toBe(startHeight);
      expect(window.innerWidth).toBe(startWidth);
    });

    it('should call the onResizeEnd method', function () {
      resizeElement(elementToResize, {dx: randomInt(1, 10), dy: randomInt(1, 10)});
      expect(scope.onResizeEnd).toHaveBeenCalled();
    });

    it('should stop event propagation on the mousedown event', function () {
      resizeElement(elementToResize, {dx: randomInt(1, 10), dy: randomInt(1, 10)});
      expect(mockedMouseDownEventStopPropagation).toHaveBeenCalled();
    });

    it('should handle the resize correctly', function () {
      var resizeAction = resizeElement(elementToResize, {dx: 60, dy: 30});
      expect(resizeAction.newWidth).toBe(((resizeAction.mouseMoveEvent.pageX - elementToResize.left) / window.innerWidth) * 100);
      expect(resizeAction.newHeight).toBe(((resizeAction.mouseMoveEvent.pageY - elementToResize.top) / window.innerHeight) * 100);
    });
  });

  describe('Using the keep aspect ratio attribute', function () {

    beforeEach(function () {
      element = compile('<div resizeable keep-aspect-ratio></div>')(scope);
      resizeDiv = angular.element(element.children()[0]);
    });

    it('it should handle the resize correctly', function () {
      elementToResize.initialWidth = 100;
      elementToResize.initialHeight = 120;
      var deltas = {dx: 50, dy: 60};
      var resizeAction = resizeElement(elementToResize, deltas);
      expect(resizeAction.newWidth).toBe(((resizeAction.mouseMoveEvent.pageX - elementToResize.left) / window.innerWidth) * 100);
      expect(resizeAction.newHeight).toBe(((resizeAction.mouseMoveEvent.pageY - elementToResize.top) / window.innerHeight) * 100);
    });

  });

  function randomInt(lowerBound, upperBound) {
    return lowerBound + Math.floor(Math.random() * (upperBound - lowerBound));
  }

  // Helper function that emulates a whole cycle of a resizing action.
  //
  // Pass in an element which you want to resize. It will then "perform" a mousedown event on the lower right corner
  // of the element, where the handle is. Then a mousemove event with the dx, dt specified in the "mouseMove" object
  // and finally it creates a mouseup event at exactly this position.
  function resizeElement(movedElement, mouseMove) {
    var mouseDownPageX = elementToResize.initialWidth + elementToResize.left;
    var mouseDownPageY = elementToResize.initialHeight + elementToResize.top;

    var mouseDownEvent = {
      pageX: mouseDownPageX,
      pageY: mouseDownPageY
    };

    var mouseMoveEvent = {
      pageX: mouseDownPageX + mouseMove.dx,
      pageY: mouseDownPageY + mouseMove.dy
    };

    var mouseUpEvent = {
      pageX: mouseMoveEvent.pageX,
      pageY: mouseMoveEvent.pageY
    };

    element.css({
      'position': 'absolute',
      'top': movedElement.top,
      'left': movedElement.left,
      'width': movedElement.initialWidth,
      'height': movedElement.initialHeight
    });

    // Ensure we have the right width before we do the resizing!
    expect(element.outerWidth()).toBe(movedElement.initialWidth);
    expect(element.outerHeight()).toBe(movedElement.initialHeight);

    // Resize by doing mousedown, mousemove and mouseup.
    resizeDiv.triggerHandler({
      type: 'mousedown',
      pageX: mouseDownEvent.pageX,
      pageY: mouseDownEvent.pageY,
      stopPropagation: mockedMouseDownEventStopPropagation
    });

    document.triggerHandler({
      type: 'mousemove',
      pageX: mouseMoveEvent.pageX,
      pageY: mouseMoveEvent.pageY
    });

    document.triggerHandler({
      type: 'mouseup',
      pageX: mouseUpEvent.pageX,
      pageY: mouseUpEvent.pageY
    });

    scope.$digest();

    return {
      mouseDownEvent: mouseDownEvent,
      mouseMoveEvent: mouseMoveEvent,
      mouseUpEvent: mouseUpEvent,
      newWidth: element.outerWidth(),
      newHeight: element.outerHeight()
    };

  }

});
