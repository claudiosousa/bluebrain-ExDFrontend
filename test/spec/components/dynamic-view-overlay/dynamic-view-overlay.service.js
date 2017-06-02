'use strict';

describe('Service: dynamicViewOverlayService', function() {

  var $timeout;
  var dynamicViewOverlayService;

  beforeEach(module('exd.templates'));
  beforeEach(module('dynamicViewOverlayModule'));
  beforeEach(module('nrpAnalyticsMock'));
  //beforeEach(module('dynamicViewModule'));

  beforeEach(inject(function(_$timeout_, _dynamicViewOverlayService_) {
    $timeout = _$timeout_;
    dynamicViewOverlayService = _dynamicViewOverlayService_;
  }));

  it(' - constructor()', function() {
    expect(Object.keys(dynamicViewOverlayService.overlays).length).toBe(0);
    expect(dynamicViewOverlayService.overlayIDCount).toBe(0);
  });

  it(' - createOverlay()', function() {
    var idCount = 5;
    var htmlID = 'dynamic-view-overlay-' + idCount;
    dynamicViewOverlayService.overlayIDCount = idCount;
    var parentElement = document.createElement('div');
    var componentName = 'test-component';

    var overlay = dynamicViewOverlayService.createOverlay(parentElement, componentName);

    // check id is set correctly
    expect(overlay[0].id).toBe('dynamic-view-overlay-' + idCount);
    expect(dynamicViewOverlayService.overlays[htmlID]).toBe(overlay);
    expect(dynamicViewOverlayService.overlayIDCount).toBe(idCount + 1);

    // should be attached to parent element
    expect(overlay[0].parentElement).toBe(parentElement);

    // check controller is called with component name
    var mockController = {
      setDynamicViewComponent: jasmine.createSpy('setDynamicViewComponent')
    };
    overlay.controller = jasmine.createSpy('controller').and.returnValue(mockController);
    $timeout.flush();
    expect(overlay.controller('dynamicViewOverlay').setDynamicViewComponent).toHaveBeenCalledWith(componentName);
    overlay.remove();
  });

  it(' - createOverlay(), no parentElement specified', function() {
    var componentName = 'test-component';
    var overlay = dynamicViewOverlayService.createOverlay(undefined, componentName);
    // should be attached to document
    expect(overlay[0].parentElement).toBe(document.body);
    overlay.remove();
    //dynamicViewOverlayService.removeOverlay(overlay[0].id);
  });

  it(' - removeOverlay()', function() {
    var mockID = 'test-id';
    var mockOverlayElement = {
      remove: jasmine.createSpy('remove')
    };
    dynamicViewOverlayService.overlays[mockID] = mockOverlayElement;
    spyOn(document, 'getElementById').and.returnValue(mockOverlayElement);

    dynamicViewOverlayService.removeOverlay(mockID);

    expect(document.getElementById).toHaveBeenCalledWith(mockID);
    expect(mockOverlayElement.remove).toHaveBeenCalled();
    expect(dynamicViewOverlayService.overlays[mockID]).not.toBeDefined();
  });
});
