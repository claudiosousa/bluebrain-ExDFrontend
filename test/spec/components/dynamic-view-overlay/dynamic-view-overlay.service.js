'use strict';

describe('Service: dynamicViewOverlayService', function() {

  var $q, $rootScope, $timeout;
  var dynamicViewOverlayService;

  beforeEach(module('exd.templates'));
  beforeEach(module('dynamicViewOverlayModule'));
  beforeEach(module('nrpAnalyticsMock'));
  //beforeEach(module('dynamicViewModule'));

  beforeEach(inject(function(_$q_, _$rootScope_, _$timeout_, _dynamicViewOverlayService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    dynamicViewOverlayService = _dynamicViewOverlayService_;
  }));

  it(' - constructor()', function() {
    expect(Object.keys(dynamicViewOverlayService.overlays).length).toBe(0);
    expect(dynamicViewOverlayService.overlayIDCount).toBe(0);
  });

  it(' - createOverlay()', function() {
    var defferedOverlayController = $q.defer();
    spyOn(dynamicViewOverlayService, 'getController').and.returnValue(defferedOverlayController.promise);
    // set up overlay controller mock
    var mockOverlayController = {
      setDynamicViewChannel: jasmine.createSpy('setDynamicViewChannel')
    };

    var idCount = 5;
    var htmlID = 'dynamic-view-overlay-' + idCount;
    dynamicViewOverlayService.overlayIDCount = idCount;
    var parentElement = document.createElement('div');
    var channelName = 'test-channel';

    var overlay = dynamicViewOverlayService.createOverlay(parentElement, channelName);
    defferedOverlayController.resolve(mockOverlayController);
    $rootScope.$digest();

    // check id is set correctly
    expect(overlay[0].id).toBe('dynamic-view-overlay-' + idCount);
    expect(dynamicViewOverlayService.overlays[htmlID]).toBe(overlay);
    expect(dynamicViewOverlayService.overlayIDCount).toBe(idCount + 1);

    expect(overlay[0].parentElement).toBe(parentElement);
    expect(mockOverlayController.setDynamicViewChannel).toHaveBeenCalledWith(channelName);
    overlay.remove();
  });

  it(' - createOverlay(), no parentElement specified', function() {
    var channelName = 'test-component';
    var overlay = dynamicViewOverlayService.createOverlay(undefined, channelName);
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
