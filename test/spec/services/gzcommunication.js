'use strict';

/* global GZ3D: true */
/* global Detector: true */
/* global document: true */


describe('testing the gz3d service', function () {
  var gz3d,
    rootScope,
    bbpConfig;

  var stateParams = {
    serverID : 'bbpce016',
    simulationID : 'mocked_simulation_id'
  };

  var bbpConfigMock = {};
  bbpConfigMock.get = jasmine.createSpy('get').andReturn({
    'bbpce016' : { gzweb: {assets: 'mock_assets', websocket: 'mock_websocket'}}
  });

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

  var SceneObject = {};
  SceneObject.render = jasmine.createSpy('render');
  var DomElement = {};
  SceneObject.getDomElement = jasmine.createSpy('getDomElement').andReturn(DomElement);
  SceneObject.setWindowSize = jasmine.createSpy('setWindowSize');
  var GuiObject = {};
  var GZIfaceObject = {};
  var SdfParserObject = {};
  GZ3D = {};
  GZ3D.Scene = jasmine.createSpy('Scene').andReturn(SceneObject);
  GZ3D.Gui = jasmine.createSpy('Gui').andReturn(GuiObject);
  GZ3D.GZIface = jasmine.createSpy('GZIface').andReturn(GZIfaceObject);
  GZ3D.SdfParser = jasmine.createSpy('SdfParser').andReturn(SdfParserObject);

  beforeEach(module('gz3dServices'));
  beforeEach(module(function ($provide) {
    $provide.value('$stateParams', stateParams);
    $provide.value('bbpConfig', bbpConfigMock);
  }));
  beforeEach(inject(function ($rootScope, _gz3d_, _$stateParams_, _bbpConfig_) {
    rootScope = $rootScope;
    gz3d = _gz3d_;
    stateParams = _$stateParams_;
    bbpConfig = _bbpConfig_;

    // create a mock for console
    spyOn(console, 'error');

    // Always initialize first
    gz3d.Initialize('bbpce016', 'fakeSimID');
  }));

  it('checks if all the GZ3D constructors have been called', function() {
    expect(GZ3D.Scene).toHaveBeenCalled();
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
});
