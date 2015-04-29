'use strict';

describe('Controller: Gz3dViewCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var Gz3dViewCtrl,
    scope,
    rootScope,
    httpBackend,
    timeout,
    window,
    document,
    cameraManipulation,
    splash,
    simulationService,
    simulationState,
    simulationControl,
    screenControl,
    roslib,
    splashInstance,
    exampleProgressData,
    assetLoadingSplash,
    simulations,
    hbpUserDirectory,
    fakeSimulationData,
    nrpBackendVersions,
    nrpFrontendVersion,
    STATE,
    UI;

  var simulationStatisticsMock = {};
  simulationStatisticsMock.setSimulationTimeCallback = jasmine.createSpy('setSimulationTimeCallback');
  simulationStatisticsMock.setRealTimeCallback = jasmine.createSpy('setRealTimeCallback');

  // Mock simulationServices
  var simulationServiceObject = {};
  simulationServiceObject.simulations = jasmine.createSpy('simulations');
  simulationServiceObject.getUserName = jasmine.createSpy('getUserName').andCallFake(function(profile) {
    return profile[Object.keys(profile)[0]].displayName; });
  var simulationServiceMock = jasmine.createSpy('simulationService').andReturn(simulationServiceObject);


  var simulationStateObject = {};
  simulationStateObject.update = jasmine.createSpy('update');
  simulationStateObject.state = jasmine.createSpy('state');
  var simulationStateMock = jasmine.createSpy('simulationState').andReturn(simulationStateObject);

  var simulationControlObject = {};
  simulationControlObject.simulation = jasmine.createSpy('simulation');
  var simulationControlMock = jasmine.createSpy('simulationControl').andReturn(simulationControlObject);

  var screenControlObject = {};
  screenControlObject.updateScreenColor = jasmine.createSpy('updateScreenColor');
  var screenControlMock = jasmine.createSpy('screenControl').andReturn(screenControlObject);

  var splashServiceMock = {};
  splashServiceMock.close = jasmine.createSpy('close');

  var gzInitializationMock = {};
  gzInitializationMock.Initialize = jasmine.createSpy('Initialize');
  gzInitializationMock.deInitialize = jasmine.createSpy('deInitialize');

  var cameraManipulationMock = {};
  cameraManipulationMock.firstPersonRotate = jasmine.createSpy('firstPersonRotate');
  cameraManipulationMock.firstPersonTranslate = jasmine.createSpy('firstPersonTranslate');
  cameraManipulationMock.lookAtOrigin = jasmine.createSpy('lookAtOrigin');
  cameraManipulationMock.resetToInitialPose = jasmine.createSpy('resetToInitialPose');

  var assetLoadingSplashMock = {};
  var assetLoadingSplashInstance = {};
  assetLoadingSplashInstance.close = jasmine.createSpy('close');
  assetLoadingSplashMock.open = jasmine.createSpy('open').andReturn(assetLoadingSplashInstance);
  assetLoadingSplashMock.close = jasmine.createSpy('close');

  var roslibMock = {};
  var returnedConnectionObject = {};
  returnedConnectionObject.unsubscribe = jasmine.createSpy('unsubscribe');
  returnedConnectionObject.subscribe = jasmine.createSpy('subscribe');
  var rosConnectionObject = {};
  rosConnectionObject.close = jasmine.createSpy('close');
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn(rosConnectionObject);
  roslibMock.createStringTopic = jasmine.createSpy('createStringTopic').andReturn(returnedConnectionObject);

  var hbpUserDirectoryPromiseObject = {};
  hbpUserDirectoryPromiseObject.then = jasmine.createSpy('then');
  var hbpUserDirectoryPromiseObject2 = {};
  hbpUserDirectoryPromiseObject2.then = jasmine.createSpy('then');
  var hbpUserDirectoryMock = {};
  hbpUserDirectoryMock.getCurrentUser = jasmine.createSpy('getCurrentUser').andReturn(hbpUserDirectoryPromiseObject);
  hbpUserDirectoryMock.get = jasmine.createSpy('get').andReturn(hbpUserDirectoryPromiseObject2);

  var nrpBackendVersionsObject = {};
  nrpBackendVersionsObject.get = jasmine.createSpy('get');
  var nrpBackendVersionsMock = jasmine.createSpy('nrpBackendVersions').andReturn(nrpBackendVersionsObject);
  var nrpFrontendVersionMock = {};
  nrpFrontendVersionMock.get = jasmine.createSpy('get');

  var currentUserInfo1234 = {
    displayName: 'John Does',
    id: '1234'
  };

  var currentUserInfo1234Hash = {
    '1234': {
      displayName: 'John Does'
    }
  };

  var otherUserInfo4321 = {
    displayName: 'John Dont',
    id: '4321'
  };

  var stateParams = {
    serverID : 'bbpce016',
    simulationID : 'mocked_simulation_id'
  };

  beforeEach(module(function ($provide) {
    $provide.value('simulationStatistics', simulationStatisticsMock);
    $provide.value('gzInitialization', gzInitializationMock);
    $provide.value('cameraManipulation', cameraManipulationMock);
    $provide.value('splash', splashServiceMock);
    $provide.value('assetLoadingSplash', assetLoadingSplashMock);
    $provide.value('roslib', roslibMock);
    $provide.value('simulationService', simulationServiceMock);
    $provide.value('simulationState', simulationStateMock);
    $provide.value('simulationControl', simulationControlMock);
    $provide.value('screenControl', screenControlMock);
    $provide.value('$stateParams', stateParams);
    $provide.value('hbpUserDirectory', hbpUserDirectoryMock);
    $provide.value('nrpBackendVersions', nrpBackendVersionsMock);
    $provide.value('nrpFrontendVersion', nrpFrontendVersionMock);
    simulationStatisticsMock.setSimulationTimeCallback.reset();
    simulationStatisticsMock.setRealTimeCallback.reset();
    simulationServiceObject.simulations.reset();
    simulationServiceObject.getUserName.reset();
    simulationServiceMock.reset();
    simulationStateObject.update.reset();
    simulationStateObject.state.reset();
    simulationStateMock.reset();
    simulationControlObject.simulation.reset();
    simulationControlMock.reset();
    screenControlObject.updateScreenColor.reset();
    screenControlMock.reset();
    splashServiceMock.close.reset();
    gzInitializationMock.Initialize.reset();
    gzInitializationMock.deInitialize.reset();
    cameraManipulationMock.firstPersonRotate.reset();
    cameraManipulationMock.firstPersonTranslate.reset();
    cameraManipulationMock.lookAtOrigin.reset();
    cameraManipulationMock.resetToInitialPose.reset();
    assetLoadingSplashInstance.close.reset();
    assetLoadingSplashMock.open.reset();
    assetLoadingSplashMock.close.reset();
    returnedConnectionObject.unsubscribe.reset();
    returnedConnectionObject.subscribe.reset();
    rosConnectionObject.close.reset();
    roslibMock.getOrCreateConnectionTo.reset();
    roslibMock.createStringTopic.reset();
    hbpUserDirectoryPromiseObject.then.reset();
    hbpUserDirectoryPromiseObject2.then.reset();
    hbpUserDirectoryMock.getCurrentUser.reset();
    hbpUserDirectoryMock.get.reset();
    nrpBackendVersionsObject.get.reset();
    nrpBackendVersionsMock.reset();
    nrpFrontendVersionMock.get.reset();
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _hbpUserDirectory_,
                              $timeout,
                              _$httpBackend_,
                              _$window_,
                              _$document_,
                              _cameraManipulation_,
                              _splash_,
                              _assetLoadingSplash_,
                              _roslib_,
                              _simulationService_,
                              _simulationState_,
                              _simulationControl_,
                              _screenControl_,
                              _$stateParams_,
                              _nrpBackendVersions_,
                              _nrpFrontendVersion_,
                              _STATE_,
                              _UI_) {
    rootScope = $rootScope;
    scope = $rootScope.$new();
    hbpUserDirectory = _hbpUserDirectory_;
    timeout = $timeout;
    httpBackend = _$httpBackend_;
    window = _$window_;
    document = _$document_;
    cameraManipulation = _cameraManipulation_;
    splash = _splash_;
    assetLoadingSplash = _assetLoadingSplash_;
    roslib = _roslib_;
    simulationService = _simulationService_;
    simulationState = _simulationState_;
    simulationControl = _simulationControl_;
    screenControl = _screenControl_;
    stateParams = _$stateParams_;
    nrpBackendVersions = _nrpBackendVersions_;
    nrpFrontendVersion = _nrpFrontendVersion_;
    STATE = _STATE_;
    UI = _UI_;

    rootScope.scene = {};
    rootScope.scene.radialMenu = {};
    rootScope.scene.radialMenu.showing = false;
    rootScope.scene.modelManipulator = {};
    rootScope.scene.modelManipulator.pickerNames = '';
    rootScope.scene.emitter = {};
    rootScope.scene.controls = {};
    rootScope.scene.controls.onMouseDownManipulator = jasmine.createSpy('onMouseDownManipulator');
    rootScope.scene.controls.onMouseUpManipulator = jasmine.createSpy('onMouseUpManipulator');
    rootScope.gui = {};
    rootScope.gui.emitter = {};
    rootScope.iface = {};
    rootScope.iface.setAssetProgressCallback = jasmine.createSpy('setAssetProgressCallback');
    rootScope.iface.webSocket = {};
    rootScope.iface.webSocket.close = jasmine.createSpy('close');

    httpBackend.whenGET('views/common/home.html').respond({}); // Templates are requested via HTTP and processed locally.
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

    exampleProgressData = [
      {id: 'test::id::mesh1', url: 'http://some_fake_url.com:1234/bla1.mesh', progress: 0, total: 1, done: false},
      {id: 'test::id::mesh2', url: 'http://some_fake_url.com:1234/bla2.mesh', progress: 700, total: 1000, done: false},
      {id: 'test::id::mesh3', url: 'http://some_fake_url.com:1234/bla3.mesh', progress: 200, total: 200, done: true}
    ];
    assetLoadingSplash.setProgress = jasmine.createSpy('setProgress');

    splashInstance = {                    // Create a mock object using spies
      close: jasmine.createSpy('modalInstance.close'),
      result: {
        then: jasmine.createSpy('modalInstance.result.then')
      }
    };

    splashServiceMock.open = jasmine.createSpy('open').andReturn(splashInstance);
    splashServiceMock.setMessage = jasmine.createSpy('setMessage');
    splashServiceMock.close = jasmine.createSpy('close');

    scope.activeSimulation = undefined;

    fakeSimulationData = {
      owner: '1234',
      state: STATE.INITIALIZED,
      simulationID: 1,
      experimentID: 'FakeExperiment'
    };

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  it('should set the assetLoadingSplash callback in gz3d', function(){
    expect(scope.assetLoadingSplashScreen).toEqual(assetLoadingSplashInstance);
    expect(assetLoadingSplash.open).toHaveBeenCalled();
    expect(rootScope.iface.setAssetProgressCallback).toHaveBeenCalled();
    rootScope.iface.setAssetProgressCallback.mostRecentCall.args[0](exampleProgressData);
    expect(assetLoadingSplash.setProgress).toHaveBeenCalledWith(exampleProgressData);
  });

  it('should set the current User and checks if isOwner (1)', function() {
    scope.isOwner = false;
    hbpUserDirectoryPromiseObject.then.mostRecentCall.args[0](currentUserInfo1234);
    expect(scope.userName).toEqual(currentUserInfo1234.displayName);
    expect(scope.userID).toEqual(currentUserInfo1234.id);
    simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
    expect(scope.ownerID).toEqual(fakeSimulationData.owner);
    expect(scope.isOwner).toBe(true);

    hbpUserDirectoryPromiseObject2.then.mostRecentCall.args[0](currentUserInfo1234Hash);
    expect(scope.owner).toEqual(currentUserInfo1234.displayName);
  });

  it('should set the current User and checks if isOwner (2)', function() {
    scope.isOwner = true;
    hbpUserDirectoryPromiseObject.then.mostRecentCall.args[0](otherUserInfo4321);
    expect(scope.userName).toEqual(otherUserInfo4321.displayName);
    expect(scope.userID).toEqual(otherUserInfo4321.id);
    simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
    expect(scope.ownerID).toEqual(fakeSimulationData.owner);
    expect(scope.isOwner).toBe(false);
  });

  //it('should show the camera translate help div correctly', function() {
  //  expect(scope.showKeyboardControlInfoDiv).toBe(false);
  //  //var right = 1, up = 2, forward = 3;
  //  //scope.cameraTranslate(right, up, forward);
  //  expect(scope.showKeyboardControlInfoDiv).toBe(true);
  //  timeout.flush();
  //  expect(scope.showKeyboardControlInfoDiv).toBe(false);
  //});

  it('should check that updateSimulation sets the scope\'s state', function () {
    //Ignore this warning because of the sim_id
    /*jshint camelcase: false */

    // first test whether the state given as a parameter is passed
    scope.updateSimulation(STATE.STARTED);
    expect(simulationStateObject.update).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'},
      {state: STATE.STARTED}, jasmine.any(Function), jasmine.any(Function));

    // second test whether the callback function does what it should do
    scope.state = STATE.UNDEFINED;
    simulationStateObject.update.mostRecentCall.args[2]({state: STATE.PAUSED});
    expect(scope.state).toBe(STATE.PAUSED);
  });

  it('should make the current state available and call registerForStatusInformation', function() {
    spyOn(scope, 'registerForStatusInformation');
    scope.state = STATE.UNDEFINED;
    simulationStateObject.state.mostRecentCall.args[1]({state: STATE.STARTED});
    expect(scope.state).toEqual(STATE.STARTED);
    expect(scope.registerForStatusInformation).toHaveBeenCalled();
  });

  it('should test registerForStatusInformation', function() {
    scope.registerForStatusInformation();
    expect(roslib.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslib.createStringTopic).toHaveBeenCalled();
    expect(scope.rosConnection).toBeDefined();
    expect(scope.statusListener).toBeDefined();
    expect(returnedConnectionObject.subscribe).toHaveBeenCalled();
    var callbackFunction = returnedConnectionObject.subscribe.mostRecentCall.args[0];
    // test state change
    scope.state = STATE.STARTED;
    callbackFunction({ data: '{"state": "'+STATE.STOPPED+'"}'});
    expect(scope.state).toBe(STATE.STOPPED);
    // test open splash screen with callbackOnClose
    scope.state = STATE.STOPPED;
    callbackFunction({ data: '{"progress": { "block_ui": "False", "task":"Task1", "subtask":"Subtask1"}}'});
    expect(splash.open).toHaveBeenCalled();
    var callbackOnClose = splash.open.mostRecentCall.args[1];
    expect(callbackOnClose).toBeDefined();
    expect(splash.setMessage).toHaveBeenCalledWith({ headline: 'Task1', subHeadline: 'Subtask1' });
    // test open splash screen without callbackOnClose
    scope.splashScreen = undefined;
    scope.state = STATE.INITIALIZED;
    callbackFunction({ data: '{"progress": { "block_ui": "False", "task":"Task1", "subtask":"Subtask1"}}'});
    callbackOnClose = splash.open.mostRecentCall.args[1];
    expect(callbackOnClose).not.toBeDefined();
    // test "done" without close
    splash.showButton = true;
    splash.spin = true;
    callbackFunction({ data: '{"progress": { "block_ui": "False", "done":"True" }}'});
    expect(splash.setMessage).toHaveBeenCalledWith({ headline: 'Finished' });
    expect(splash.close).not.toHaveBeenCalled();
    expect(splash.spin).toBe(false);
    // test "done" in IF path (with close)
    scope.state = STATE.STOPPED;
    scope.splashScreen = undefined;
    splash.close.reset();
    splash.showButton = false;
    callbackFunction({ data: '{"progress": { "block_ui": "True", "done":"True" }}'});
    expect(splash.close).toHaveBeenCalled();
    // test "timeout"
    callbackFunction({ data: '{"timeout": 264}'});
    expect(scope.simTimeoutText).toBe(264);
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
    rootScope.scene.getByName = jasmine.createSpy('getByName').andReturn(entityToChange);

    // actual test
    // currently no element is selected, hence we want a console.error message
    scope.setColorOnEntity('value_does_not_matter_here');
    expect(console.error).toHaveBeenCalled();
    expect(console.error.callCount).toEqual(1);

    // pretend we selected a screen now
    scope.selectedEntity = { 'name' : 'left_vr_screen' };
    scope.setColorOnEntity('red');

    expect(screenControl).toHaveBeenCalledWith('http://bbpce016.epfl.ch:8080');
    expect(screenControlObject.updateScreenColor).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'}, {'name':'LeftScreenToRed'});
  });

  it('should toggle a menu to be able to change the screen color', function() {
    // actual test
    expect(scope.toggleScreenChangeMenu).toEqual(jasmine.any(Function));

    // first the false case
    var show = false;
    var event = {};
    scope.isOwner = true;
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

    // now if you are not the owner
    scope.isOwner = false;
    scope.show = true;
    scope.isContextMenuShown = false;
    spyOn(scope, 'getModelUnderMouse');
    scope.toggleScreenChangeMenu(show, event);
    expect(scope.getModelUnderMouse).not.toHaveBeenCalled();
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

  // Commented out for the moment. This will be redesigned in the next sprint
  //it('should call the camera manipulation service methods correctly', function() {
  //  var right = 1, up = 2, forward = 3;
  //  scope.cameraTranslate(right, up, forward);
  //  expect(cameraManipulation.firstPersonTranslate).toHaveBeenCalledWith(right, up, forward);
  //
  //  var degreeRight = 15, degreeUp = 30;
  //  scope.cameraRotate(degreeRight, degreeUp);
  //  expect(cameraManipulation.firstPersonRotate).toHaveBeenCalledWith(degreeRight, degreeUp);
  //
  //  scope.cameraLookAtOrigin();
  //  expect(cameraManipulation.lookAtOrigin).toHaveBeenCalled();
  //
  //  scope.cameraResetToInitPose();
  //  expect(cameraManipulation.resetToInitialPose).toHaveBeenCalled();
  //});

  it('should change the camera pose correctly', function() {
    scope.requestMove('moveForward');
    expect(rootScope.scene.controls.onMouseDownManipulator).toHaveBeenCalledWith('moveForward');
    scope.releaseMove('moveForward');
    expect(rootScope.scene.controls.onMouseUpManipulator).toHaveBeenCalledWith('moveForward');
  });


  it('should toggle the showSpikeTrain variable', function() {
    expect(scope.showSpikeTrain).toBe(false);
    scope.toggleSpikeTrain();
    expect(scope.showSpikeTrain).toBe(true);
  });

  it('should toggle the help mode variable', function() {
    expect(scope.helpModeActivated).toBe(false);
    scope.toggleHelpMode();
    expect(scope.helpModeActivated).toBe(true);
  });

  it('should call nrpBackendVersions.get and set scope.versions with retrieved back-end versions', function() {
    expect(nrpBackendVersions.callCount).toBe(1);
    expect(nrpBackendVersions.mostRecentCall.args[0].indexOf(stateParams.serverID) > -1).toBe(true);
    expect(nrpBackendVersionsObject.get.mostRecentCall.args[0]).toEqual(jasmine.any(Function));
    expect(nrpBackendVersionsObject.get.callCount).toBe(1);
    //Ignore this warning because of hbp_nrp_cle and hbp_nrp_backend
    /*jshint camelcase: false */

    var backendData = {hbp_nrp_cle: '0.0.5.dev0', hbp_nrp_backend: '0.0.4'};
    var frontendData = { hbp_nrp_esv: '0.0.1' };
    var dataResult = angular.extend(frontendData, backendData);
    nrpFrontendVersion.get.mostRecentCall.args[0](frontendData);
    nrpBackendVersionsObject.get.mostRecentCall.args[0](backendData);
    expect(scope.versions).toEqual(dataResult);
  });

  it('should close all connections and splash screens on $destroy', function() {
    spyOn(window, 'stop');
    scope.registerForStatusInformation();
    scope.splashScreen = splashInstance;

    scope.$destroy();

    expect(splash.close).toHaveBeenCalled();
    expect(assetLoadingSplash.close).toHaveBeenCalled();
    expect(scope.statusListener.unsubscribe).toHaveBeenCalled();
    expect(scope.rosConnection.close).toHaveBeenCalled();
    expect(scope.iface.webSocket.close).toHaveBeenCalled();
    expect(gzInitializationMock.deInitialize).toHaveBeenCalled();
    expect(window.stop).toHaveBeenCalled();
  });

  it('should call execCommand on destroy', function() {
    // Fake IE browser behavior
    // The stop() method is not supported by Internet Explorer
    // https://developer.mozilla.org/de/docs/Web/API/Window/stop
    document.execCommand = jasmine.createSpy('execCommand');
    window.stop = undefined;
    scope.$destroy();
    expect(document.execCommand).toHaveBeenCalled();
  });

  it('should do nothing on $destroy when all is undefined', function() {
    scope.assetLoadingSplashScreen = undefined;
    scope.iface.webSocket = undefined;

    scope.$destroy();

    expect(scope.splashScreen).not.toBeDefined();
    expect(scope.assetLoadingSplashScreen).not.toBeDefined();
    expect(scope.statusListener).not.toBeDefined();
    expect(scope.rosConnection).not.toBeDefined();
    expect(scope.iface.webSocket).not.toBeDefined();
  });

  it('should show the help text correctly', function() {
    scope.helpText[UI.PLAY_BUTTON] = 'FakeText';
    scope.helpModeActivated = false;
    scope.toggleHelpMode();

    expect(scope.helpModeActivated).toBe(true);
    expect(scope.helpDescription).toBe('');
    expect(scope.currentSelectedUIElement).toBe(UI.UNDEFINED);

    scope.help(UI.PLAY_BUTTON);

    expect(scope.currentSelectedUIElement).toBe(UI.PLAY_BUTTON);
    expect(scope.helpDescription).toBe('FakeText');

    scope.help(UI.PLAY_BUTTON);
    expect(scope.currentSelectedUIElement).toBe(UI.UNDEFINED);
    expect(scope.helpDescription).toBe('');
  });

  });
