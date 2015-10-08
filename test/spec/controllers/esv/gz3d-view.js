'use strict';

describe('Controller: Gz3dViewCtrl', function () {
  var Gz3dViewCtrl,
      controller,
      scope,
      rootScope,
      httpBackend,
      timeout,
      window,
      document,
      location,
      cameraManipulation,
      splash,
      simulationService,
      simulationState,
      simulationControl,
      stateService,
      contextMenuState,
      screenControl,
      splashInstance,
      exampleProgressData,
      assetLoadingSplash,
      simulations,
      hbpUserDirectory,
      fakeSimulationData,
      nrpBackendVersions,
      nrpFrontendVersion,
      STATE,
      UI,
      OPERATION_MODE,
      serverError,
      panels,
      gz3d,
      experimentSimulationService;

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

  var timeoutMock = jasmine.createSpy('$timeout');
  var serverErrorMock = jasmine.createSpy('serverError');
  var angularPanelsMock = {open: jasmine.createSpy('open')};

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
    mode : undefined,
    serverID : 'bbpce016',
    simulationID : 'mocked_simulation_id'
  };

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('simulationStateServices', function ($provide) {
    var InitializeSpy = jasmine.createSpy('Initialize');
    var startListeningForStatusInformationSpy = jasmine.createSpy('startListeningForStatusInformation');
    var stopListeningForStatusInformationSpy = jasmine.createSpy('stopListeningForStatusInformation');
    var addStateCallbackSpy = jasmine.createSpy('addStateCallback');
    var removeStateCallbackSpy = jasmine.createSpy('removeStateCallback');
    var addMessageCallbackSpy = jasmine.createSpy('addMessageCallback');
    var removeMessageCallbackSpy = jasmine.createSpy('removeMessageCallback');
    var getCurrentStateSpy = jasmine.createSpy('getCurrentState');
    var setCurrentStateSpy = jasmine.createSpy('setCurrentState');
    var ensureStateBeforeExecutingSpy = jasmine.createSpy('ensureStateBeforeExecuting');
    var getThenSpy = jasmine.createSpy('then');
    var setThenSpy = jasmine.createSpy('then');
    var setCatchSpy = jasmine.createSpy('catch');
    var localCurrentState;
    var localStatePending = false;

    getCurrentStateSpy.andCallFake(function () {
      return { then: getThenSpy.andCallFake(function (f) { f(); }) };
    });

    setCurrentStateSpy.andCallFake(function (s) {
      localCurrentState = s;
      return {
        then: setThenSpy.andCallFake(function (f) { f(); }).
          andReturn({ catch: function (f) { f(); } }),
        catch: setCatchSpy.andCallFake(function (f) { f(); })
      };
    });

    $provide.value('stateService', {
      Initialize: InitializeSpy,
      startListeningForStatusInformation: startListeningForStatusInformationSpy,
      stopListeningForStatusInformation: stopListeningForStatusInformationSpy,
      addStateCallback: addStateCallbackSpy,
      removeStateCallback: removeStateCallbackSpy,
      addMessageCallback: addMessageCallbackSpy,
      removeMessageCallback: removeMessageCallbackSpy,
      getCurrentState: getCurrentStateSpy,
      setCurrentState: setCurrentStateSpy,
      ensureStateBeforeExecuting: ensureStateBeforeExecutingSpy,
      currentState: localCurrentState,
      statePending: localStatePending
    });
  }));


    beforeEach(module('contextMenuStateService', function ($provide) {

    var toggleContextMenuSpy = jasmine.createSpy('toggleContextMenu');
    var pushItemGroupSpy = jasmine.createSpy('pushItemGroup');

    $provide.value('contextMenuState', {
      toggleContextMenu: toggleContextMenuSpy,
      pushItemGroup : pushItemGroupSpy
    });
  }));

  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gzInitializationMock);
    $provide.value('cameraManipulation', cameraManipulationMock);
    $provide.value('splash', splashServiceMock);
    $provide.value('assetLoadingSplash', assetLoadingSplashMock);
    $provide.value('simulationService', simulationServiceMock);
    $provide.value('simulationState', simulationStateMock);
    $provide.value('simulationControl', simulationControlMock);
    $provide.value('screenControl', screenControlMock);
    $provide.value('$stateParams', stateParams);
    $provide.value('hbpUserDirectory', hbpUserDirectoryMock);
    $provide.value('nrpBackendVersions', nrpBackendVersionsMock);
    $provide.value('nrpFrontendVersion', nrpFrontendVersionMock);
    $provide.value('$timeout', timeoutMock);
    $provide.value('serverError', serverErrorMock);
    $provide.value('panels', angularPanelsMock);
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
    hbpUserDirectoryPromiseObject.then.reset();
    hbpUserDirectoryPromiseObject2.then.reset();
    hbpUserDirectoryMock.getCurrentUser.reset();
    hbpUserDirectoryMock.get.reset();
    nrpBackendVersionsObject.get.reset();
    nrpBackendVersionsMock.reset();
    nrpFrontendVersionMock.get.reset();
    serverErrorMock.reset();
    angularPanelsMock.open.reset();
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _hbpUserDirectory_,
                              $timeout,
                              _$httpBackend_,
                              _$window_,
                              _$document_,
                              _$location_,
                              _cameraManipulation_,
                              _splash_,
                              _assetLoadingSplash_,
                              _simulationService_,
                              _simulationState_,
                              _simulationControl_,
                              _stateService_,
                              _contextMenuState_,
                              _screenControl_,
                              _$stateParams_,
                              _nrpBackendVersions_,
                              _nrpFrontendVersion_,
                              _STATE_,
                              _UI_,
                              _OPERATION_MODE_,
                              _serverError_,
                              _panels_,
                              _gz3d_,
                              _experimentSimulationService_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    hbpUserDirectory = _hbpUserDirectory_;
    timeout = $timeout;
    httpBackend = _$httpBackend_;
    window = _$window_;
    document = _$document_;
    location = _$location_;
    cameraManipulation = _cameraManipulation_;
    splash = _splash_;
    assetLoadingSplash = _assetLoadingSplash_;
    simulationService = _simulationService_;
    simulationState = _simulationState_;
    simulationControl = _simulationControl_;
    stateService = _stateService_;
    contextMenuState = _contextMenuState_;
    screenControl = _screenControl_;
    stateParams = _$stateParams_;
    nrpBackendVersions = _nrpBackendVersions_;
    nrpFrontendVersion = _nrpFrontendVersion_;
    STATE = _STATE_;
    UI = _UI_;
    OPERATION_MODE = _OPERATION_MODE_;
    serverError = _serverError_;
    panels = _panels_;
    gz3d = _gz3d_;
    experimentSimulationService = _experimentSimulationService_;

    scope.viewState = {};

    gz3d.scene = {};
    gz3d.scene.radialMenu = {};
    gz3d.scene.radialMenu.showing = false;
    gz3d.scene.modelManipulator = {};
    gz3d.scene.modelManipulator.pickerNames = '';
    gz3d.scene.emitter = {};
    gz3d.scene.controls = {};
    gz3d.scene.controls.onMouseDownManipulator = jasmine.createSpy('onMouseDownManipulator');
    gz3d.scene.controls.onMouseUpManipulator = jasmine.createSpy('onMouseUpManipulator');
    gz3d.gui = {};
    gz3d.gui.emitter = {};
    gz3d.iface = {};
    gz3d.iface.setAssetProgressCallback = jasmine.createSpy('setAssetProgressCallback');
    gz3d.iface.registerWebSocketConnectionCallback = jasmine.createSpy('registerWebSocketConnectionCallback');
    gz3d.iface.webSocket = {};
    gz3d.iface.webSocket.close = jasmine.createSpy('close');



    httpBackend.whenGET('views/common/home.html').respond({}); // Templates are requested via HTTP and processed locally.
    httpBackend.whenPUT(/()/).respond(200);

    simulations = [
      { simulationID: 0, experimentConfiguration: 'fakeExperiment0', state: STATE.CREATED},
      { simulationID: 1, experimentConfiguration: 'fakeExperiment1', state: STATE.INITIALIZED},
      { simulationID: 2, experimentConfiguration: 'fakeExperiment2', state: STATE.PAUSED},
      { simulationID: 3, experimentConfiguration: 'fakeExperiment3', state: STATE.STARTED},
      { simulationID: 4, experimentConfiguration: 'fakeExperiment4', state: STATE.STOPPED},
      { simulationID: 5, experimentConfiguration: 'fakeExperiment5', state: STATE.INITIALIZED},
      { simulationID: 6, experimentConfiguration: 'fakeExperiment6', state: STATE.CREATED}
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
      experimentConfiguration: 'FakeExperiment'
    };

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');

    timeout.reset();
  }));

  describe('(ViewMode)', function () {
    beforeEach(function(){
      stateParams.mode = OPERATION_MODE.VIEW;

      Gz3dViewCtrl = controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });
    });

    it('should be in view mode', function(){
      expect(scope.operationMode).toBe(OPERATION_MODE.VIEW);
    });

    it('should set isJoiningStoppedSimulation to true when already stopped', function(){
      expect(scope.viewState.isJoiningStoppedSimulation).toBe(false);
      stateService.currentState = STATE.STOPPED;
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      expect(scope.viewState.isJoiningStoppedSimulation).toBe(true);
    });

    it('should set the assetLoadingSplash callback in gz3d', function(){
      stateService.currentState = STATE.STARTED;
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      expect(scope.assetLoadingSplashScreen).toEqual(assetLoadingSplashInstance);
      expect(assetLoadingSplash.open).toHaveBeenCalled();
      expect(gz3d.iface.setAssetProgressCallback).toHaveBeenCalled();
      gz3d.iface.setAssetProgressCallback.mostRecentCall.args[0](exampleProgressData);
      expect(assetLoadingSplash.setProgress).toHaveBeenCalledWith(exampleProgressData);
    });




    it('should set the current User and checks if isOwner (1)', function() {
      scope.viewState.isOwner = false;
      hbpUserDirectoryPromiseObject.then.mostRecentCall.args[0](currentUserInfo1234);
      expect(scope.userName).toEqual(currentUserInfo1234.displayName);
      expect(scope.userID).toEqual(currentUserInfo1234.id);
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      expect(scope.ownerID).toEqual(fakeSimulationData.owner);
      expect(scope.viewState.isOwner).toBe(true);

      hbpUserDirectoryPromiseObject2.then.mostRecentCall.args[0](currentUserInfo1234Hash);
      expect(scope.owner).toEqual(currentUserInfo1234.displayName);
    });

    it('should set the current User and checks if isOwner (2)', function() {
      scope.viewState.isOwner = true;
      hbpUserDirectoryPromiseObject.then.mostRecentCall.args[0](otherUserInfo4321);
      expect(scope.userName).toEqual(otherUserInfo4321.displayName);
      expect(scope.userID).toEqual(otherUserInfo4321.id);
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      expect(scope.ownerID).toEqual(fakeSimulationData.owner);
      expect(scope.viewState.isOwner).toBe(false);
    });

    it('should check that updateSimulation sets the scope\'s state', function () {
      //Ignore this warning because of the sim_id
      /*jshint camelcase: false */

      // test whether the state given as a parameter is passed
      scope.updateSimulation(STATE.STARTED);
      expect(stateService.setCurrentState).toHaveBeenCalledWith(STATE.STARTED);

      // test whether duplicate requests are skipped
      scope.updateSimulation(STATE.STARTED);
      expect(stateService.setCurrentState).toHaveBeenCalled();
      stateService.setCurrentState.reset();
      scope.updateSimulation(STATE.STARTED);
      expect(simulationStateObject.update).not.toHaveBeenCalled();
    });

    it('should register for status information', function() {
      scope.state = STATE.UNDEFINED;
      stateService.currentState = STATE.STARTED;
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      expect(stateService.startListeningForStatusInformation).toHaveBeenCalled();
      expect(stateService.addMessageCallback).toHaveBeenCalled();
    });

    it('should open splash screen with callbackOnClose', function () {
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      stateService.currentState = STATE.STOPPED;
      //Test the messageCallback
      scope.splashScreen = undefined;
      stateService.addMessageCallback.mostRecentCall.args[0]({progress: { 'block_ui': 'False', task: 'Task1', subtask: 'Subtask1'}});
      expect(splash.open).toHaveBeenCalled();
      var callbackOnClose = splash.open.mostRecentCall.args[1];
      expect(callbackOnClose).toBeDefined();
      expect(splash.setMessage).toHaveBeenCalledWith({ headline: 'Task1', subHeadline: 'Subtask1' });
      // test open splash screen without callbackOnClose
      scope.splashScreen = undefined;
      stateService.currentState = STATE.INITIALIZED;
      stateService.addMessageCallback.mostRecentCall.args[0]({progress: { 'block_ui': 'False', task: 'Task1', subtask: 'Subtask1'}});
      callbackOnClose = splash.open.mostRecentCall.args[1];
      expect(callbackOnClose).not.toBeDefined();
      // test "done" without close
      splash.showButton = true;
      splash.spin = true;
      stateService.addMessageCallback.mostRecentCall.args[0]({progress: { 'block_ui': 'False', done: 'True'}});
      expect(splash.setMessage).toHaveBeenCalledWith({ headline: 'Finished' });
      expect(splash.close).not.toHaveBeenCalled();
      expect(splash.spin).toBe(false);
      // test "done" in IF path (with close)
      stateService.currentState = STATE.STOPPED;
      scope.splashScreen = undefined;
      splash.close.reset();
      splash.showButton = false;
      stateService.addMessageCallback.mostRecentCall.args[0]({progress: { 'block_ui': 'True', done: 'True'}});
      expect(splash.close).toHaveBeenCalled();
      // test "timeout"
      stateService.addMessageCallback.mostRecentCall.args[0]({timeout: 264, simulationTime: 1, realTime: 2});
      expect(scope.simTimeoutText).toBe(264);
      // test "simulationTime"
      expect(scope.simulationTimeText).toBe(1);
      // test "realTime"
      expect(scope.realTimeText).toBe(2);
    });

    it('should set a color on the selected screen', function() {
      //Ignore this warning because of the sim_id
      /*jshint camelcase: false */
      scope.activeSimulation = simulations[3];

      // prepare the test: create mockups
      var entityToChange = { 'children' : [ { 'material' : {} } ] };
      gz3d.scene.getByName = jasmine.createSpy('getByName').andReturn(entityToChange);

      // actual test
      // currently no element is selected, hence we want a console.error message
      scope.setColorOnEntity('value_does_not_matter_here');
      expect(console.error).toHaveBeenCalled();
      expect(console.error.callCount).toEqual(1);

      // pretend we selected a screen now
      gz3d.scene.selectedEntity = { 'name' : 'left_vr_screen' };
      scope.setColorOnEntity('red');

      expect(screenControl).toHaveBeenCalledWith('http://bbpce016.epfl.ch:8080');
      expect(screenControlObject.updateScreenColor).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'}, {'name':'LeftScreenToRed'});
    });


    it('should call context menu service if user is the simulation owner', function() {

      var event = {button : 2};

      //false case
      scope.viewState.isOwner = false;

      scope.toggleContextMenu(true, event);//call the function under test

      expect(contextMenuState.toggleContextMenu).not.toHaveBeenCalled();

      //true case
      scope.viewState.isOwner = true;

      scope.toggleContextMenu(true, event);//call the function under test

      expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(true, event);

    });

    it('should turn slider position into light intensities', function() {
        expect(scope.updateLightIntensities).toEqual(jasmine.any(Function));
        gz3d.scene.emitter.emit = jasmine.createSpy('emit');

        scope.updateLightIntensities(60.0);

        expect(gz3d.scene.emitter.emit).toHaveBeenCalledWith('lightChanged', (60 - 75) / 50.25);
        expect(gz3d.scene.emitter.emit.callCount).toEqual(1);
    });

    it('should emit light intensity changes', function() {
        gz3d.scene.scene = {};

        // three is loaded externally, jshint does not know that
        var light0 = new THREE.AmbientLight(); // jshint ignore:line
        var light1 = new THREE.PointLight(); // jshint ignore:line
        light1.name = 'left_spot';
        light1.initialIntensity = 0.5;
        var light2 = new THREE.PointLight();// jshint ignore:line
        light2.name = 'right_spot';
        light2.initialIntensity = 0.5;

        gz3d.scene.scene.__lights = [light1, light2];

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
        gz3d.scene.getByName = function(name) {
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
        //gz3d.scene.getLightType = GZ3D.Scene.prototype.getLightType;
        //gz3d.scene.intensityToAttenuation = GZ3D.Scene.prototype.intensityToAttenuation;
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

    it('should call or skip camera controls according to mouse events and help mode status', function() {
      var e = { which: 1 }; // 1 for left mouse button
      scope.helpModeActivated = false;
      scope.requestMove(e, 'moveForward');
      expect(gz3d.scene.controls.onMouseDownManipulator).toHaveBeenCalledWith('moveForward');
      scope.releaseMove(e, 'moveForward');
      expect(gz3d.scene.controls.onMouseUpManipulator).toHaveBeenCalledWith('moveForward');

      e.which = 2; // 2 for right mouse button
      scope.helpModeActivated = false;
      gz3d.scene.controls.onMouseDownManipulator.reset();
      gz3d.scene.controls.onMouseUpManipulator.reset();
      scope.requestMove(e, 'moveBackward');
      expect(gz3d.scene.controls.onMouseDownManipulator).not.toHaveBeenCalled();
      scope.releaseMove(e, 'moveBackward');
      expect(gz3d.scene.controls.onMouseUpManipulator).not.toHaveBeenCalled();

      e.which = 1;
      scope.helpModeActivated = true;
      gz3d.scene.controls.onMouseDownManipulator.reset();
      gz3d.scene.controls.onMouseUpManipulator.reset();
      scope.requestMove(e, 'rotateRight');
      expect(gz3d.scene.controls.onMouseDownManipulator).not.toHaveBeenCalled();
      scope.releaseMove(e, 'rotateRight');
      expect(gz3d.scene.controls.onMouseUpManipulator).not.toHaveBeenCalled();
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
      stateService.currentState = STATE.STARTED;
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      scope.splashScreen = splashInstance;

      // call the method under test
      scope.$destroy();

      expect(splash.close).toHaveBeenCalled();
      expect(assetLoadingSplash.close).toHaveBeenCalled();
      expect(stateService.stopListeningForStatusInformation).toHaveBeenCalled();
      expect(stateService.removeMessageCallback).toHaveBeenCalled();
      expect(gz3d.iface.webSocket.close).toHaveBeenCalled();
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

/*    it('should call newExp if necessary on destroy', function () {
      var dummyNewExp = jasmine.createSpy('dummyNewExp');
      experimentSimulationService.setExperimentForRestart(stateParams.serverID, dummyNewExp);
      scope.$destroy();
      expect(dummyNewExp).toHaveBeenCalled();
    }); */

    it('should do nothing on $destroy when all is undefined', function() {
      scope.assetLoadingSplashScreen = undefined;
      gz3d.iface.webSocket = undefined;
      scope.rosConnection = undefined;
      scope.statusListener = undefined;

      scope.$destroy();

      expect(scope.splashScreen).not.toBeDefined();
      expect(scope.assetLoadingSplashScreen).not.toBeDefined();
      expect(scope.statusListener).not.toBeDefined();
      expect(scope.worldStatsListener).not.toBeDefined();
      expect(scope.rosConnection).not.toBeDefined();
      expect(gz3d.iface.webSocket).not.toBeDefined();
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

    it('should set the visibility state of the keyboard info panel properly', function() {
      expect(scope.showKeyboardControlInfoDiv).toBe(false);
      scope.showKeyboardControlInfo();
      expect(scope.showKeyboardControlInfoDiv).toBe(true);
      timeout.mostRecentCall.args[0]();
      expect(scope.showKeyboardControlInfoDiv).toBe(false);
      timeout.reset();
      scope.showKeyboardControlInfo();
      expect(timeout).not.toHaveBeenCalled();
    });

    it('should go back to the esv-web page', function() {
      scope.exit('/fake_url');
      expect(location.path()).toEqual('/fake_url');
    });
  });

  describe('(EditMode)', function () {
    beforeEach(function(){
      stateParams.mode = OPERATION_MODE.EDIT;
      Gz3dViewCtrl = controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });
    });

    it('should be in edit mode', function(){
      expect(scope.operationMode).toBe(OPERATION_MODE.EDIT);
    });

    it('should call the panels.open() function', function() {
      scope.edit();
      expect(panels.open).toHaveBeenCalledWith('code-editor');
    });
  });
});
