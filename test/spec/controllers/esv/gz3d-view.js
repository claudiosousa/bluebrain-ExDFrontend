'use strict';

// mocking a global value
// TODO: get rid of global scoped values in production code!
var scene = {};
scene.radialMenu = {};
scene.radialMenu.showing = false;
scene.modelManipulator = {};
scene.modelManipulator.pickerNames = '';

var gui = {};
gui.emitter = {};

describe('Controller: Gz3dViewCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var Gz3dViewCtrl,
    scope,
    rootScope,
    bbpConfig,
    httpBackend,
    simulationStatistics;

  // we mock the whole gzCommunication service here
  var gzCommunicationMock = {};
  gzCommunicationMock.connect = jasmine.createSpy('connect').andReturn({ subscribe : function(){} });

  beforeEach(module(function($provide) {
    $provide.value('gzCommunication', gzCommunicationMock);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, _bbpConfig_, _$httpBackend_, _simulationStatistics_) {
    rootScope = $rootScope;
    scope = $rootScope.$new();
    bbpConfig = _bbpConfig_;
    httpBackend = _$httpBackend_;
    simulationStatistics = _simulationStatistics_;

    httpBackend.whenGET('views/common/main.html').respond({}); // Templates are requested via HTTP and processed locally.
    httpBackend.whenGET('http://bbpce013.epfl.ch:8080/simulation/1/state').respond({ simulationID: 1, experimentID: 'fakeExperiment'});
    httpBackend.whenPUT(/()/).respond(200);

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

  it('should retrieve the simulation object with simulation id equal to 1', function() {
      httpBackend.expectGET('http://bbpce013.epfl.ch:8080/simulation/1/state');
      httpBackend.flush();
      expect(scope.simulation.simulationID).toBe(1);
  });

  it('should check for the currently hovered model', function () {
    scope.getModelUnderMouse = jasmine.createSpy('getModelUnderMouse').andReturn({name: 'some_name'});
    scope.updateHoverInfo();
    expect(scope.hoveredObject).toEqual('some_name');
  });

  it('should get the model under the current mouse position', function () {
    scene.getRayCastModel = jasmine.createSpy('getRayCastModel');
    scope.getModelUnderMouse({clientX: 10, clientY: 10});
    expect(scene.getRayCastModel).toHaveBeenCalled();
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
    scope.setColorOnEntity('value_does_not_matter_here');
    expect(console.error).toHaveBeenCalled();
    expect(console.error.callCount).toEqual(1);

    // pretend we selected a screen now
    scope.selectedEntity = { 'name' : 'vr_left_screen_0' };
    scope.setColorOnEntity('red');
    expect(scene.getByName).toHaveBeenCalledWith('vr_left_screen_0::body::screen_glass');

    var redHexValue = 0xff0000;
    expect(entityToChange.children[0].material.color.setHex).toHaveBeenCalledWith(redHexValue);
    expect(entityToChange.children[0].material.color.setHex.callCount).toEqual(1);
    expect(entityToChange.children[0].material.ambient.setHex).toHaveBeenCalledWith(redHexValue);
    expect(entityToChange.children[0].material.ambient.setHex.callCount).toEqual(1);
    expect(entityToChange.children[0].material.specular.setHex).toHaveBeenCalledWith(redHexValue);
    expect(entityToChange.children[0].material.specular.setHex.callCount).toEqual(1);

    // test RESTful call
    httpBackend.expectPUT('http://bbpce013.epfl.ch:8080/simulation/1/interaction', {'model':'vr_left_screen_0','visual':'screen_glass','color':'Gazebo/Blue'});
    httpBackend.flush();
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
    scope.getModelUnderMouse = function(event) { // jshint ignore:line
      return { 'name' : 'vr_screen_1' };
    };
    scene.selectedEntity = { 'some_key' : 'some_value' };
    scope.toggleScreenChangeMenu(show, event);

    expect(scope.contextMenuTop).toEqual(event.clientY);
    expect(scope.contextMenuLeft).toEqual(event.clientX);
    expect(scope.selectedEntity).toEqual(scene.selectedEntity);
  });

  it('should pause or start the simulation', function() {
      // test if object function exists
      var getType = {};
      expect(getType.toString.call(scope.pauseSimulation)).toBe('[object Function]');

      scope.simulation = { simulationID: 1 };
      scope.paused = true;
      scope.pauseSimulation();
      httpBackend.expectPUT('http://bbpce013.epfl.ch:8080/simulation/1/state', {state: 'resumed'});

      httpBackend.flush();

      scope.paused = false;
      scope.pauseSimulation();
      httpBackend.expectPUT('http://bbpce013.epfl.ch:8080/simulation/1/state', {state: 'paused'});
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

      // three is loaded externally, jshint does not know that
      var light0 = new THREE.AmbientLight(); // jshint ignore:line
      var light1 = new THREE.PointLight(); // jshint ignore:line
      light1.name = 'left_spot';
      light1.initialIntensity = 0.5;
      var light2 = new THREE.PointLight();// jshint ignore:line
      light2.name = 'right_spot';
      light2.initialIntensity = 0.5;

      scene.scene.__lights = [light1, light2];

      // helper is defined as 'undefined' for semantical reasons
      var helper = undefined; // jshint ignore:line
      var entity0 = {
          children: [light0, helper]
      };
      var entity1 = {
          children: [light1, helper]
      };
      var entity2 = {
          children: [light2, helper]
      };
      scene.getByName = function(name) {
          if (name === 'ambient') {
              return entity0;
          }

          if (name === 'left_spot') {
              return entity1;
          }

          if (name === 'right_spot') {
              return entity2;
          }

          return undefined;
      };

      scene.getLightType = rootScope.GZ3D.Scene.prototype.getLightType;
      scene.intensityToAttenuation = rootScope.GZ3D.Scene.prototype.intensityToAttenuation;

      scope.incrementLightIntensities(-0.5);

      // test RESTful call
      /*jshint camelcase: false */
      httpBackend.expectPUT('http://bbpce013.epfl.ch:8080/simulation/1/interaction/light', { name: 'left_spot', attenuation_constant: 0.2 });
      httpBackend.flush();
      httpBackend.expectPUT('http://bbpce013.epfl.ch:8080/simulation/1/interaction/light', { name: 'right_spot', attenuation_constant: 0.2 });
      /*jshint camelcase: true */
  });

});
