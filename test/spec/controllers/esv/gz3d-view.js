'use strict';

describe('Controller: Gz3dViewCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var Gz3dViewCtrl,
    scope,
    rootScope,
    httpBackend,
    cameraManipulation;

  var simulationStatisticsMock = {};
  simulationStatisticsMock.setSimulationTimeCallback = jasmine.createSpy('setSimulationTimeCallback');
  simulationStatisticsMock.setRealTimeCallback = jasmine.createSpy('setRealTimeCallback');
  simulationStatisticsMock.setPausedCallback = jasmine.createSpy('setPausedCallback');

  var gzInitializationMock = {};

  var cameraManipulationMock = {};
  cameraManipulationMock.firstPersonRotate = jasmine.createSpy('firstPersonRotate');
  cameraManipulationMock.firstPersonTranslate = jasmine.createSpy('firstPersonTranslate');
  cameraManipulationMock.lookAtOrigin = jasmine.createSpy('lookAtOrigin');
  cameraManipulationMock.resetToInitialPose = jasmine.createSpy('resetToInitialPose');

  beforeEach(module(function ($provide) {
    $provide.value('simulationStatistics', simulationStatisticsMock);
    $provide.value('gzInitialization', gzInitializationMock);
    $provide.value('cameraManipulation', cameraManipulationMock);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, _$httpBackend_, _cameraManipulation_) {
    rootScope = $rootScope;
    scope = $rootScope.$new();
    httpBackend = _$httpBackend_;
    cameraManipulation = _cameraManipulation_;

    rootScope.scene = {};
    rootScope.scene.radialMenu = {};
    rootScope.scene.radialMenu.showing = false;
    rootScope.scene.modelManipulator = {};
    rootScope.scene.modelManipulator.pickerNames = '';
    rootScope.scene.emitter = {};
    rootScope.gui = {};
    rootScope.gui.emitter = {};

    rootScope.simulations = [
      { simulationID: 0, experimentID: 'fakeExperiment0', state: 'created'},
      { simulationID: 1, experimentID: 'fakeExperiment1', state: 'initialized'},
      { simulationID: 2, experimentID: 'fakeExperiment2', state: 'paused'},
      { simulationID: 3, experimentID: 'fakeExperiment3', state: 'started'},
      { simulationID: 4, experimentID: 'fakeExperiment4', state: 'stopped'},
      { simulationID: 5, experimentID: 'fakeExperiment5', state: 'initialized'},
      { simulationID: 6, experimentID: 'fakeExperiment6', state: 'created'},
    ];

    httpBackend.whenGET('views/common/main.html').respond({}); // Templates are requested via HTTP and processed locally.
    httpBackend.whenGET('http://bbpce016.epfl.ch:8080/simulation').respond(rootScope.simulations);
    httpBackend.whenPUT(/()/).respond(200);

    Gz3dViewCtrl = $controller('Gz3dViewCtrl', {
      $rootScope: rootScope,
      $scope: scope
    });

    // create mock for console
    spyOn(console, 'error');
  }));


  it('should retrieve the simulation list and extract the latest active simulation', function() {
      httpBackend.expectGET('http://bbpce016.epfl.ch:8080/simulation');

      httpBackend.flush();
      expect(scope.simulations.toString()).toEqual(rootScope.simulations.toString());
      expect(scope.activeSimulation.state).toBe('started');
      expect(scope.paused).toBe(false);
  });


  it('should attach a filter function and filter simulations according to state and index in the list', function() {
      httpBackend.flush();

      var getType = {};
      expect(getType.toString.call(scope.filterSimulations)).toBe('[object Function]');

      scope.filterSimulations('started', 'paused');
      expect(scope.activeSimulation.state).toBe('started');

      scope.simulations[2].state = 'started';
      scope.simulations[3].state = 'paused';

      scope.filterSimulations('started', 'paused');
      expect(scope.activeSimulation.state).toBe('paused');

      scope.filterSimulations('initialized');
      expect(scope.activeSimulation.simulationID).toBe(5);

      scope.filterSimulations('created');
      expect(scope.activeSimulation.simulationID).toBe(6);
  });


  it('should check for the currently hovered model', function () {
    scope.getModelUnderMouse = jasmine.createSpy('getModelUnderMouse').andReturn({name: 'some_name'});
    scope.updateHoverInfo();
    expect(scope.hoveredObject).toEqual('some_name');
  });

  it('should get the model under the current mouse position', function () {
    rootScope.scene.getRayCastModel = jasmine.createSpy('getRayCastModel');
    scope.getModelUnderMouse({clientX: 10, clientY: 10});
    expect(rootScope.scene.getRayCastModel).toHaveBeenCalled();
  });

  it('should set a color on the selected screen', function() {
    httpBackend.flush();
    // prepare the test: create mockups
    var entityToChange = { 'children' : [ { 'material' : {} } ] };
    var material = entityToChange.children[0].material;
    material.color = {};
    material.color.setHex = jasmine.createSpy('setHex');

    material.ambient = {};
    material.ambient.setHex = jasmine.createSpy('setHex');

    material.specular = {};
    material.specular.setHex = jasmine.createSpy('setHex');

    rootScope.scene.getByName = jasmine.createSpy('getByName').andReturn(entityToChange);

    // actual test
    var getType = {};
    expect(getType.toString.call(scope.setColorOnEntity)).toBe('[object Function]');

    // currently no element is selected, hence we want a console.error message
    scope.setColorOnEntity('value_does_not_matter_here');
    expect(console.error).toHaveBeenCalled();
    expect(console.error.callCount).toEqual(1);

    // pretend we selected a screen now
    scope.selectedEntity = { 'name' : 'left_vr_screen' };
    scope.setColorOnEntity('red');
    httpBackend.flush();
    expect(rootScope.scene.getByName).toHaveBeenCalledWith('left_vr_screen::body::screen_glass');

    var redHexValue = 0xff0000;
    expect(material.color.setHex).toHaveBeenCalledWith(redHexValue);
    expect(material.color.setHex.callCount).toEqual(1);
    expect(material.ambient.setHex).toHaveBeenCalledWith(redHexValue);
    expect(material.ambient.setHex.callCount).toEqual(1);
    expect(material.specular.setHex).toHaveBeenCalledWith(redHexValue);
    expect(material.specular.setHex.callCount).toEqual(1);

    // test RESTful call
    httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/' + scope.activeSimulation.simulationID + '/interaction',
      {'name':'LeftScreenToRed'});
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
    expect(rootScope.scene.radialMenu.showing).toBe(false);

    // now the true case
    show = true;
    event = { 'clientX' : 100, 'clientY': 200 };
    scope.isContextMenuShown = false;
    scope.getModelUnderMouse = function(event) { // jshint ignore:line
      return { 'name' : 'vr_screen_1' };
    };
    rootScope.scene.selectedEntity = { 'some_key' : 'some_value' };
    scope.toggleScreenChangeMenu(show, event);

    expect(scope.contextMenuTop).toEqual(event.clientY);
    expect(scope.contextMenuLeft).toEqual(event.clientX);
    expect(scope.selectedEntity).toEqual(rootScope.scene.selectedEntity);
  });

  it('should pause or start the simulation', function() {
      // test if object function exists
      httpBackend.flush();

      var getType = {};
      expect(getType.toString.call(scope.pauseSimulation)).toBe('[object Function]');

      scope.paused = true;
      scope.pauseSimulation();
      var id = scope.activeSimulation.simulationID;
      httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/' + id + '/state', {state: 'started'});

      httpBackend.flush();

      scope.paused = false;
      scope.pauseSimulation();
      httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/0/state', {state: 'paused'});
  });

  it('should set the real time', function() {
    var registeredCallbackFunction = simulationStatisticsMock.setRealTimeCallback.mostRecentCall.args[0];
    registeredCallbackFunction('01 23:45:67');
    expect(scope.realTimeText).toBe('01 23:45:67');
  });

  it('should set the simulation time', function() {
    var registeredCallbackFunction = simulationStatisticsMock.setSimulationTimeCallback.mostRecentCall.args[0];
    registeredCallbackFunction('98 76:54:32');
    expect(scope.simulationTimeText).toBe('98 76:54:32');
  });

  it('should set the paused variable', function() {
    var registeredCallbackFunction = simulationStatisticsMock.setPausedCallback.mostRecentCall.args[0];
    scope.paused = true;
    registeredCallbackFunction(false);
    expect(scope.paused).toBe(false);
    registeredCallbackFunction(true);
    expect(scope.paused).toBe(true);
  });

  it('should turn slider position into light intensities', function() {
      var getType = {};
      expect(getType.toString.call(scope.updateLightIntensities)).toBe('[object Function]');
      rootScope.scene.emitter.emit = jasmine.createSpy('emit');

      scope.updateLightIntensities(60.0);

      expect(rootScope.scene.emitter.emit).toHaveBeenCalledWith('lightChanged', (60 - 50) / 50.25);
      expect(rootScope.scene.emitter.emit.callCount).toEqual(1);
  });


  it('should emit light intensity changes', function() {
      rootScope.scene.scene = {};

      // three is loaded externally, jshint does not know that
      var light0 = new THREE.AmbientLight(); // jshint ignore:line
      var light1 = new THREE.PointLight(); // jshint ignore:line
      light1.name = 'left_spot';
      light1.initialIntensity = 0.5;
      var light2 = new THREE.PointLight();// jshint ignore:line
      light2.name = 'right_spot';
      light2.initialIntensity = 0.5;

      rootScope.scene.scene.__lights = [light1, light2];

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
      rootScope.scene.getByName = function(name) {
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

      //ToDo: implement Test
      //rootScope.scene.getLightType = GZ3D.Scene.prototype.getLightType;
      //rootScope.scene.intensityToAttenuation = GZ3D.Scene.prototype.intensityToAttenuation;

      //scope.incrementLightIntensities(-0.5);
      //
      //// test RESTful call
      ///*jshint camelcase: false */
      //httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/0/interaction/light', { name: 'left_spot', attenuation_constant: 0.2 });
      //httpBackend.flush();
      //httpBackend.expectPUT('http://bbpce016.epfl.ch:8080/simulation/0/interaction/light', { name: 'right_spot', attenuation_constant: 0.2 });
      ///*jshint camelcase: true */
  });

  it('should call the camera manipulation service methods correctly', function() {
    var right = 1, up = 2, forward = 3;
    scope.cameraTranslate(right, up, forward);
    expect(cameraManipulation.firstPersonTranslate).toHaveBeenCalledWith(right, up, forward);

    var degreeRight = 15, degreeUp = 30;
    scope.cameraRotate(degreeRight, degreeUp);
    expect(cameraManipulation.firstPersonRotate).toHaveBeenCalledWith(degreeRight, degreeUp);

    scope.cameraLookAtOrigin();
    expect(cameraManipulation.lookAtOrigin).toHaveBeenCalled();

    scope.cameraResetToInitPose();
    expect(cameraManipulation.resetToInitialPose).toHaveBeenCalled();
  });

});
