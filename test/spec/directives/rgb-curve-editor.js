'use strict';

describe('Directive: Curve Editor', function ()
{
  var $rootScope, element;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(inject(function (
    _$rootScope_,
    $compile)
  {
    $rootScope = _$rootScope_;
    $rootScope.selectedColorChannel = 0;
    $rootScope.rgbcurve = { 'red': [], 'green': [], 'blue': [] };
    element = $compile('<rgb-curve-editor selected-color-channel="selectedColorChannel" curve="rgbcurve" on-change="onRGBCurveChanged()"></rgb-curve-editor>')($rootScope);
    $rootScope.$digest();
  }));

  it('should create curve editor canvas view', function ()
  {
    $rootScope.rgbcurve = { 'red': [], 'green': [], 'blue': [] };
    $rootScope.onRGBCurveChanged = function () { };


    $rootScope.showEnvironmentSettingsPanel = true;
    $rootScope.$digest();

    expect(element.find('canvas').length).toBe(1);
  });

  it('should render spline', function ()
  {
    $rootScope.rgbcurve = { 'red': [[0, 0], [0.5, 0.5], [1.0, 1.0]], 'green': [], 'blue': [] };
    $rootScope.$digest();

    expect($rootScope.$$childTail.curve).toBeDefined();
  });

  it('should properly handles mouse drag', function ()
  {
    $rootScope.rgbcurve = { 'red': [[0, 0], [0.5, 0.5], [1.0, 1.0]], 'green': [], 'blue': [] };
    $rootScope.$digest();


    var event = {};
    var canvas = element.find('#rgb-curve-canvas')[0];

    var rect = canvas.getBoundingClientRect();

    event.clientX = rect.left + canvas.width / 2;
    event.clientY = rect.top + canvas.height / 2;

    $rootScope.$$childTail.mouseDown(event);

    event.clientX += 5;
    event.clientY += 5;
    $rootScope.$$childTail.mouseMove(event);
    $rootScope.$$childTail.mouseUp(event);
    $rootScope.$$childTail.mouseOut(event);

    expect($rootScope.$$childTail.curve.red.length).toBeGreaterThan(2);
  });

  it('should add new point', function ()
  {
    $rootScope.rgbcurve = { 'red': [[0, 0], [1.0, 1.0]], 'green': [], 'blue': [] };
    $rootScope.$digest();

    var event = {};
    var canvas = element.find('#rgb-curve-canvas')[0];

    var rect = canvas.getBoundingClientRect();

    event.clientX = rect.left + canvas.width / 2;
    event.clientY = rect.top + canvas.height / 2;

    $rootScope.$$childTail.mouseDown(event);

    event.clientX += 5;
    event.clientY += 5;
    $rootScope.$$childTail.mouseMove(event);
    $rootScope.$$childTail.mouseUp(event);
    $rootScope.$$childTail.mouseOut(event);

    expect($rootScope.$$childTail.curve.red.length).toBeGreaterThan(2);
  });


  it('should handles an undefined curve', function ()
  {
    $rootScope.rgbcurve = undefined;
    $rootScope.$$childTail.renderCurve();
    $rootScope.$digest();

    expect($rootScope.$$childTail.curve).toBeDefined();
  });

  it('should propery destroy itself', function ()
  {
    $rootScope.$destroy();
    expect($rootScope.$$childTail).toBe(null);
  });


});

