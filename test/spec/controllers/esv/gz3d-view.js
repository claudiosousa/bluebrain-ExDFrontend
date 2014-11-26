'use strict';

// mocking a global value
// TODO: get rid of global scoped values in production code!
var scene = {};
scene.radialMenu = {};
scene.radialMenu.showing = false;
scene.modelManipulator = {};
scene.modelManipulator.pickerNames = "";

var gui = {};
gui.emitter = {};

describe('Controller: Gz3dViewCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var Gz3dViewCtrl,
    scope,
    rootScope,
    bbpConfig;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, _bbpConfig_) {
    rootScope = $rootScope;
    scope = $rootScope.$new();
    bbpConfig = _bbpConfig_;

    Gz3dViewCtrl = $controller('Gz3dViewCtrl', {
      $rootScope: rootScope,
      $scope: scope,
      scene : scene,
      gui : gui
    });

    // create mock for console
    spyOn(console, 'error');
  }));

  it('should set port for serving the assets directory', function () {
    expect(rootScope.GZ3D).toBeDefined();
    expect(rootScope.GZ3D.assetsPath).toMatch('http://');
    expect(rootScope.GZ3D.assetsPath).toMatch('assets');
    expect(rootScope.GZ3D.webSocketUrl).toMatch('ws://');
  });

  it('should set a color on the selected screen', function() {
    // prepare the test: create mockups
    var entityToChange = { 'children' : [ { 'material' : {} } ] };
    entityToChange.children[0].material.color = {};
    entityToChange.children[0].material.color.setHex = jasmine.createSpy('setHex');

    entityToChange.children[0].material.ambient = {};
    entityToChange.children[0].material.ambient.setHex = jasmine.createSpy('setHex');

    entityToChange.children[0].material.specular = {};
    entityToChange.children[0].material.specular.setHex = jasmine.createSpy('setHex');

    // we are acting on global scope now, since scene is global currently – not a good idea ... :(
    // TODO get rid of global scope ...
    scene.getByName = jasmine.createSpy('getByName').andReturn(entityToChange);

    // actual test
    var getType = {};
    expect(getType.toString.call(scope.setColorOnEntity)).toBe('[object Function]');

    // currently no element is selected, hence we want a console.error message
    scope.setColorOnEntity("value_does_not_matter_here");
    expect(console.error).toHaveBeenCalled();
    expect(console.error.callCount).toEqual(1);

    // pretend we selected a screen now
    scope.selectedEntity = { 'name' : 'vr_screen_0' };
    scope.setColorOnEntity('red');
    expect(scene.getByName).toHaveBeenCalledWith('vr_screen_0::body::screen_glass');

    var redHexValue = 0xff0000;
    expect(entityToChange.children[0].material.color.setHex).toHaveBeenCalledWith(redHexValue);
    expect(entityToChange.children[0].material.color.setHex.callCount).toEqual(1);
    expect(entityToChange.children[0].material.ambient.setHex).toHaveBeenCalledWith(redHexValue);
    expect(entityToChange.children[0].material.ambient.setHex.callCount).toEqual(1);
    expect(entityToChange.children[0].material.specular.setHex).toHaveBeenCalledWith(redHexValue);
    expect(entityToChange.children[0].material.specular.setHex.callCount).toEqual(1);
  });

  it('should toggle a menu to be able to change the screen color', function() {
    // actual test
    var getType = {};
    expect(getType.toString.call(scope.toggleScreenChangeMenu)).toBe('[object Function]');

    // first the false case
    var show = false;
    var event = {};
    scope.toggleScreenChangeMenu(show, event);
    expect(scope.isContextMenuShown).toBe(false);
    expect(scene.radialMenu.showing).toBe(false);

    // now the true case
    show = true;
    event = { 'clientX' : 100, 'clientY': 200 };
    scope.isContextMenuShown = false;
    scope.getModelUnderMouse = function(event) {
      return { 'name' : 'vr_screen_1' };
    };
    scene.selectedEntity = { 'some_key' : 'some_value' };
    scope.toggleScreenChangeMenu(show, event);

    expect(scope.contextMenuTop).toEqual(event.clientY);
    expect(scope.contextMenuLeft).toEqual(event.clientX);
    expect(scope.selectedEntity).toEqual(scene.selectedEntity);
  });

  it('should pause or start gazebo', function() {
      // test if globals exist
      expect(gui).toBeDefined();
      expect(gui.emitter).toBeDefined();

      // test if function exists
      var getType = {};
      expect(getType.toString.call(scope.pauseGazebo)).toBe('[object Function]');

      // creat mock for emit
      gui.emitter.emit = jasmine.createSpy('emit');
      // call function to test
      scope.pauseGazebo(true);
      // expect emit() to be called
      expect(gui.emitter.emit).toHaveBeenCalledWith('pause', true);
      expect(gui.emitter.emit.callCount).toEqual(1);
  });

  it('should turn slider position into light intensities', function() {
      var getType = {};
      expect(getType.toString.call(scope.updateLightIntensities)).toBe('[object Function]');
      expect(getType.toString.call(scope.incrementLightIntensities)).toBe('[object Function]');
      scope.incrementLightIntensities = jasmine.createSpy('incrementLightIntensities');

      scope.updateLightIntensities(60.0);

      expect(scope.incrementLightIntensities).toHaveBeenCalledWith((60 - 50) / 50.25);
      expect(scope.incrementLightIntensities.callCount).toEqual(1);
  });


  it('should emit light intensity changes', function() {
      scene.scene = {};
      scene.emitter = {};
      scene.emitter.emit = jasmine.createSpy('emit');
      var light0 = THREE.AmbientLight;
      var light1 = {
          name: 'left_spot',
          initialIntensity: 0.5
      };
      var light2 = {
          name: 'right_spot',
          initialIntensity: 0.5
      };
      scene.scene.__lights = [light1, light2];

      var helper = undefined;
      var entity1 = {
          children: [light1, helper]
      };
      var entity2 = {
          children: [light0, light2, helper]
      };
      scene.getByName = function(name) {
          if (name === 'left_spot') {
              return entity1;
          }

          if (name === 'right_spot') {
              return entity2;
          }

          return undefined;
      };

      scope.incrementLightIntensities(-0.5);

      expect(scene.emitter.emit).toHaveBeenCalledWith('entityChanged', entity1);
      expect(scene.emitter.emit).toHaveBeenCalledWith('entityChanged', entity2);
      expect(scene.emitter.emit.callCount).toEqual(2);
  });

});
