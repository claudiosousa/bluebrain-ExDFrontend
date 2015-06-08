'use strict';

/* global GZ3D: true */
/* global Detector: true */
/* global document: true */

describe('testing the gzInitialization service', function () {
  var gzInitialization,
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
  beforeEach(inject(function ($rootScope, _gzInitialization_, _$stateParams_, _bbpConfig_) {
    rootScope = $rootScope;
    gzInitialization = _gzInitialization_;
    stateParams = _$stateParams_;
    bbpConfig = _bbpConfig_;

    // create a mock for console
    spyOn(console, 'error');

    // Always initialize first
    gzInitialization.Initialize('bbpce016', 'fakeSimID');
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
    rootScope.container.offsetHeight = 110;
    rootScope.$digest();
    expect(SceneObject.setWindowSize).toHaveBeenCalledWith(200, 110);
    rootScope.container.offsetWidth = 210;
    rootScope.container.offsetHeight = 100;
    rootScope.$digest();
    expect(SceneObject.setWindowSize).toHaveBeenCalledWith(210, 100);
  });

  it('should not initialize when already initialized', function() {
    rootScope.sdfParser = undefined;
    // initialize a second time
    gzInitialization.Initialize('fakeserverID', 'fakeSimID');
    expect(rootScope.sdfParser).not.toBeDefined();
  });

  it('should deinitialize', function() {
    gzInitialization.deInitialize();
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
