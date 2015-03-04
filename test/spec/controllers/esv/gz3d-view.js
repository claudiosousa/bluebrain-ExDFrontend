'use strict';

describe('Controller: Gz3dViewCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var Gz3dViewCtrl,
    scope,
    rootScope,
    httpBackend,
    cameraManipulation,
    splash,
    simulationService,
    simulationState,
    screenControl,
    roslib,
    splashInstance,
    splashInstance2,
    simulations,
    STATE;

  var simulationStatisticsMock = {};
  simulationStatisticsMock.setSimulationTimeCallback = jasmine.createSpy('setSimulationTimeCallback');
  simulationStatisticsMock.setRealTimeCallback = jasmine.createSpy('setRealTimeCallback');

  // Mock simulationServices
  var simulationServiceObject = {};
  simulationServiceObject.simulations = jasmine.createSpy('simulations');
  var simulationServiceMock = jasmine.createSpy('simulationService').andReturn(simulationServiceObject);

  var simulationStateObject = {};
  simulationStateObject.update = jasmine.createSpy('update');
  simulationStateObject.state = jasmine.createSpy('state');
  var simulationStateMock = jasmine.createSpy('simulationState').andReturn(simulationStateObject);

  var screenControlObject = {};
  screenControlObject.updateScreenColor = jasmine.createSpy('updateScreenColor');
  var screenControlMock = jasmine.createSpy('screenControl').andReturn(screenControlObject);

  var splashServiceMock = {};

  var gzInitializationMock = {};

  var cameraManipulationMock = {};
  cameraManipulationMock.firstPersonRotate = jasmine.createSpy('firstPersonRotate');
  cameraManipulationMock.firstPersonTranslate = jasmine.createSpy('firstPersonTranslate');
  cameraManipulationMock.lookAtOrigin = jasmine.createSpy('lookAtOrigin');
  cameraManipulationMock.resetToInitialPose = jasmine.createSpy('resetToInitialPose');

  var stateParams = {
    serverID : 'bbpce016',
    simulationID : 'mocked_simulation_id'
  };

  beforeEach(module(function ($provide) {
    $provide.value('simulationStatistics', simulationStatisticsMock);
    $provide.value('gzInitialization', gzInitializationMock);
    $provide.value('cameraManipulation', cameraManipulationMock);
    $provide.value('splash', splashServiceMock);
    $provide.value('roslib', roslib);
    $provide.value('simulationService', simulationServiceMock);
    $provide.value('simulationState', simulationStateMock);
    $provide.value('screenControl', screenControlMock);
    $provide.value('$stateParams', stateParams);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$httpBackend_,
                              _cameraManipulation_,
                              _splash_,
                              _roslib_,
                              _simulationService_,
                              _simulationState_,
                              _screenControl_,
                              _$stateParams_,
                              _STATE_) {
    rootScope = $rootScope;
    scope = $rootScope.$new();
    httpBackend = _$httpBackend_;
    cameraManipulation = _cameraManipulation_;
    splash = _splash_;
    roslib = _roslib_;
    simulationService = _simulationService_;
    simulationState = _simulationState_;
    screenControl = _screenControl_;
    stateParams = _$stateParams_;
    STATE = _STATE_;

    rootScope.scene = {};
    rootScope.scene.radialMenu = {};
    rootScope.scene.radialMenu.showing = false;
    rootScope.scene.modelManipulator = {};
    rootScope.scene.modelManipulator.pickerNames = '';
    rootScope.scene.emitter = {};
    rootScope.gui = {};
    rootScope.gui.emitter = {};

    httpBackend.whenGET('views/common/main.html').respond({}); // Templates are requested via HTTP and processed locally.
    httpBackend.whenPUT(/()/).respond(200);

    Gz3dViewCtrl = $controller('Gz3dViewCtrl', {
      $rootScope: rootScope,
      $scope: scope
    });

    simulations = [
      { simulationID: 0, experimentID: 'fakeExperiment0', state: STATE.CREATED},
      { simulationID: 1, experimentID: 'fakeExperiment1', state: STATE.INITIALIZED},
      { simulationID: 2, experimentID: 'fakeExperiment2', state: STATE.PAUSED},
      { simulationID: 3, experimentID: 'fakeExperiment3', state: STATE.STARTED},
      { simulationID: 4, experimentID: 'fakeExperiment4', state: STATE.STOPPED},
      { simulationID: 5, experimentID: 'fakeExperiment5', state: STATE.INITIALIZED},
      { simulationID: 6, experimentID: 'fakeExperiment6', state: STATE.CREATED}
    ];
    simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(simulations[3]);

    splashInstance = {                    // Create a mock object using spies
      close: jasmine.createSpy('modalInstance.close'),
      result: {
        then: jasmine.createSpy('modalInstance.result.then')
      }
    };

    splashInstance2 = {};
    splashServiceMock.open = jasmine.createSpy('open').andReturn(splashInstance);
    splashServiceMock.setHeadline = jasmine.createSpy('setHeadline');

    roslib = {};
    roslib.createConnectionTo = jasmine.createSpy('createConnectionTo');
    roslib.createStringTopic = jasmine.createSpy('createStringTopic').andReturn({
      unsubscribe: function () {},
      subscribe: function () {}
    });

    scope.activeSimulation = undefined;

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  //it('should retrieve the simulation list and extract the latest active simulation (1)', function() {
  //    expect(simulationService).toHaveBeenCalledWith('http://bbpce016.epfl.ch:8080');
  //    expect(simulationServiceObject.simulations).toHaveBeenCalled();
  //
  //    spyOn(scope, 'registerForStatusInformation');
  //    var argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
  //    argumentFunction(simulations);
  //    //expect(scope.activeSimulation.state).toBe(STATE.STARTED);
  //    expect(scope.registerForStatusInformation).toHaveBeenCalled();
  //});

  //it('should retrieve the simulation list and extract the latest active simulation (2)', function() {
  //  expect(simulationService).toHaveBeenCalledWith('http://bbpce016.epfl.ch:8080');
  //  expect(simulationServiceObject.simulations).toHaveBeenCalled();
  //
  //  spyOn(scope, 'registerForStatusInformation');
  //
  //  simulationServiceObject.getActiveSimulation = jasmine.createSpy('getActiveSimulation').andReturn(undefined);
  //  var argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
  //  argumentFunction([{ simulationID: 4, experimentID: 'fakeExperiment4', state: STATE.STOPPED}]);
  //  expect(scope.activeSimulation).toBe(undefined);
  //  expect(scope.registerForStatusInformation).not.toHaveBeenCalled();
  //});

  // TODO(Stefan) This can be removed since the method isVisible() does not exist anymore!
  //it('should attach a visiblity checker used for every toolbar item', function() {
  //    scope.activeSimulation = undefined;
  //    var argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
  //    argumentFunction(simulations);
  //    expect(scope.activeSimulation).toEqual(simulations[3]);
  //
  //    expect(scope.isVisible).toEqual(jasmine.any(Function));
  //
  //    expect(scope.isVisible('cog')).toBe(false);
  //    expect(scope.isVisible('play')).toBe(false);
  //    expect(scope.isVisible('pause')).toBe(true);
  //    expect(scope.isVisible('stop')).toBe(true);
  //    expect(scope.isVisible('display')).toBe(true);
  //
  //    scope.activeSimulation.state = STATE.PAUSED;
  //    expect(scope.isVisible('cog')).toBe(false);
  //    expect(scope.isVisible('play')).toBe(true);
  //    expect(scope.isVisible('pause')).toBe(false);
  //    expect(scope.isVisible('stop')).toBe(true);
  //    expect(scope.isVisible('display')).toBe(true);
  //
  //    scope.activeSimulation.state = STATE.INITIALIZED;
  //    expect(scope.isVisible('cog')).toBe(false);
  //    expect(scope.isVisible('play')).toBe(true);
  //    expect(scope.isVisible('pause')).toBe(false);
  //    expect(scope.isVisible('stop')).toBe(false);
  //    expect(scope.isVisible('display')).toBe(true);
  //
  //    scope.activeSimulation.state = STATE.CREATED;
  //    expect(scope.isVisible('cog')).toBe(false);
  //    expect(scope.isVisible('play')).toBe(false);
  //    expect(scope.isVisible('pause')).toBe(false);
  //    expect(scope.isVisible('stop')).toBe(false);
  //    expect(scope.isVisible('display')).toBe(false);
  //
  //    scope.activeSimulation.state = STATE.STOPPED;
  //    expect(scope.isVisible('cog')).toBe(false);
  //    expect(scope.isVisible('play')).toBe(false);
  //    expect(scope.isVisible('pause')).toBe(false);
  //    expect(scope.isVisible('stop')).toBe(false);
  //    expect(scope.isVisible('display')).toBe(false);
  //
  //
  //    scope.activeSimulation.state = undefined;
  //    expect(scope.isVisible('cog')).toBe(false);
  //    expect(scope.isVisible('play')).toBe(false);
  //    expect(scope.isVisible('pause')).toBe(false);
  //    expect(scope.isVisible('stop')).toBe(false);
  //    expect(scope.isVisible('display')).toBe(false);
  //    expect(console.error.callCount).toEqual(5);
  //
  //    scope.activeSimulation = undefined;
  //    expect(scope.isVisible('cog')).toBe(true);
  //    expect(scope.isVisible('play')).toBe(false);
  //    expect(scope.isVisible('pause')).toBe(false);
  //    expect(scope.isVisible('stop')).toBe(false);
  //    expect(scope.isVisible('display')).toBe(false);
  //});

  it('should check that updateSimulation sets the scope\'s state', function () {
    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */

    // first test whether the state given as a parameter is passed
    scope.updateSimulation(STATE.STARTED);
    expect(simulationStateObject.update).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'}, {state: STATE.STARTED}, jasmine.any(Function));

    // second test whether the callback function does what it should do
    scope.state = STATE.UNDEFINED;
    simulationStateObject.update.mostRecentCall.args[2]({state: STATE.PAUSED});
    expect(scope.state).toBe(STATE.PAUSED);
  });

  //it('should change the state of the simulation', function() {
  //    //Ignore this warning because of the sim_id
  //    /*jshint camelcase: false */
  //    scope.activeSimulation = simulations[3];
  //    var id = scope.activeSimulation.simulationID;
  //
  //    scope.updateSimulation(STATE.PAUSED);
  //    expect(simulationState).toHaveBeenCalledWith('http://bbpce016.epfl.ch:8080');
  //    expect(simulationStateObject.update).toHaveBeenCalledWith({sim_id: id}, {state: STATE.PAUSED}, jasmine.any(Function));
  //    var argumentFunction = simulationStateObject.update.mostRecentCall.args[2];
  //    argumentFunction(simulations);
  //    expect(simulationService).toHaveBeenCalledWith('http://bbpce016.epfl.ch:8080');
  //    expect(simulationServiceObject.simulations).toHaveBeenCalledWith(jasmine.any(Function));
  //
  //    scope.activeSimulation = undefined;
  //    argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
  //    argumentFunction(simulations);
  //    expect(simulationServiceObject.getActiveSimulation).toHaveBeenCalledWith(simulations);
  //    expect(scope.activeSimulation).toEqual(simulations[3]);
  //});

  //it('should test the splash screen settings of updateSimulation (1)', function() {
  //    //Ignore this warning because of the sim_id
  //    /*jshint camelcase: false */
  //    scope.activeSimulation = simulations[3];
  //    var id = scope.activeSimulation.simulationID;
  //
  //    scope.updateSimulation(STATE.STARTED);
  //    expect(simulationState).toHaveBeenCalledWith('http://bbpce016.epfl.ch:8080');
  //    expect(simulationStateObject.update).toHaveBeenCalledWith({sim_id: id}, {state: STATE.STARTED}, jasmine.any(Function));
  //
  //    scope.updateSimulation(STATE.PAUSED);
  //    expect(splash.setHeadline).not.toHaveBeenCalled();
  //
  //    spyOn(scope, 'registerForStatusInformation');
  //    scope.splashScreen = undefined;
  //    scope.updateSimulation(STATE.INITIALIZED);
  //    expect(splash.setHeadline).toHaveBeenCalledWith('Initializing simulation');
  //    expect(splash.open).toHaveBeenCalled();
  //    expect(scope.splashScreen).toEqual(splashInstance);
  //    expect(scope.registerForStatusInformation).toHaveBeenCalled();
  //});

  //it('should test the splash screen settings of updateSimulation (2)', function() {
  //    spyOn(scope, 'registerForStatusInformation');
  //    scope.activeSimulation = simulations[3];
  //    scope.splashScreen = splashInstance2;
  //    scope.updateSimulation(STATE.INITIALIZED);
  //    expect(splash.setHeadline).toHaveBeenCalledWith('Initializing simulation');
  //    expect(splash.open).not.toHaveBeenCalled();
  //    expect(scope.splashScreen).toEqual(splashInstance2);
  //    expect(scope.registerForStatusInformation).toHaveBeenCalled();
  //});

  //  it('should create a new simulation', function() {
  //    var argumentFunction = simulationServiceObject.simulations.mostRecentCall.args[0];
  //    argumentFunction(simulations);
  //
  //    var experimentID = 'fakeExperiment';
  //    scope.newSimulation(experimentID);
  //    scope.activeSimulation = undefined;
  //    httpBackend.expectPOST('http://bbpce016.epfl.ch:8080/simulation', {experimentID: experimentID}).
  //      respond(201, { simulationID: 7, experimentID: 'fakeExperiment', state: STATE.CREATED});
  //
  //    httpBackend.flush();
  //    expect(scope.activeSimulation).toBeDefined();
  //    expect(scope.activeSimulation.state).toBe(STATE.CREATED);
  //});

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
    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */
    scope.activeSimulation = simulations[3];

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
    expect(scope.setColorOnEntity).toEqual(jasmine.any(Function));

    // currently no element is selected, hence we want a console.error message
    scope.setColorOnEntity('value_does_not_matter_here');
    expect(console.error).toHaveBeenCalled();
    expect(console.error.callCount).toEqual(1);

    // pretend we selected a screen now
    scope.selectedEntity = { 'name' : 'left_vr_screen' };
    scope.setColorOnEntity('red');
    expect(rootScope.scene.getByName).toHaveBeenCalledWith('left_vr_screen::body::screen_glass');

    var redHexValue = 0xff0000;
    expect(material.color.setHex).toHaveBeenCalledWith(redHexValue);
    expect(material.color.setHex.callCount).toEqual(1);
    expect(material.ambient.setHex).toHaveBeenCalledWith(redHexValue);
    expect(material.ambient.setHex.callCount).toEqual(1);
    expect(material.specular.setHex).toHaveBeenCalledWith(redHexValue);
    expect(material.specular.setHex.callCount).toEqual(1);

    expect(screenControl).toHaveBeenCalledWith('http://bbpce016.epfl.ch:8080');
    expect(screenControlObject.updateScreenColor).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'}, {'name':'LeftScreenToRed'});
  });

  it('should toggle a menu to be able to change the screen color', function() {
    // actual test
    expect(scope.toggleScreenChangeMenu).toEqual(jasmine.any(Function));

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

  it('should turn slider position into light intensities', function() {
      expect(scope.updateLightIntensities).toEqual(jasmine.any(Function));
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

      //TODO: complete test implementation
      //rootScope.scene.getLightType = GZ3D.Scene.prototype.getLightType;
      //rootScope.scene.intensityToAttenuation = GZ3D.Scene.prototype.intensityToAttenuation;
      //scope.incrementLightIntensities(-0.5);
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
