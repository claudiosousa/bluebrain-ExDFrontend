'use strict';

describe('Controller: DynamicViewOverlayController', function() {

  var $compile, $rootScope, $scope, $q;
  var element, overlayController, dynamicViewController;
  var dynamicViewOverlayService;

  var TEST_DUMMY = {
    name: 'TEST',
    directive: 'test',
    overlayDefaultSize: {
      width: 500,
      height: 500
    },
    isResizeable: false,
    allowMultipleViews: false, // default true
  };
  beforeEach(module('dynamicViewOverlayModule'));
  beforeEach(module('exd.templates'));
  beforeEach(module('dynamicViewOverlayServiceMock'));

  beforeEach(inject(function(_$rootScope_, _$compile_, _$q_, _dynamicViewOverlayService_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;
    dynamicViewOverlayService = _dynamicViewOverlayService_;
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
    element = $compile('<dynamic-view-overlay></dynamic-view-overlay>')($scope);
    $scope.$digest();

    overlayController = element.controller('dynamicViewOverlay');
    dynamicViewController = overlayController.dynamicViewElement.controller('dynamicView');
  });

  beforeEach(function() {
    spyOn(overlayController, 'onDestroy').and.callThrough();
    spyOn(overlayController, 'closeOverlay').and.callThrough();
    spyOn(overlayController, 'setDynamicViewChannel').and.callThrough();
  });

  it(' - constructor()', function() {
    expect(overlayController.dynamicViewElement).toBeDefined();

    //expect on-destroy callback
    expect(overlayController.onDestroy).not.toHaveBeenCalled();
    $scope.$destroy();
    expect(overlayController.onDestroy).toHaveBeenCalled();
  });

  it(' - onDestroy()', function() {
    // check that nested dynamic view controller's onDestroy is called
    spyOn(dynamicViewController, 'onDestroy');
    expect(dynamicViewController.onDestroy).not.toHaveBeenCalled();
    $scope.$destroy();
    expect(dynamicViewController.onDestroy).toHaveBeenCalled();
  });

  it(' - closeOverlay()', function() {
    overlayController.closeOverlay();
    expect(overlayController.onDestroy).toHaveBeenCalled();
    expect(dynamicViewOverlayService.removeOverlay).toHaveBeenCalledWith(overlayController.$element[0].id);
  });

  it(' - setDynamicViewChannel()', function() {
    spyOn(dynamicViewController, 'setViewContentViaChannelType');
    spyOn(overlayController, 'applyChannelDefaults');
    spyOn(overlayController, 'randomizePosition');

    var deferredController = $q.defer();
    dynamicViewOverlayService.getController.and.returnValue(deferredController.promise);

    overlayController.setDynamicViewChannel(TEST_DUMMY);
    deferredController.resolve(dynamicViewController);
    $scope.$digest();

    expect(dynamicViewController.setViewContentViaChannelType).toHaveBeenCalledWith(TEST_DUMMY);
    expect(overlayController.channelType).toBe(TEST_DUMMY);
    expect(overlayController.applyChannelDefaults).toHaveBeenCalled();
    expect(overlayController.randomizePosition).toHaveBeenCalled();
  });

  it(' - applyChannelDefaults() skipp if no channel defined', function() {
    spyOn(element[0], 'getElementsByClassName');
    var previewsElement = element;
    overlayController.channelType = undefined;
    overlayController.applyChannelDefaults();
    expect(previewsElement).toBe(element);
    expect(element[0].getElementsByClassName).not.toHaveBeenCalled();
  });
});
