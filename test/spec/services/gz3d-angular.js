'use strict';

/* global GZ3D: true */
/* global THREE: true */
/* global Detector: true */
/* global document: true */


describe('testing the gz3d service', function () {
  var gz3d,
    rootScope;

  //Mock the javascript document
  document = {};
  document.getElementById = function() {
    var element = {};
    element.appendChild = function(){};
    element.offsetHeight = 100;
    element.offsetWidth = 200;
    return element;
  };

  Detector = {};
  Detector.webgl = true;
  var cameraHelper = { visible: false };
  var SceneObject = {
    scene: new THREE.Scene(),
    render: jasmine.createSpy('render'),
    viewManager: {
      setCallbackCreateRenderContainer: jasmine.createSpy('setCallbackCreateRenderContainer'),
      getViewByName: function () { return { camera: { cameraHelper: cameraHelper } }; }
    },
    getDomElement: jasmine.createSpy('getDomElement').andReturn({}),
    setWindowSize: jasmine.createSpy('setWindowSize')
  };
  var GuiObject = {};
  var GZIfaceObject = { addCanDeletePredicate: angular.noop };
  var SdfParserObject = {};
  GZ3D = {};
  GZ3D.Scene = jasmine.createSpy('Scene').andReturn(SceneObject);
  GZ3D.Gui = jasmine.createSpy('Gui').andReturn(GuiObject);
  GZ3D.GZIface = jasmine.createSpy('GZIface').andReturn(GZIfaceObject);
  GZ3D.SdfParser = jasmine.createSpy('SdfParser').andReturn(SdfParserObject);

  var simulationInfo = {
    serverID: 'bbpce016',
    simulationID: 'mocked_simulation_id',
    serverConfig: { gzweb: {assets: 'https://assets', websocket:'wss://websocket'}},
    Initialize: jasmine.createSpy('Initialize')
  };

  var bbpConfig = {};
  bbpConfig.get = jasmine.createSpy('get').andReturn('toto');

  beforeEach(module('gz3dServices'));
  beforeEach(module(function ($provide) {
    $provide.value('simulationInfo', simulationInfo);
    $provide.value('bbpConfig', bbpConfig);
  }));

  beforeEach(inject(function ($rootScope, _gz3d_) {
    rootScope = $rootScope;
    gz3d = _gz3d_;

    // create a mock for console
    spyOn(console, 'error');

    // Always initialize first
    gz3d.Initialize();
  }));

  it('checks if all the GZ3D constructors have been called', function() {
    expect(GZ3D.Scene).toHaveBeenCalled();
    expect(SceneObject.viewManager.setCallbackCreateRenderContainer).toHaveBeenCalledWith(gz3d.createRenderContainer);
    expect(GZ3D.Gui).toHaveBeenCalledWith(SceneObject);
    expect(GZ3D.GZIface).toHaveBeenCalledWith(SceneObject, GuiObject);
    expect(GZ3D.SdfParser).toHaveBeenCalledWith(SceneObject, GuiObject , GZIfaceObject);
    expect(SceneObject.render).toHaveBeenCalled();
  });

  it('checks for the correct callback of the DIV size changes', function() {
    rootScope.$digest();
    gz3d.container.offsetHeight = 110;
    rootScope.$digest();
    expect(SceneObject.setWindowSize).toHaveBeenCalledWith(200, 110);
    gz3d.container.offsetWidth = 210;
    gz3d.container.offsetHeight = 100;
    rootScope.$digest();
    expect(SceneObject.setWindowSize).toHaveBeenCalledWith(210, 100);
  });

  it('checks if render container elements are correctly generated', function() {

    gz3d.Initialize();
    var testRenderContainerAdjustable = gz3d.createRenderContainer(true, 'test_rendercontainer_adjustable');
    var testRenderContainerNotAdjustable = gz3d.createRenderContainer(false, 'test_rendercontainer_unadjustable');

    expect(testRenderContainerAdjustable.getAttribute('movable')).not.toEqual(undefined);
    expect(testRenderContainerAdjustable.getAttribute('resizeable')).not.toEqual(undefined);
    expect(testRenderContainerAdjustable.getAttribute('keep-aspect-ratio')).not.toEqual(undefined);
    expect(testRenderContainerAdjustable.getAttribute('camera-name')).toEqual('test_rendercontainer_adjustable');
    expect(testRenderContainerAdjustable.className).toEqual('render-view-container camera-view-window ng-scope');

    expect(testRenderContainerNotAdjustable.getAttribute('keep-aspect-ratio')).not.toEqual(undefined);
    expect(testRenderContainerNotAdjustable.getAttribute('camera-name')).toEqual('test_rendercontainer_unadjustable');
    expect(testRenderContainerNotAdjustable.className).toEqual('render-view-container camera-view-window ng-scope');
  });

  it('should not initialize when already initialized', function() {
    gz3d.sdfParser = undefined;
    // initialize a second time
    gz3d.Initialize('fakeserverID', 'fakeSimID');
    expect(gz3d.sdfParser).not.toBeDefined();
  });

  it('should deinitialize', function() {
    gz3d.deInitialize();
    expect(rootScope.sdfParser).not.toBeDefined();
    expect(rootScope.iface).not.toBeDefined();
    expect(rootScope.gui).not.toBeDefined();
    expect(rootScope.scene).not.toBeDefined();
    expect(rootScope.container).not.toBeDefined();
    expect(rootScope.stats).not.toBeDefined();
    expect(rootScope.animate).not.toBeDefined();
    expect(rootScope.renderer).not.toBeDefined();
  });

  it('isGlobalLightMin/MaxReached should return false if gz3d.scene is undefined', function() {
    gz3d.scene = undefined;
    expect(gz3d.isGlobalLightMinReached()).toBe(false);
    expect(gz3d.isGlobalLightMaxReached()).toBe(false);
  });

  it('isGlobalLightMin/MaxReached should return true or false depending on light intensity information', function() {
    var lightInfoReturnValue = { max: 0.1 };
    gz3d.scene.findLightIntensityInfo = function()
    {
      return lightInfoReturnValue;
    };
    expect(gz3d.isGlobalLightMinReached()).toBe(true);
    expect(gz3d.isGlobalLightMaxReached()).toBe(false);
    lightInfoReturnValue.max = 1.0;
    expect(gz3d.isGlobalLightMinReached()).toBe(false);
    expect(gz3d.isGlobalLightMaxReached()).toBe(true);
  });

  it(' - setLightHelperVisibility() should work', function() {
    // set up test lightHelper object
    var testLightHelper = new THREE.Object3D();
    testLightHelper.name = 'test_lightHelper';
    testLightHelper.visible = false;
    gz3d.scene.scene.showLightHelpers = true;
    gz3d.scene.scene.add(testLightHelper);

    expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(false);

    gz3d.scene.showLightHelpers = true;

    gz3d.setLightHelperVisibility();

    expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(true);
  });
});
