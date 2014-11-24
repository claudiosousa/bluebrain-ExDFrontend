'use strict';

// mocking a global value
// TODO: get rid of global scoped values in production code!
var scene = {};
scene.radialMenu = {};
scene.radialMenu.showing = false;
scene.modelManipulator = {};
scene.modelManipulator.pickerNames = "";

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
      scene : scene
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

});
