'use strict';

describe('Directive: resizeable', function () {

  beforeEach(module('exdFrontendApp'));

  var $scope, element, window;
  var resizeButtons;

  var HORIZONTAL_STEP = 50;
  var VERTICAL_STEP = 25;
  var MIN_WIDTH = 100;
  var MIN_HEIGHT = 60;

  beforeEach(inject(function ($rootScope, $compile, $window) {
    $scope = $rootScope.$new();
    element = $compile('<div resizeable></div>')($scope);
    $scope.$digest();
    window = $window;
    $scope.onScreenSizeChanged = jasmine.createSpy('onScreenSizeChanged');

    resizeButtons = angular.element(element.children()[0]).children();

  }));

  it('replaces the element with the appropriate content', function () {
    // Compile a piece of HTML containing the directive
    expect(element.prop('outerHTML')).toContain('<div resizeable="" class="ng-scope"><div class="resize-buttons"><div class="resize-button first-element"><i class="fa fa-expand rotate-45-counterclockwise"></i></div><div class="resize-button"><i class="fa fa-compress rotate-45-counterclockwise"></i></div><div class="resize-button"><i class="fa fa-expand rotate-45-clockwise"></i></div><div class="resize-button"><i class="fa fa-compress rotate-45-clockwise"></i></div></div></div>');
  });

  it('checks for the default window height and width', function () {
    //default height and width
    expect(window.innerHeight).toBe(300);
    expect(window.innerWidth).toBe(400);
  });

  /***
   * Test the enlarge Height function
   */
  it('should make the element higher', function () {
    element.css('height', window.innerHeight - VERTICAL_STEP - 1);
    element.css('width', 120);
    $scope.$digest();
    $scope.onScreenSizeChanged.reset();

    var oldHeight = element.outerHeight();
    var enlargeHeight = angular.element(resizeButtons[0]);
    enlargeHeight.trigger('click');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).toHaveBeenCalled();
    expect(element.outerHeight()).toBe(oldHeight + VERTICAL_STEP);
  });

  it('should NOT make the element higher', function () {
    element.css('height', window.innerHeight - 1);
    element.css('width', 120);
    $scope.$digest();
    $scope.onScreenSizeChanged.reset();

    var oldHeight = element.outerHeight();
    var enlargeHeight = angular.element(resizeButtons[0]);
    enlargeHeight.trigger('click');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).not.toHaveBeenCalled();
    expect(element.outerHeight()).toBe(oldHeight);
  });

  /***
   * Test the compress Height function
   */
  it('should make the element smaller in height', function () {
    element.css('height', MIN_HEIGHT + VERTICAL_STEP + 1);
    element.css('width', 120);
    $scope.$digest();
    $scope.onScreenSizeChanged.reset();

    var oldHeight = element.outerHeight();
    var compressHeight = angular.element(resizeButtons[1]);
    compressHeight.trigger('click');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).toHaveBeenCalled();
    expect(element.outerHeight()).toBe(oldHeight - VERTICAL_STEP);
  });

  it('should NOT make the element smaller in height', function () {
    element.css('height', MIN_HEIGHT + 1);
    element.css('width', 120);
    $scope.$digest();
    $scope.onScreenSizeChanged.reset();

    var oldHeight = element.outerHeight();
    var compressHeight = angular.element(resizeButtons[1]);
    compressHeight.trigger('click');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).not.toHaveBeenCalled();
    expect(element.outerHeight()).toBe(oldHeight);
  });

  /***
   * Test the enlarge Width function
   */
  it('should make the element wider', function () {
    element.css('height', 70);
    element.css('width', MIN_WIDTH + 1);
    $scope.$digest();
    $scope.onScreenSizeChanged.reset();

    var oldWidth = element.outerWidth();
    var enlargeWidth = angular.element(resizeButtons[2]);
    enlargeWidth.trigger('click');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).toHaveBeenCalled();
    expect(element.outerWidth()).toBe(oldWidth + HORIZONTAL_STEP);
  });

  it('should NOT make the element wider', function () {
    element.css('height', 70);
    element.css('width', window.innerWidth - 1);
    $scope.$digest();
    $scope.onScreenSizeChanged.reset();

    var oldWidth = element.outerWidth();
    var enlargeWidth = angular.element(resizeButtons[2]);
    enlargeWidth.trigger('click');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).not.toHaveBeenCalled();
    expect(element.outerWidth()).toBe(oldWidth);
  });

  /***
   * Test the compress Width function
   */
  it('should make the element smaller in width', function () {
    element.css('height', 70);
    element.css('width', MIN_WIDTH + HORIZONTAL_STEP + 1);
    $scope.$digest();
    $scope.onScreenSizeChanged.reset();

    var oldWidth = element.outerWidth();
    var compressWidth = angular.element(resizeButtons[3]);
    compressWidth.trigger('click');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).toHaveBeenCalled();
    expect(element.outerWidth()).toBe(oldWidth - HORIZONTAL_STEP);
  });

  it('should NOT make the element smaller in width', function () {
    element.css('height', 70);
    element.css('width', MIN_WIDTH + 1);
    $scope.$digest();
    $scope.onScreenSizeChanged.reset();

    var oldWidth = element.outerWidth();
    var compressWidth = angular.element(resizeButtons[3]);
    compressWidth.trigger('click');
    $scope.$digest();
    expect($scope.onScreenSizeChanged).not.toHaveBeenCalled();
    expect(element.outerWidth()).toBe(oldWidth);
  });
});
