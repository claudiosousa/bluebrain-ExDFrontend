/* global THREE: false */

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
      stateParams,
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
      hbpIdentityUserDirectory,
      fakeSimulationData,
      nrpBackendVersions,
      nrpFrontendVersion,
      STATE,
      UI,
      OPERATION_MODE,
      EDIT_MODE,
      SCREEN_GLASS_STRING,
      panels,
      gz3d,
      experimentSimulationService,
      hbpDialogFactory,
      backendInterfaceService,
      RESET_TYPE,
      objectInspectorService;

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

  var objectInspectorServiceMock = {
    update: jasmine.createSpy('update')
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
        container : {
          addEventListener : jasmine.createSpy('addEventListener')
        },
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
        },
        scene: new THREE.Scene()
      },
      iface: {
        setAssetProgressCallback: jasmine.createSpy('setAssetProgressCallback'),
        registerWebSocketConnectionCallback: jasmine.createSpy('registerWebSocketConnectionCallback'),
        webSocket: {
          close: jasmine.createSpy('close')
        }
      }
    };
    // set up test lightHelper object
    var testLightHelper = new THREE.Object3D();
    testLightHelper.name = 'test_lightHelper';
    testLightHelper.visible = false;
    gz3dMock.scene.scene.add(testLightHelper);
    //provide gz3dMock
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
    var hbpIdentityUserDirectoryMock = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').andReturn({then: jasmine.createSpy('then')}),
      get: jasmine.createSpy('get').andReturn({then: jasmine.createSpy('then')})
    };
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectoryMock);
    $provide.value('nrpBackendVersions', jasmine.createSpy('nrpBackendVersions').andReturn(nrpBackendVersionsObject));
    $provide.value('nrpFrontendVersion', { get: jasmine.createSpy('get') });
    $provide.value('serverError', jasmine.createSpy('serverError'));
    $provide.value('panels', { open: jasmine.createSpy('open') });
    simulationInfo = {
      serverID : stateParamsMock.serverID,
      simulationID : stateParamsMock.simulationID,
      serverBaseUrl : 'http://bbpce016.epfl.ch:8080',
      Initialize: jasmine.createSpy('Initialize'),
      mode: undefined,
      contextID: '97923877-13ea-4b43-ac31-6b79e130d344'
    };
    $provide.value('simulationInfo', simulationInfo);

    var hbpDialogFactoryMock = {
      confirm: jasmine.createSpy('confirm').andReturn({
        then: jasmine.createSpy('then')
      }),
      alert: jasmine.createSpy('alert')
    };
    $provide.value('hbpDialogFactory', hbpDialogFactoryMock);
    var backendInterfaceServiceMock = {
      reset: jasmine.createSpy('reset'),
      resetCollab: jasmine.createSpy('resetCollab')
    };
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);

    $provide.value('objectInspectorService', objectInspectorServiceMock);

    simulationServiceObject.simulations.reset();
    simulationServiceObject.getUserName.reset();
    simulationStateObject.update.reset();
    simulationStateObject.state.reset();
    simulationControlObject.simulation.reset();
    screenControlObject.updateScreenColor.reset();
    assetLoadingSplashInstance.close.reset();
    nrpBackendVersionsObject.get.reset();
    hbpDialogFactoryMock.confirm.reset();
    hbpDialogFactoryMock.confirm().then.reset();
    backendInterfaceServiceMock.reset.reset();
    backendInterfaceServiceMock.resetCollab.reset();
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _hbpIdentityUserDirectory_,
                              _$timeout_,
                              _$window_,
                              _$document_,
                              _$location_,
                              _$stateParams_,
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
                              _SCREEN_GLASS_STRING_,
                              _panels_,
                              _gz3d_,
                              _experimentSimulationService_,
                              _hbpDialogFactory_,
                              _backendInterfaceService_,
                              _RESET_TYPE_,
                              _objectInspectorService_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
    timeout = _$timeout_;
    window = _$window_;
    document = _$document_;
    location = _$location_;
    stateParams = _$stateParams_;
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
    SCREEN_GLASS_STRING = _SCREEN_GLASS_STRING_;
    panels = _panels_;
    gz3d = _gz3d_;
    experimentSimulationService = _experimentSimulationService_;
    hbpDialogFactory = _hbpDialogFactory_;
    backendInterfaceService = _backendInterfaceService_;
    RESET_TYPE = _RESET_TYPE_;
    objectInspectorService = _objectInspectorService_;

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
      var promise = hbpIdentityUserDirectory.getCurrentUser();
      promise.then.mostRecentCall.args[0](currentUserInfo1234);
      expect(scope.viewState.userID).toEqual(currentUserInfo1234.id);
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      expect(scope.viewState.ownerID).toEqual(fakeSimulationData.owner);

      promise = hbpIdentityUserDirectory.get();
      promise.then.mostRecentCall.args[0](currentUserInfo1234Hash);
      expect(scope.viewState.isOwner).toBe(true);
      expect(scope.owner).toEqual(currentUserInfo1234.displayName);
    });

    it('should set the current User and checks if isOwner (2)', function() {
      scope.viewState.isOwner = true;
      var promise = hbpIdentityUserDirectory.getCurrentUser();
      promise.then.mostRecentCall.args[0](otherUserInfo4321);
      expect(scope.viewState.userID).toEqual(otherUserInfo4321.id);
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      expect(scope.viewState.ownerID).toEqual(fakeSimulationData.owner);
      promise = hbpIdentityUserDirectory.get();
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
      var promise = hbpIdentityUserDirectory.getCurrentUser();
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

    it('should show a popup when the reset button is pressed', function() {
      scope.resetButtonClickHandler();
      expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    });

    it('should pass the radio button value to resetService when Collab not available', function() {
      scope.resetButtonClickHandler();
      scope.request = { resetType: RESET_TYPE.RESET_ROBOT_POSE };

      scope.isCollabExperiment = false; //Collab IS NOT available

      hbpDialogFactory.confirm().then.mostRecentCall.args[0]();
      expect(backendInterfaceService.reset).toHaveBeenCalledWith(
        scope.request,
        jasmine.any(Function),
        jasmine.any(Function));
    });

    it('should pass the radio button value to resetCollabService when Collab is available', function() {
      spyOn(_, 'defer');

      scope.resetButtonClickHandler();
      scope.request = { resetType: RESET_TYPE.RESET_WORLD };
      scope.isCollabExperiment = true; //Collab IS available
      scope.splashScreen = undefined;

      hbpDialogFactory.confirm().then.mostRecentCall.args[0]();

      //open splash
      expect(splash.open).toHaveBeenCalled();

      //defer call
      expect(_.defer).toHaveBeenCalled();
      _.defer.mostRecentCall.args[0](); // call deferred function

      expect(splash.spin).toBe(true);
      expect(splash.setMessage).toHaveBeenCalledWith(
        { headline: 'Resetting Environment',
          subHeadline: 'Downloading World SDF from the Collab'
        }
      );

      expect(backendInterfaceService.resetCollab).toHaveBeenCalledWith(
        simulationInfo.contextID,
        scope.request,
        jasmine.any(Function),
        jasmine.any(Function)
      );

      backendInterfaceService.resetCollab.mostRecentCall.args[2](); //2 is the success callback

      expect(splash.close).toHaveBeenCalled();
      expect(scope.splashScreen).not.toBeDefined();

      //reset spies
      splash.close.reset();
      scope.splashScreen = 'isDefined';

      backendInterfaceService.resetCollab.mostRecentCall.args[3](); //3 is the failure callback

      expect(hbpDialogFactory.alert).toHaveBeenCalledWith(
        { title: 'Error.',
          template: 'Error while resetting from Collab storage.'
        }
      );

      expect(splash.close).toHaveBeenCalled();
      expect(scope.splashScreen).not.toBeDefined();

    });

    it('shouldn\'t do anything if no radio button is set', function() {
      scope.resetButtonClickHandler();
      scope.request = { resetType: RESET_TYPE.NO_RESET };
      hbpDialogFactory.confirm().then.mostRecentCall.args[0]();
      expect(backendInterfaceService.reset.calls.length).toBe(0);
    });

    it('should call updateSimulation when the "OLD STYLE RESET" checkbox is clicked', function () {
      spyOn(scope, 'updateSimulation');
      spyOn(scope, 'setEditMode');

      scope.resetButtonClickHandler();
      scope.request = { resetType: RESET_TYPE.RESET_OLD };

      hbpDialogFactory.confirm().then.mostRecentCall.args[0]();
      expect(scope.updateSimulation).toHaveBeenCalledWith(STATE.INITIALIZED);
      expect(scope.setEditMode).toHaveBeenCalledWith(EDIT_MODE.VIEW);
    });

     it('should call resetView() when "Reset Camera view" checkbox is checked', function () {
      //gz3d.scene.resetView is already being spied on

      scope.resetButtonClickHandler();
      scope.request = { resetType: RESET_TYPE.RESET_CAMERA_VIEW };

      hbpDialogFactory.confirm().then.mostRecentCall.args[0]();
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
      // test "done" (without close, with onSimulationDone)
      splash.showButton = true;
      splash.spin = true;
      stateService.addMessageCallback.mostRecentCall.args[0]({progress: { 'block_ui': 'False', done: 'True'}});
      expect(splash.spin).toBe(false);
      expect(splash.setMessage).toHaveBeenCalledWith({ headline: 'Finished' });
      expect(splash.close).not.toHaveBeenCalled();
      // onSimulationDone() should have been called
      expect(stateService.removeMessageCallback).toHaveBeenCalled();

      // test "done" in IF path (with close, without onSimulationDone)
      stateService.currentState = STATE.STOPPED;
      scope.splashScreen = undefined;
      splash.close.reset();
      stateService.removeMessageCallback.reset();
      splash.showButton = false;
      stateService.addMessageCallback.mostRecentCall.args[0]({progress: { 'block_ui': 'True', done: 'True'}});
      expect(splash.close).toHaveBeenCalled();
      // onSimulationDone() should NOT have been called
      expect(stateService.removeMessageCallback).not.toHaveBeenCalled();
      // test "timeout"
      stateService.addMessageCallback.mostRecentCall.args[0]({timeout: 264, simulationTime: 1, realTime: 2});
      expect(scope.simTimeoutText).toBe(264);
      // test "simulationTime"
      expect(scope.simulationTimeText).toBe(1);
      // test "realTime"
      expect(scope.realTimeText).toBe(2);
    });

    it('should NOT open splash screen with when destroy or exit has been called', function () {
      scope.splashScreen = splashInstance;
      scope.$destroy();
      splash.close.reset();

      stateService.addMessageCallback.mostRecentCall.args[0]({progress: { 'block_ui': 'False', task: 'Task1', subtask: 'Subtask1'}});
      expect(splash.close).not.toHaveBeenCalled();
      expect(scope.splashScreen).toBe(null);

      scope.splashScreen = splashInstance;
      scope.exit();
      splash.close.reset();

      stateService.addMessageCallback.mostRecentCall.args[0]({progress: { 'block_ui': 'False', task: 'Task1', subtask: 'Subtask1'}});
      expect(splash.close).not.toHaveBeenCalled();
      expect(scope.splashScreen).toBe(null);
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
      gz3d.scene.selectedEntity = undefined;
      scope.setMaterialOnEntity('value_does_not_matter_here');
      expect(console.error).toHaveBeenCalled();
      expect(console.error.callCount).toEqual(1);

      // pretend we selected a screen now
      var screenGlassName = 'left_vr_screen::body::screen_glass';
      spyOn(scope, 'getScreenGlass').andReturn({name: screenGlassName});
      gz3d.scene.selectedEntity = { 'name' : 'left_vr_screen' };
      scope.setMaterialOnEntity('Gazebo/Red');

      expect(screenControl).toHaveBeenCalledWith(simulationInfo.serverBaseUrl);
      expect(screenControlObject.updateScreenColor).toHaveBeenCalledWith(
        { sim_id: 'mocked_simulation_id' },
        { 'visual_path': screenGlassName, 'material': 'Gazebo/Red' }
      );
    });

    it('should call context menu service if user is the simulation owner', function() {
      var event = {button : 2};

      //false case
      scope.viewState.isOwner = false;

      scope.onContainerMouseDown(event); //call the function under test

      expect(contextMenuState.toggleContextMenu).not.toHaveBeenCalled();

      //true case
      scope.viewState.isOwner = true;

      scope.onContainerMouseDown(event);//call the function under test

      expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(true, event);
    });

    it('should register touch events for the context menu', function() {
      gz3d.scene.container.addEventListener.reset();
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      expect(gz3d.scene.container.addEventListener.calls[0].args[0]).toBe('touchstart');
      expect(gz3d.scene.container.addEventListener.calls[1].args[0]).toBe('touchmove');
      expect(gz3d.scene.container.addEventListener.calls[2].args[0]).toBe('touchend');
    });

    it('should toggle the context menu on touch tap', function() {
      gz3d.scene.container.addEventListener.reset();
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      var touchstart = gz3d.scene.container.addEventListener.calls[0].args[1];
      var touchend = gz3d.scene.container.addEventListener.calls[2].args[1];

      touchstart({touches: [{clientX: 10, clientY: 20}]});
      touchend({});

      expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(true, {clientX: 10, clientY: 20});
    });

    it('should toggle the context menu on touch with a bit move', function() {
      gz3d.scene.container.addEventListener.reset();
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      var touchstart = gz3d.scene.container.addEventListener.calls[0].args[1];
      var touchmove = gz3d.scene.container.addEventListener.calls[1].args[1];
      var touchend = gz3d.scene.container.addEventListener.calls[2].args[1];

      touchstart({touches: [{clientX: 10, clientY: 20}]});
      touchmove({touches: [{clientX: 15, clientY: 25}]});
      touchend({});

      expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(true, {clientX: 15, clientY: 25});
    });

    it('should not toggle the context menu on touch with a large movement', function() {
      gz3d.scene.container.addEventListener.reset();
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      var touchstart = gz3d.scene.container.addEventListener.calls[0].args[1];
      var touchmove = gz3d.scene.container.addEventListener.calls[1].args[1];
      var touchend = gz3d.scene.container.addEventListener.calls[2].args[1];

      touchstart({touches: [{clientX: 10, clientY: 20}]});
      touchmove({touches: [{clientX: 100, clientY: 200}]});
      touchend({});

      expect(contextMenuState.toggleContextMenu).not.toHaveBeenCalled();
    });

    it('should not toggle the context menu on touches with clientX and clientY = 0', function() {
      gz3d.scene.container.addEventListener.reset();
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      var touchstart = gz3d.scene.container.addEventListener.calls[0].args[1];
      var touchmove = gz3d.scene.container.addEventListener.calls[1].args[1];
      var touchend = gz3d.scene.container.addEventListener.calls[2].args[1];

      touchstart({touches: [{clientX: 0, clientY: 0}]});
      touchmove({touches: [{clientX: 0, clientY: 0}]});
      touchend({});

      expect(contextMenuState.toggleContextMenu).not.toHaveBeenCalled();
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

    it('should close gzbridge and splash screens on $destroy', function() {
      stateService.currentState = STATE.STARTED;
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      scope.splashScreen = splashInstance;

      // call the method under test
      scope.$destroy();

      expect(splash.close).toHaveBeenCalled();
      expect(scope.splashScreen).toBe(null);
      expect(assetLoadingSplash.close).toHaveBeenCalled();
      expect(gz3d.iface.webSocket.close).toHaveBeenCalled();
      expect(gz3d.deInitialize).toHaveBeenCalled();
    });

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

    it('should go back to the esv-web page when no "ctx" parameter was in the url', function() {
      stateParams.ctx = undefined;
      scope.exit();
      expect(location.path()).toEqual('/esv-web');
    });

    it('should go back to the esv-collab-run page when a "ctx" parameter was in the url and in view-mode', function() {
      stateParams.ctx = 'fake_ctx_id';
      scope.operationMode = OPERATION_MODE.VIEW;
      scope.exit();
      expect(location.path()).toEqual('/esv-collab/run');
    });

    it('should go back to the esv-collab-edit page when a "ctx" parameter was in the url and in edit-mode', function() {
      stateParams.ctx = 'fake_ctx_id';
      scope.operationMode = OPERATION_MODE.EDIT;
      scope.exit();
      expect(location.path()).toEqual('/esv-collab/edit');
    });

    it('should update simulation\'s initial camera pose', function(){
      scope.updateInitialCameraPose(null);
      expect(gz3d.scene.setDefaultCameraPose).not.toHaveBeenCalled();
      var camPose =  [1.0, 2.0, 3.0, -1.0, -2.0, -3.0];
      scope.updateInitialCameraPose(camPose);
      expect(gz3d.scene.setDefaultCameraPose).toHaveBeenCalled();
    });

    it('should make lightHelpers invisible', function(){
      spyOn(scope, 'setLightHelperVisibility').andCallThrough();
      spyOn(gz3d.scene.scene, 'traverse').andCallThrough();

      scope.onSceneLoaded();

      expect(scope.setLightHelperVisibility).toHaveBeenCalledWith(false);
      expect(gz3d.scene.scene.traverse).toHaveBeenCalled();
      expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(false);
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

    it('should enable display of the editor panel', function() {
      scope.showEditorPanel = false;
      scope.toggleEditors();
      expect(scope.showEditorPanel).toBe(true);
    });

    it('should set all "..._lightHelper" nodes as visible during onSceneLoaded()', function() {
      spyOn(scope, 'setLightHelperVisibility').andCallThrough();
      spyOn(gz3d.scene.scene, 'traverse').andCallThrough();

      scope.onSceneLoaded();

      expect(scope.setLightHelperVisibility).toHaveBeenCalledWith(true);
      expect(gz3d.scene.scene.traverse).toHaveBeenCalled();
      expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(true);
    });

    it(' - setLightHelperVisibility() should work', function() {
      spyOn(gz3d.scene.scene, 'traverse').andCallThrough();

      expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(false);

      scope.setLightHelperVisibility(true);

      expect(gz3d.scene.scene.traverse).toHaveBeenCalled();
      expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(true);
    });

    it('should get the screen glass entity if any', function() {
      var entity = { traverse: jasmine.createSpy('traverse') };
      scope.getScreenGlass(entity);
      var traverseCallback = entity.traverse.mostRecentCall.args[0];
      var node = {name: 'vr_screen::body::screen_glass'};
      expect(traverseCallback(node)).toEqual(node);
    });

    it(' - onContainerMouseDown() should make the right calls', function() {
      var eventMock = {};

      scope.onContainerMouseDown(eventMock);
      expect(contextMenuState.toggleContextMenu).not.toHaveBeenCalled();

      scope.viewState.isOwner = true;

      eventMock.button = 0;  // left mouse
      scope.onContainerMouseDown(eventMock);
      expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(false);

      eventMock.button = 1;  // left mouse
      scope.onContainerMouseDown(eventMock);
      expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(false);

      eventMock.button = 2;  // left mouse
      scope.onContainerMouseDown(eventMock);
      expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(true, eventMock);
    });

    it(' - onContainerMouseUp() should make the right calls', function() {
      var eventMock = {};

      objectInspectorService.update.reset();
      scope.viewState.isOwner = false;
      scope.onContainerMouseUp(eventMock);
      expect(objectInspectorService.update).not.toHaveBeenCalled();

      objectInspectorService.update.reset();
      scope.viewState.isOwner = true;
      objectInspectorService.isShown = false;
      eventMock.button = 0;  // left mouse
      scope.onContainerMouseUp(eventMock);
      expect(objectInspectorService.update).not.toHaveBeenCalled();

      objectInspectorService.update.reset();
      objectInspectorService.isShown = true;
      eventMock.button = 0;  // left mouse
      scope.onContainerMouseUp(eventMock);
      expect(objectInspectorService.update).toHaveBeenCalled();

      objectInspectorService.update.reset();
      eventMock.button = 1;  // left mouse
      scope.onContainerMouseUp(eventMock);
      expect(objectInspectorService.update).toHaveBeenCalled();

      objectInspectorService.update.reset();
      eventMock.button = 2;  // left mouse
      scope.onContainerMouseUp(eventMock);
      expect(objectInspectorService.update).not.toHaveBeenCalled();
    });
  });

});

describe('Controller: Gz3dViewCtrl - mocked window', function () {
  var Gz3dViewCtrl,
      controller,
      scope,
      rootScope,
      stateService,
      window,
      document;

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  beforeEach(module(function ($provide) {
    var getCurrentStateSpy = jasmine.createSpy('getCurrentState');
    var getThenSpy = jasmine.createSpy('then');

    getCurrentStateSpy.andCallFake(function () {
      return { then: getThenSpy.andCallFake(function (f) { f(); }) };
    });

    $provide.value('stateService', {
      Initialize: jasmine.createSpy('Initialize'),
      startListeningForStatusInformation: jasmine.createSpy('startListeningForStatusInformation'),
      stopListeningForStatusInformation: jasmine.createSpy('stopListeningForStatusInformation'),
      addStateCallback: jasmine.createSpy('addStateCallback'),
      removeStateCallback: jasmine.createSpy('removeStateCallback'),
      addMessageCallback: jasmine.createSpy('addMessageCallback'),
      removeMessageCallback: jasmine.createSpy('removeMessageCallback'),
      getCurrentState: getCurrentStateSpy
    });
    var stateParamsMock = {
      serverID : 'bbpce016',
      simulationID : 'mocked_simulation_id'
    };
    $provide.value('$stateParams', stateParamsMock);
    var gz3dMock = {
      Initialize : jasmine.createSpy('Initialize'),
      deInitialize : jasmine.createSpy('deInitialize'),
      scene : {
        container : {
          addEventListener : jasmine.createSpy('addEventListener')
        }
      },
      iface: {
        setAssetProgressCallback: jasmine.createSpy('setAssetProgressCallback'),
        registerWebSocketConnectionCallback: jasmine.createSpy('registerWebSocketConnectionCallback')
      }
    };
    //provide gz3dMock
    $provide.value('gz3d', gz3dMock);

    var ROSLIB = { Topic: {prototype: {} } };
    $provide.value('$window', {
      document: { getElementById: function(){}},
      ROSLIB: ROSLIB,
      stop: jasmine.createSpy('stop'),
      addEventListener: function() {}
    });
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _stateService_,
                              _$window_,
                              _$document_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    stateService = _stateService_;
    window = _$window_;
    document = _$document_;
    scope.viewState = {};
  }));

  describe('(Clean up code tested with a mocked window object)', function () {
    beforeEach(function(){
      Gz3dViewCtrl = controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });
    });

    it('should call execCommand on destroy', function() {
      // Fake IE browser behavior
      // The stop() method is not supported by Internet Explorer
      // https://developer.mozilla.org/de/docs/Web/API/Window/stop
      document.execCommand = jasmine.createSpy('execCommand');
      scope.onSimulationDone();
      expect(window.stop).toHaveBeenCalled();
      expect(document.execCommand).not.toHaveBeenCalled();
      window.stop = undefined;
      scope.onSimulationDone();
      expect(document.execCommand).toHaveBeenCalled();
    });

    it('should close rosbridge connections on onSimulationDone', function() {
      stateService.stopListeningForStatusInformation.reset();
      stateService.removeMessageCallback.reset();

      // call the method under test
      scope.onSimulationDone();

      expect(stateService.stopListeningForStatusInformation).toHaveBeenCalled();
      expect(stateService.removeMessageCallback).toHaveBeenCalled();
      expect(window.stop).toHaveBeenCalled();
    });
  });

});
