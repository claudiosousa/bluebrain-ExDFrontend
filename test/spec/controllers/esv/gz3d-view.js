'use strict';

describe('Controller: Gz3dViewCtrl', function () {
  var Gz3dViewCtrl,
      controller,
      scope,
      rootScope,
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
      simulationInfo,
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
      EDIT_MODE,
      panels,
      gz3d,
      experimentSimulationService;

  var simulationStateObject = {
    update: jasmine.createSpy('update'),
    state: jasmine.createSpy('state')
  };

  var simulationServiceObject = {
      simulations: jasmine.createSpy('simulations'),
      getUserName: jasmine.createSpy('getUserName').andCallFake(
        function(profile) {
          return profile[Object.keys(profile)[0]].displayName;
        }
      )
  };

  var simulationControlObject = {
    simulation: jasmine.createSpy('simulation')
  };

  var screenControlObject = {
    updateScreenColor: jasmine.createSpy('updateScreenColor')
  };

  var assetLoadingSplashInstance = {
    close: jasmine.createSpy('close')
  };

  var nrpBackendVersionsObject = {
    get: jasmine.createSpy('get')
  };


  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module('simulationStateServices', function ($provide) {
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
      Initialize: jasmine.createSpy('Initialize'),
      startListeningForStatusInformation: jasmine.createSpy('startListeningForStatusInformation'),
      stopListeningForStatusInformation: jasmine.createSpy('stopListeningForStatusInformation'),
      addStateCallback: jasmine.createSpy('addStateCallback'),
      removeStateCallback: jasmine.createSpy('removeStateCallback'),
      addMessageCallback: jasmine.createSpy('addMessageCallback'),
      removeMessageCallback: jasmine.createSpy('removeMessageCallback'),
      getCurrentState: getCurrentStateSpy,
      setCurrentState: setCurrentStateSpy,
      ensureStateBeforeExecuting: ensureStateBeforeExecutingSpy,
      currentState: localCurrentState,
      statePending: localStatePending
    });
  }));

    beforeEach(module('contextMenuStateService', function ($provide) {
    $provide.value('contextMenuState', {
      toggleContextMenu: jasmine.createSpy('toggleContextMenu'),
      pushItemGroup : jasmine.createSpy('pushItemGroup')
    });
  }));

  beforeEach(module(function ($provide) {
    var gz3dMock = {
      Initialize : jasmine.createSpy('Initialize'),
      deInitialize : jasmine.createSpy('deInitialize'),
      scene : {
        resetView: jasmine.createSpy('resetView'),
        setDefaultCameraPose: jasmine.createSpy('setDefaultCameraPose'),

        radialMenu : {
          showing: false
        },
        modelManipulator: {
          pickerNames: ''
        },
        emitter: {
          emit: jasmine.createSpy('emit'),
        },
        setManipulationMode : jasmine.createSpy('setManipulationMode'),
        controls: {
          onMouseDownManipulator: jasmine.createSpy('onMouseDownManipulator'),
          onMouseUpManipulator: jasmine.createSpy('onMouseUpManipulator'),
          update: jasmine.createSpy('update')
        },
        gui: {
          emitter: {}
        },
        setShadowMaps: jasmine.createSpy('setShadowMaps'),
        renderer: {
          shadowMapEnabled: false
        },
        viewManager: {
          views: [
            {type: 'camera', active: true, container: {style: {visibility: 'visible'}}},
            {type: 'camera', active: false, container: {style: {visibility: 'hidden'}}}
          ]
        }
      },
      iface: {
        setAssetProgressCallback: jasmine.createSpy('setAssetProgressCallback'),
        registerWebSocketConnectionCallback: jasmine.createSpy('registerWebSocketConnectionCallback'),
        webSocket: {
          close: jasmine.createSpy('close')
        }
      }
    };
    $provide.value('gz3d', gz3dMock);
     var cameraManipulationMock = {
      firstPersonRotate : jasmine.createSpy('firstPersonRotate'),
      firstPersonTranslate : jasmine.createSpy('firstPersonTranslate'),
      lookAtOrigin : jasmine.createSpy('lookAtOrigin'),
      resetToInitialPose : jasmine.createSpy('resetToInitialPose')
    };
    $provide.value('cameraManipulation', cameraManipulationMock);
    splashInstance = {
      close: jasmine.createSpy('modalInstance.close'),
      result: {
        then: jasmine.createSpy('modalInstance.result.then')
      }
    };
    var splashServiceMock = {
      close: jasmine.createSpy('close'),
      open: jasmine.createSpy('open').andReturn(splashInstance),
      setMessage: jasmine.createSpy('setMessage')
    };
    $provide.value('splash', splashServiceMock);
    var assetLoadingSplashMock = {
      open: jasmine.createSpy('open').andReturn(assetLoadingSplashInstance),
      close: jasmine.createSpy('close')
    };
    $provide.value('assetLoadingSplash', assetLoadingSplashMock);
    $provide.value('simulationService', jasmine.createSpy('simulationService').andReturn(simulationServiceObject));
    $provide.value('simulationState', jasmine.createSpy('simulationState').andReturn(simulationStateObject));
    $provide.value('simulationControl',  jasmine.createSpy('simulationControl').andReturn(simulationControlObject));
    $provide.value('screenControl', jasmine.createSpy('screenControl').andReturn(screenControlObject));
    var stateParamsMock = {
      mode : undefined,
      serverID : 'bbpce016',
      simulationID : 'mocked_simulation_id'
    };
    $provide.value('$stateParams', stateParamsMock);
    var hbpUserDirectoryMock = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').andReturn({then: jasmine.createSpy('then')}),
      get: jasmine.createSpy('get').andReturn({then: jasmine.createSpy('then')})
    };
    $provide.value('hbpUserDirectory', hbpUserDirectoryMock);
    $provide.value('nrpBackendVersions', jasmine.createSpy('nrpBackendVersions').andReturn(nrpBackendVersionsObject));
    $provide.value('nrpFrontendVersion', { get: jasmine.createSpy('get') });
    $provide.value('serverError', jasmine.createSpy('serverError'));
    $provide.value('panels', { open: jasmine.createSpy('open') });
    simulationInfo = {
      serverID : stateParamsMock.serverID,
      simulationID : stateParamsMock.simulationID,
      serverBaseUrl : 'http://bbpce016.epfl.ch:8080',
      Initialize: jasmine.createSpy('Initialize'),
      mode: undefined
    };
    $provide.value('simulationInfo', simulationInfo);
    simulationServiceObject.simulations.reset();
    simulationServiceObject.getUserName.reset();
    simulationStateObject.update.reset();
    simulationStateObject.state.reset();
    simulationControlObject.simulation.reset();
    screenControlObject.updateScreenColor.reset();
    assetLoadingSplashInstance.close.reset();
    nrpBackendVersionsObject.get.reset();
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _hbpUserDirectory_,
                              _$timeout_,
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
                              _nrpBackendVersions_,
                              _nrpFrontendVersion_,
                              _STATE_,
                              _UI_,
                              _OPERATION_MODE_,
                              _EDIT_MODE_,
                              _panels_,
                              _gz3d_,
                              _experimentSimulationService_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    hbpUserDirectory = _hbpUserDirectory_;
    timeout = _$timeout_;
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
    nrpBackendVersions = _nrpBackendVersions_;
    nrpFrontendVersion = _nrpFrontendVersion_;
    STATE = _STATE_;
    UI = _UI_;
    OPERATION_MODE = _OPERATION_MODE_;
    EDIT_MODE = _EDIT_MODE_;
    panels = _panels_;
    gz3d = _gz3d_;
    experimentSimulationService = _experimentSimulationService_;

    scope.viewState = {};

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
  }));

  describe('(ViewMode)', function () {
    var currentUserInfo1234, currentUserInfo1234Hash, otherUserInfo4321;
    beforeEach(function(){
      simulationInfo.mode = OPERATION_MODE.VIEW;
      Gz3dViewCtrl = controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });

      currentUserInfo1234 = {
        displayName: 'John Does',
        id: '1234'
      };

      currentUserInfo1234Hash = {
        '1234': {
          displayName: 'John Does'
        }
      };

      otherUserInfo4321 = {
        displayName: 'John Dont',
        id: '4321'
      };

    });

    it('should call simulationInfo.Initialize() and stateService.Initialize()', function(){
      expect(simulationInfo.Initialize.callCount).toBe(1);
      expect(stateService.Initialize.callCount).toBe(1);
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

    it('should set the assetLoadingSplash progress callback in gz3d', function(){
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
      var promise = hbpUserDirectory.getCurrentUser();
      promise.then.mostRecentCall.args[0](currentUserInfo1234);
      expect(scope.viewState.userID).toEqual(currentUserInfo1234.id);
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      expect(scope.viewState.ownerID).toEqual(fakeSimulationData.owner);

      promise = hbpUserDirectory.get();
      promise.then.mostRecentCall.args[0](currentUserInfo1234Hash);
      expect(scope.viewState.isOwner).toBe(true);
      expect(scope.owner).toEqual(currentUserInfo1234.displayName);
    });

    it('should set the current User and checks if isOwner (2)', function() {
      scope.viewState.isOwner = true;
      var promise = hbpUserDirectory.getCurrentUser();
      promise.then.mostRecentCall.args[0](otherUserInfo4321);
      expect(scope.viewState.userID).toEqual(otherUserInfo4321.id);
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      expect(scope.viewState.ownerID).toEqual(fakeSimulationData.owner);
      promise = hbpUserDirectory.get();
      promise.then.mostRecentCall.args[0](currentUserInfo1234Hash);
      expect(scope.viewState.isOwner).toBe(false);
    });

    it('should set the forced user id in full local mode' , function () {
      window.bbpConfig.localmode.forceuser = true;
      controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      expect(scope.viewState.userID).toEqual('vonarnim');
      expect(scope.viewState.ownerID).toEqual(fakeSimulationData.owner);
      expect(scope.owner).toEqual('vonarnim');
      expect(scope.viewState.isOwner).toBe(true);
      window.bbpConfig.localmode.forceuser = false;
    });

    it('should initialize simulationInfo.experimentID', function() {
      var promise = hbpUserDirectory.getCurrentUser();
      promise.then.mostRecentCall.args[0](otherUserInfo4321);
      expect(simulationInfo.experimentID).toBeDefined();
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

    it('should reset everything on reset button pressed', function() {
      scope.updateSimulation(STATE.INITIALIZED);
      expect(stateService.setCurrentState).toHaveBeenCalledWith(STATE.INITIALIZED);
      stateService.setCurrentState(STATE.INITIALIZED).then.mostRecentCall.args[0]();
      expect(gz3d.scene.controls.onMouseDownManipulator).toHaveBeenCalledWith('initPosition');
      expect(gz3d.scene.controls.onMouseDownManipulator).toHaveBeenCalledWith('initRotation');
      expect(gz3d.scene.resetView).toHaveBeenCalled();
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

      expect(screenControl).toHaveBeenCalledWith(simulationInfo.serverBaseUrl);
      expect(screenControlObject.updateScreenColor).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'}, {'name':'LeftScreenToRed'});

      gz3d.scene.selectedEntity = { 'name' : 'left_vr_screen' };
      scope.setColorOnEntity('blue');

      expect(screenControl).toHaveBeenCalledWith(simulationInfo.serverBaseUrl);
      expect(screenControlObject.updateScreenColor).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'}, {'name':'LeftScreenToBlue'});

      gz3d.scene.selectedEntity = { 'name' : 'right_vr_screen' };
      scope.setColorOnEntity('red');

      expect(screenControl).toHaveBeenCalledWith(simulationInfo.serverBaseUrl);
      expect(screenControlObject.updateScreenColor).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'}, {'name':'RightScreenToRed'});

      gz3d.scene.selectedEntity = { 'name' : 'right_vr_screen' };
      scope.setColorOnEntity('blue');

      expect(screenControl).toHaveBeenCalledWith(simulationInfo.serverBaseUrl);
      expect(screenControlObject.updateScreenColor).toHaveBeenCalledWith({sim_id: 'mocked_simulation_id'}, {'name':'RightScreenToBlue'});


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

    it('should call asset loading callback and turn slider position into light intensities', function() {
      scope.assetLoadingSplashScreen = undefined;
      stateService.currentState = STATE.INITIALIZED;
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      expect(assetLoadingSplash.open).toHaveBeenCalled();
      var callbackOnClose = assetLoadingSplash.open.mostRecentCall.args[0];
      expect(callbackOnClose).toBeDefined();
      expect(callbackOnClose).toBe(scope.onSceneLoaded);
      callbackOnClose();
      scope.sliderPosition = 60.0;
      scope.$apply();
      expect(gz3d.scene.emitter.emit).toHaveBeenCalledWith('lightChanged', 60 / 50);
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


    it('should not set edit mode if the new mode is equal to the current one', function() {
      gz3d.scene.manipulationMode = EDIT_MODE.VIEW;

      //false case
      scope.setEditMode(EDIT_MODE.VIEW);
      expect(gz3d.scene.setManipulationMode).not.toHaveBeenCalled();

      //true case
      scope.setEditMode(EDIT_MODE.EDIT);
      expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.EDIT);

    });

    it('should correctly execute simControlButtonHandler', function() {
      //test setup
      var newState = STATE.STARTED;
      scope.setEditMode = jasmine.createSpy('setEditMode');
      scope.updateSimulation = jasmine.createSpy('updateSimulation');

      //call function under test
      scope.simControlButtonHandler(newState);

      //check test outcome
      expect(scope.updateSimulation).toHaveBeenCalledWith(newState);
      expect(scope.setEditMode).toHaveBeenCalledWith(EDIT_MODE.VIEW);
    });

    it('should toggle the showSpikeTrain variable', function() {
      expect(scope.showSpikeTrain).toBe(false);
      scope.toggleSpikeTrain();
      expect(scope.showSpikeTrain).toBe(true);
    });

    it('should toggle the showJoinPlot variable', function() {
      expect(scope.showJointPlot).toBe(false);
      scope.toggleJointPlot();
      expect(scope.showJointPlot).toBe(true);
    });

    it('should toggle the robot camera views', function() {
      expect(scope.showRobotView).toBe(undefined);
      expect(gz3d.scene.viewManager.views[0].type).toBe('camera');
      expect(gz3d.scene.viewManager.views[0].active).toBe(true);
      expect(gz3d.scene.viewManager.views[0].container.style.visibility).toBe('visible');
      expect(gz3d.scene.viewManager.views[1].type).toBe('camera');
      expect(gz3d.scene.viewManager.views[1].active).toBe(false);
      expect(gz3d.scene.viewManager.views[1].container.style.visibility).toBe('hidden');
      scope.toggleRobotView();
      expect(scope.showRobotView).toBe(true);
      expect(gz3d.scene.viewManager.views[0].active).toBe(false);
      expect(gz3d.scene.viewManager.views[0].container.style.visibility).toBe('hidden');
      expect(gz3d.scene.viewManager.views[1].active).toBe(true);
      expect(gz3d.scene.viewManager.views[1].container.style.visibility).toBe('visible');
    });

    it('should toggle the rendering performance', function() {
      expect(gz3d.scene.renderer.shadowMapEnabled).toBe(false);
      expect(scope.showShadows).toBe(undefined);
      scope.toggleGraphicsPerformance();
      expect(gz3d.scene.setShadowMaps).toHaveBeenCalledWith(true);
      expect(scope.showShadows).toBe(true);
    });

    it('should toggle the help mode variable', function() {
      expect(scope.helpModeActivated).toBe(false);
      scope.toggleHelpMode();
      expect(scope.helpModeActivated).toBe(true);
    });

    it('should call nrpBackendVersions.get and set scope.versions with retrieved back-end versions', function() {
      expect(nrpBackendVersions.callCount).toBe(1);
      expect(nrpBackendVersions.mostRecentCall.args[0].indexOf(simulationInfo.serverID) > -1).toBe(true);
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

    it('should set the focus on the supplied html element', function() {
      var element = {'focus': jasmine.createSpy('focus')};
      var backup = window.document.getElementById;
      window.document.getElementById = jasmine.createSpy('getElementById').andReturn(element);
      scope.focus('dummyelement');
      timeout.flush();
      expect(element.focus).toHaveBeenCalled();
      window.document.getElementById = backup;
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
      expect(gz3d.deInitialize).toHaveBeenCalled();
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
      timeout.flush();
      expect(scope.showKeyboardControlInfoDiv).toBe(false);

      // After a second call, the div should not be displayed again
      scope.showKeyboardControlInfo();
      expect(scope.showKeyboardControlInfoDiv).toBe(false);
    });

    it('should go back to the esv-web page', function() {
      scope.exit('/fake_url');
      expect(location.path()).toEqual('/fake_url');
    });

    it('should update simulation\'s initial camera pose', function(){
      scope.updateInitialCameraPose(null);
      expect(gz3d.scene.setDefaultCameraPose).not.toHaveBeenCalled();
      var camPose =  [1.0, 2.0, 3.0, -1.0, -2.0, -3.0];
      scope.updateInitialCameraPose(camPose);
      expect(gz3d.scene.setDefaultCameraPose).toHaveBeenCalled();
    });
  });

  describe('(EditMode)', function () {
    beforeEach(function(){
      simulationInfo.mode = OPERATION_MODE.EDIT;
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
