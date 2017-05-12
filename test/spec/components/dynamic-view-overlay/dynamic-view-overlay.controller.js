'use strict';

describe('Controller: DynamicViewOverlayController', function() {

  var $compile, $rootScope, $scope;
  var element, overlayController, dynamicViewController;
  var dynamicViewOverlayService;

  beforeEach(module('dynamicViewOverlayModule'));
  beforeEach(module('exd.templates'));
  beforeEach(module('dynamicViewOverlayServiceMock'));

  beforeEach(inject(function(_$rootScope_, _$compile_, _dynamicViewOverlayService_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
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
    spyOn(overlayController, 'setDynamicViewComponent').and.callThrough();
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

  it(' - setDynamicViewComponent()', function() {
    spyOn(dynamicViewController, 'setViewContentViaDirective');
    var componentName = 'test-component';
    overlayController.setDynamicViewComponent(componentName);
    expect(dynamicViewController.setViewContentViaDirective).toHaveBeenCalledWith(componentName);
  });

});
