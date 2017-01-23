/* global THREE: false */

'use strict';

describe('Controller: Gz3dViewCtrl', function () {
  var Gz3dViewCtrl,
      controller,
      scope,
      rootScope,
      log,
      timeout,
      window,
      document,
      location,
      cameraManipulation,
      splash,
      simulationState,
      simulationControl,
      stateService,
      simulationInfo,
      contextMenuState,
      colorableObjectService,
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
      EDIT_MODE,
      panels,
      gz3d,
      hbpDialogFactory,
      backendInterfaceService,
      RESET_TYPE,
      objectInspectorService,
      userNavigationService,
      collabExperimentLockService,
      collabExperimentLockServiceMock ={},
      lockServiceMock,
      q,
      callback,
      onLockChangedCallback,
      experimentProxyService,
      experimentList,
      lockServiceCancelCallback,
      NAVIGATION_MODES;

  var simulationStateObject = {
    update: jasmine.createSpy('update'),
    state: jasmine.createSpy('state')
  };

  var simulationControlObject = {
    simulation: jasmine.createSpy('simulation')
  };

  var assetLoadingSplashInstance = {
    close: jasmine.createSpy('close')
  };

  var nrpBackendVersionsObject = {
    get: jasmine.createSpy('get')
  };

  var objectInspectorServiceMock = {
    toggleView: jasmine.createSpy('toggleView'),
    update: jasmine.createSpy('update'),
    removeEventListeners: jasmine.createSpy('removeEventListeners')
  };

  var userNavigationServiceMock = {
    init: jasmine.createSpy('init'),
    deinit: jasmine.createSpy('deinit'),
    setDefaultPose: jasmine.createSpy('setDefaultPose'),
    isUserAvatar: jasmine.createSpy('isUserAvatar').andCallFake(function(entity) {
      return entity.name === 'user-avatar';
    }),
    setModeFreeCamera: jasmine.createSpy('setModeFreeCamera'),
    setModeGhost: jasmine.createSpy('setModeGhost'),
    setModeHumanBody: jasmine.createSpy('setModeHumanBody'),
  };

  var simulationConfigServiceMock = {};

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

    var collab3DSettingsServiceMock = {};

    collab3DSettingsServiceMock.loadSettings = function()
    {
      var res = {};
      res.finally = function (callback)
      {
        callback(true);
      };
      return res;
    };

    $provide.value('collab3DSettingsService', collab3DSettingsServiceMock);

    simulationConfigServiceMock.simulateCatch = false;

    simulationConfigServiceMock.doesConfigFileExist = function ()
    {
      var res = {};
      res.then = function (callback)
      {
        callback(true);
      };
      return res;
    };

    simulationConfigServiceMock.loadConfigFile = function ()
    {
      var that = this;
      var res = {};
      res.then = function (callback)
      {
        callback('{"shadows":true,"antiAliasing":true,"ssao":false,"ssaoDisplay":false,"ssaoClamp":0.8,"ssaoLumInfluence":0.7,"rgbCurve":{"red":[[0,0],[0.277587890625,0.2623291015625],[0.683837890625,0.7545166015625],[1,1]],"green":[[0,0],[0.324462890625,0.3560791015625],[0.636962890625,0.7193603515625],[1,1]],"blue":[[0,0],[0.515869140625,0.4693603515625],[1,1]]},"levelsInBlack":0.14,"levelsInGamma":1.44,"levelsInWhite":1,"levelsOutBlack":0,"levelsOutWhite":1,"skyBox":"img/3denv/sky/clouds/clouds","sun":"SIMPLELENSFLARE","bloom":true,"bloomStrength":"0.35","bloomRadius":0.37,"bloomThreshold":0.98,"fog":true,"fogDensity":"0.04","fogColor":"#d8ccb1"}');

        var catchres = {};

        catchres.catch = function(callback)
        {
          if (that.simulateCatch)
          {
            callback();
          }
        };

        return catchres;
      };
      return res;
    };

    $provide.value('simulationConfigService', simulationConfigServiceMock);


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
          emit: jasmine.createSpy('emit')
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
        scene: new THREE.Scene(),
        selectEntity: jasmine.createSpy('selectEntity'),
        applyComposerSettings: jasmine.createSpy('applyComposerSettings')
      },
      iface: {
        addCanDeletePredicate: angular.noop,
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
    gz3dMock.scene.scene.showLightHelpers = true;
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
    $provide.value('simulationState', jasmine.createSpy('simulationState').andReturn(simulationStateObject));
    $provide.value('simulationControl',  jasmine.createSpy('simulationControl').andReturn(simulationControlObject));

    var colorableObjectServiceMock = {
      setEntityMaterial: jasmine.createSpy('setEntityMaterial')
    };

    $provide.value('colorableObjectService', colorableObjectServiceMock);

    var hbpIdentityUserDirectoryMock = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').andReturn({then: jasmine.createSpy('then')}),
      get: jasmine.createSpy('get').andReturn({then: jasmine.createSpy('then')})
    };
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectoryMock);
    $provide.value('nrpBackendVersions', jasmine.createSpy('nrpBackendVersions').andReturn(nrpBackendVersionsObject));
    $provide.value('nrpFrontendVersion', { get: jasmine.createSpy('get') });
    $provide.value('serverError', jasmine.createSpy('serverError'));
    $provide.value('panels', { open: jasmine.createSpy('open') });
    var proxyMock = {
      getExperiments: jasmine.createSpy('getExperiments').andReturn({ then: jasmine.createSpy('then') }),
    };
    $provide.value('experimentProxyService', proxyMock);
    var experimentListMock = {
      experiments: jasmine.createSpy('experiments'),
    };
    $provide.value('experimentList',jasmine.createSpy('experimentList').andReturn(experimentListMock));
    var configuration = { description: 'The Husky robot plays chess with Icub', name: 'TrueBlue', cameraPose: { x: 1.0, y: 2.0, z: 3.0 } };
    simulationInfo = {
      serverConfig: { rosbridge: {topics: {} }},
      serverID: 'bbpce016',
      simulationID: 'mocked_simulation_id',
      serverBaseUrl: 'http://bbpce016.epfl.ch:8080',
      Initialize: jasmine.createSpy('Initialize'),
      mode: undefined,
      contextID: '97923877-13ea-4b43-ac31-6b79e130d344',
      experimentDetails: configuration,
      experimentID: 'experimentID'
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

    $provide.value('collabExperimentLockService', collabExperimentLockServiceMock);

    $provide.value('userNavigationService', userNavigationServiceMock);

    simulationStateObject.update.reset();
    simulationStateObject.state.reset();
    simulationControlObject.simulation.reset();
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
                              _$log_,
                              _hbpIdentityUserDirectory_,
                              _$timeout_,
                              _$window_,
                              _$document_,
                              _$location_,
                              _cameraManipulation_,
                              _splash_,
                              _assetLoadingSplash_,
                              _simulationState_,
                              _simulationControl_,
                              _stateService_,
                              _contextMenuState_,
                              _colorableObjectService_,
                              _nrpBackendVersions_,
                              _nrpFrontendVersion_,
                              _STATE_,
                              _UI_,
                              _EDIT_MODE_,
                              _panels_,
                              _gz3d_,
                              _experimentSimulationService_,
                              _hbpDialogFactory_,
                              _backendInterfaceService_,
                              _RESET_TYPE_,
                              _objectInspectorService_,
                              _userNavigationService_,
                              _collabExperimentLockService_,
                              _experimentProxyService_,
                              _experimentList_,
                              _$q_,
                              _NAVIGATION_MODES_) {
    controller = $controller;
    rootScope = $rootScope;
    log = _$log_;
    scope = $rootScope.$new();
    hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
    timeout = _$timeout_;
    window = _$window_;
    window.location.reload = function () { };
    document = _$document_;
    location = _$location_;
    cameraManipulation = _cameraManipulation_;
    splash = _splash_;
    assetLoadingSplash = _assetLoadingSplash_;
    simulationState = _simulationState_;
    simulationControl = _simulationControl_;
    stateService = _stateService_;
    contextMenuState = _contextMenuState_;
    colorableObjectService = _colorableObjectService_;
    nrpBackendVersions = _nrpBackendVersions_;
    nrpFrontendVersion = _nrpFrontendVersion_;
    STATE = _STATE_;
    UI = _UI_;
    EDIT_MODE = _EDIT_MODE_;
    NAVIGATION_MODES = _NAVIGATION_MODES_;
    panels = _panels_;
    gz3d = _gz3d_;
    hbpDialogFactory = _hbpDialogFactory_;
    backendInterfaceService = _backendInterfaceService_;
    RESET_TYPE = _RESET_TYPE_;
    objectInspectorService = _objectInspectorService_;
    userNavigationService = _userNavigationService_;
    collabExperimentLockService = _collabExperimentLockService_;
    experimentProxyService =_experimentProxyService_;
    experimentList = _experimentList_;
    q = _$q_;

    callback = q.defer();
    lockServiceCancelCallback = jasmine.createSpy('cancelCallback');
    lockServiceMock = {
      tryAddLock : jasmine.createSpy('tryAddLock').andReturn(callback.promise),
      onLockChanged: jasmine.createSpy('onLockChanged').andCallFake(function (fn) {onLockChangedCallback = fn; return lockServiceCancelCallback;}),
      releaseLock: jasmine.createSpy('releaseLock').andReturn(callback.promise)
    };
    collabExperimentLockServiceMock.createLockServiceForContext = function(){
      return lockServiceMock;
    };

    scope.viewState = {};
    simulations = [
      { simulationID: 0, experimentConfiguration: 'fakeExperiment0', state: STATE.CREATED },
      { simulationID: 1, experimentConfiguration: 'fakeExperiment1', state: STATE.INITIALIZED },
      { simulationID: 2, experimentConfiguration: 'fakeExperiment2', state: STATE.PAUSED },
      { simulationID: 3, experimentConfiguration: 'fakeExperiment3', state: STATE.STARTED },
      { simulationID: 4, experimentConfiguration: 'fakeExperiment4', state: STATE.STOPPED},
      { simulationID: 5, experimentConfiguration: 'fakeExperiment5', state: STATE.INITIALIZED},
      { simulationID: 6, experimentConfiguration: 'fakeExperiment6', state: STATE.CREATED}
    ];

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

    // create mock for $log
    spyOn(log, 'error');
  }));

  describe('(ViewMode)', function () {
    var currentUserInfo1234, currentUserInfo1234Hash, otherUserInfo4321;

    beforeEach(function () {
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

    it('should call and stateService.Initialize()', function(){
      expect(stateService.Initialize.callCount).toBe(1);
    });

    it('should set isJoiningStoppedSimulation to true when already stopped', function(){
      expect(scope.viewState.isJoiningStoppedSimulation).toBe(false);
      stateService.currentState = STATE.STOPPED;
      stateService.getCurrentState().then.mostRecentCall.args[0]();
      expect(scope.viewState.isJoiningStoppedSimulation).toBe(true);
    });

    it('should properly update navigation mode', function(){

      userNavigationService.nagitationMode =  NAVIGATION_MODES.FREE_CAMERA;
      scope.setNavigationMode(NAVIGATION_MODES.FREE_CAMERA);
      expect(userNavigationService.setModeFreeCamera).toHaveBeenCalled();

      scope.setNavigationMode(NAVIGATION_MODES.GHOST);
      expect(userNavigationService.setModeGhost).toHaveBeenCalled();

      scope.setNavigationMode(NAVIGATION_MODES.HUMAN_BODY);
      expect(userNavigationService.setModeHumanBody).toHaveBeenCalled();
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

    it('should condition editability', function () {
      window.bbpConfig.localmode.forceuser = true;

      simulationInfo.isCollabExperiment = true;
      controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });

      expect(onLockChangedCallback).toBeDefined();
      onLockChangedCallback({ locked: true, lockInfo: { user: { id: scope.viewState.userID } } });
      expect(scope.editIsDisabled).toBe(false);
      onLockChangedCallback({ locked: true, lockInfo: { user: {} } });
      expect(scope.editIsDisabled).toBe(true);

      scope.showEditorPanel = true;
      scope.userEditingID = scope.viewState.userID;
      onLockChangedCallback({ locked: false });
      expect(scope.showEditorPanel).toBe(false);
    });

    it('should toggle showEditorPanel visibility on codeEditorButtonClickHandler()', function () {
      scope.showEditorPanel = true;
      scope.codeEditorButtonClickHandler();
      expect(scope.showEditorPanel).toBe(false);
    });

    it('should have editRights when owner', function () {
      scope.viewState.isOwner = false;
      expect(scope.viewState.hasEditRights({name: 'not-user-avatar'})).toBe(false);
      scope.viewState.isOwner = true;
      expect(scope.viewState.hasEditRights({name: 'not-user-avatar'})).toBe(true);
      expect(userNavigationServiceMock.isUserAvatar).toHaveBeenCalled();
    });

    it('should have editRights for user avatar', function () {
      scope.viewState.isOwner = false;
      expect(scope.viewState.hasEditRights({name: 'user-avatar'})).toBe(true);
      expect(userNavigationServiceMock.isUserAvatar).toHaveBeenCalled();
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

    it('should initialize experimentDetails', function() {
      window.bbpConfig.localmode.forceuser = true;
      controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });
      scope.experimentConfiguration = 'test_config';
      spyOn(scope, 'updateInitialCameraPose');
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      scope.$digest(); // force the $watch to be evaluated in experimentDetails
      var configuration = simulationInfo.experimentDetails;
      expect(scope.ExperimentDescription).toBe(configuration.description);
      expect(scope.ExperimentName).toBe(configuration.name);
      expect(scope.updateInitialCameraPose).toHaveBeenCalledWith(configuration.cameraPose);

      window.bbpConfig.localmode.forceuser = false;
    });

    it('should initialize experimentDetails when in collab mode', function() {
      window.bbpConfig.localmode.forceuser = true;
      controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });
      scope.isCollabExperiment = true;
      spyOn(scope, 'updateInitialCameraPose');
      simulationControlObject.simulation.mostRecentCall.args[1](fakeSimulationData);
      scope.$digest(); // force the $watch to be evaluated in experimentDetails
      var configuration = simulationInfo.experimentDetails;
      expect(scope.ExperimentDescription).toBe(configuration.description);
      expect(scope.ExperimentName).toBe(configuration.name);
      expect(scope.updateInitialCameraPose).toHaveBeenCalledWith(configuration.cameraPose);
      window.bbpConfig.localmode.forceuser = false;
    });
    it('should ensure that the state is PAUSED when resetting', function() {
      scope.resetButtonClickHandler();

      hbpDialogFactory.confirm().then.mostRecentCall.args[0]();

      expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));
    });

    it('should show a popup when the reset button is pressed', function() {
      scope.resetButtonClickHandler();
      expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    });

    it('should pass the radio button value to resetService when Collab not available', function() {

      scope.request = { resetType: RESET_TYPE.RESET_ROBOT_POSE };

      scope.__resetButtonClickHandler();
      timeout.flush(100);

      scope.isCollabExperiment = false; //Collab IS NOT available

      expect(backendInterfaceService.reset).toHaveBeenCalledWith(
        scope.request,
        jasmine.any(Function),
        jasmine.any(Function));

      var successCallback = backendInterfaceService.reset.mostRecentCall.args[1];
      successCallback();
      timeout.flush(100);
      expect(gz3d.scene.applyComposerSettings).toHaveBeenCalledWith(true, false);
     });

    it('should notify the widgets when resetting', function() {
      spyOn(scope, 'notifyResetToWidgets').andCallThrough();

      scope.request = { resetType: RESET_TYPE.RESET_WORLD };

      scope.__resetButtonClickHandler();
      timeout.flush(100);

      expect(scope.notifyResetToWidgets).toHaveBeenCalledWith(RESET_TYPE.RESET_WORLD);
    });

    it('should hide object inspector window when resetting', function() {
      scope.request = { resetType: RESET_TYPE.RESET_FULL };

      scope.__resetButtonClickHandler();
      timeout.flush(100);

      expect(objectInspectorService.toggleView).toHaveBeenCalled();
      expect(gz3d.scene.selectEntity).toHaveBeenCalled();
    });

    it('should pass the radio button value to resetCollabService when Collab is available', function() {
      spyOn(_, 'defer');

      var testWorld = {type: RESET_TYPE.RESET_WORLD, headline: 'Resetting Environment', subHeadline: 'Downloading World SDF from the Collab'};
      var testBrain = {type: RESET_TYPE.RESET_BRAIN, headline: 'Resetting Brain', subHeadline: 'Downloading brain configuration file from the Collab'};
      var testCases = [testWorld, testBrain];

      for (var i = 0; i < testCases.length; i++) {

        scope.resetButtonClickHandler();
        scope.request = { resetType: testCases[i].type };
        scope.isCollabExperiment = true; //Collab IS available
        scope.splashScreen = undefined;

        hbpDialogFactory.confirm().then.mostRecentCall.args[0]();

        timeout.flush(100);
        expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));

        //ensureStateBeforeExecuting's first parameter is a state, second is a callback
        var resetFunction = stateService.ensureStateBeforeExecuting.mostRecentCall.args[1];

        resetFunction(); // call the callback
        timeout.flush(100);

        //open splash
        expect(splash.open).toHaveBeenCalled();

        //defer call
        expect(_.defer).toHaveBeenCalled();
        _.defer.mostRecentCall.args[0](); // call deferred function

        expect(splash.spin).toBe(true);
        expect(splash.setMessage).toHaveBeenCalledWith(
          { headline: testCases[i].headline,
            subHeadline: testCases[i].subHeadline
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
        timeout.flush(100);

        expect(hbpDialogFactory.alert).toHaveBeenCalledWith(
          { title: 'Error.',
            template: 'Error while resetting from Collab storage.'
          }
        );

        expect(splash.close).toHaveBeenCalled();
        expect(scope.splashScreen).not.toBeDefined();
      }
    });

    it('shouldn\'t do anything if no radio button is set', function() {
      scope.resetButtonClickHandler();
      scope.request = { resetType: RESET_TYPE.NO_RESET };
      hbpDialogFactory.confirm().then.mostRecentCall.args[0]();
      expect(backendInterfaceService.reset.calls.length).toBe(0);
    });

    it('should reset GUI when reset type is RESET.RESET_ALL', function () {
      spyOn(scope, 'resetGUI').andCallThrough();

      scope.$broadcast('RESET', RESET_TYPE.RESET_FULL);
      scope.$digest();

      expect(scope.resetGUI).toHaveBeenCalled();
    });

    it('should call resetView() when "Reset Camera view" checkbox is checked', function () {
      //gz3d.scene.resetView is already being spied on

      scope.resetButtonClickHandler();
      scope.request = { resetType: RESET_TYPE.RESET_CAMERA_VIEW };

      scope.__resetButtonClickHandler();
      timeout.flush(100);
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
      scope.sceneLoading = false;
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
      expect(log.error).toHaveBeenCalled();
      expect(log.error.callCount).toEqual(1);

      gz3d.scene.selectedEntity = { 'name' : 'left_vr_screen' };
      scope.setMaterialOnEntity('Gazebo/Red');

      expect(colorableObjectService.setEntityMaterial).toHaveBeenCalledWith(
        simulationInfo,
        gz3d.scene.selectedEntity,
        'Gazebo/Red'
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
    });


    it('should return false if gz3d.scene is undefined', function() {
      gz3d.scene = undefined;
      expect(scope.isGlobalLightMinReached()).toBe(false);
      expect(scope.isGlobalLightMaxReached()).toBe(false);
    });


    it('should return true or false depending on light intensity information', function() {
      var lightInfoReturnValue = { max: 0.1 };
      gz3d.scene.findLightIntensityInfo = function()
      {
        return lightInfoReturnValue;
      };
      expect(scope.isGlobalLightMinReached()).toBe(true);
      expect(scope.isGlobalLightMaxReached()).toBe(false);
      lightInfoReturnValue.max = 1.0;
      expect(scope.isGlobalLightMinReached()).toBe(false);
      expect(scope.isGlobalLightMaxReached()).toBe(true);
    });


    it('should test light change', function() {

      var initiaLightness = 0.5;
      gz3d.scene.scene = {};
      gz3d.scene.emitter = { lightDiffuse: initiaLightness };
      gz3d.scene.findLightIntensityInfo = function()
      {
        return {min:this.emitter.lightDiffuse,max:this.emitter.lightDiffuse};
      };

      gz3d.scene.emitter.emit = function (msg, direction)
      {
        this.lightDiffuse += direction;
      };

      scope.lightDiffuse = initiaLightness;

      scope.modifyLightClickHandler(1, 'INCREASE_LIGHT');
      expect(gz3d.scene.emitter.lightDiffuse).toBeGreaterThan(initiaLightness);

      scope.modifyLightClickHandler(-1, 'DECREASE_LIGHT');
      scope.modifyLightClickHandler(-1, 'DECREASE_LIGHT');
      expect(gz3d.scene.emitter.lightDiffuse).toBeLessThan(initiaLightness);
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
      scope.spikeTrainButtonClickHandler();
      expect(scope.showSpikeTrain).toBe(true);
    });

    it('should toggle the showJoinPlot variable', function() {
      expect(scope.showJointPlot).toBe(false);
      scope.jointPlotButtonClickHandler();
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
      scope.robotViewButtonClickHandler();
      expect(scope.showRobotView).toBe(true);
      expect(gz3d.scene.viewManager.views[0].active).toBe(false);
      expect(gz3d.scene.viewManager.views[0].container.style.visibility).toBe('hidden');
      expect(gz3d.scene.viewManager.views[1].active).toBe(true);
      expect(gz3d.scene.viewManager.views[1].container.style.visibility).toBe('visible');
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

    it('should close gzbridge on $destroy', function() {
      stateService.currentState = STATE.STARTED;
      stateService.getCurrentState().then.mostRecentCall.args[0]();

      // call the method under test
      scope.$destroy();

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

    it('should toggle the help mode variable and show the help text correctly', function() {
      scope.helpModeActivated = false;
      scope.toggleHelpMode();

      expect(scope.helpModeActivated).toBe(true);
      expect(scope.helpDescription).toBe('');
      expect(scope.currentSelectedUIElement).toBe(UI.UNDEFINED);

      scope.simControlButtonHandler('state', 'PLAY_BUTTON');
      expect(scope.currentSelectedUIElement).toBe(UI.PLAY_BUTTON);
      expect(scope.helpDescription).toBe(scope.helpText[UI.PLAY_BUTTON]);
      scope.simControlButtonHandler('state', 'PLAY_BUTTON');
      expect(scope.currentSelectedUIElement).toBe(UI.UNDEFINED);
      expect(scope.helpDescription).toBe('');

      scope.resetButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.RESET_BUTTON);
      expect(scope.helpDescription).toBe(scope.helpText[UI.RESET_BUTTON]);

      scope.timeDisplayClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.TIME_DISPLAY);
      expect(scope.helpDescription).toBe(scope.helpText[UI.TIME_DISPLAY]);

      scope.modifyLightClickHandler(1, 'INCREASE_LIGHT');
      expect(scope.currentSelectedUIElement).toBe(UI.INCREASE_LIGHT);
      expect(scope.helpDescription).toBe(scope.helpText[UI.INCREASE_LIGHT]);

      scope.modifyLightClickHandler(1, 'DECREASE_LIGHT');
      expect(scope.currentSelectedUIElement).toBe(UI.DECREASE_LIGHT);
      expect(scope.helpDescription).toBe(scope.helpText[UI.DECREASE_LIGHT]);

      scope.cameraTranslationButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.CAMERA_TRANSLATION);
      expect(scope.helpDescription).toBe(scope.helpText[UI.CAMERA_TRANSLATION]);

      scope.cameraRotationButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.CAMERA_ROTATION);
      expect(scope.helpDescription).toBe(scope.helpText[UI.CAMERA_ROTATION]);

      scope.spikeTrainButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.SPIKE_TRAIN);
      expect(scope.helpDescription).toBe(scope.helpText[UI.SPIKE_TRAIN]);

      scope.jointPlotButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.JOINT_PLOT);
      expect(scope.helpDescription).toBe(scope.helpText[UI.JOINT_PLOT]);

      scope.robotViewButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.ROBOT_VIEW);
      expect(scope.helpDescription).toBe(scope.helpText[UI.ROBOT_VIEW]);

      scope.ownerInformationClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.OWNER_DISPLAY);
      expect(scope.helpDescription).toBe(scope.helpText[UI.OWNER_DISPLAY]);

      scope.environmentSettingsClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.ENVIRONMENT_SETTINGS);
      expect(scope.helpDescription).toBe(scope.helpText[UI.ENVIRONMENT_SETTINGS]);

      scope.navigationModeMenuClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.USER_NAVIGATION);
      expect(scope.helpDescription).toBe(scope.helpText[UI.USER_NAVIGATION]);

      scope.codeEditorButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.CODE_EDITOR);
      expect(scope.helpDescription).toBe(scope.helpText[UI.CODE_EDITOR]);

      scope.brainVisualizerButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.BRAIN_VISUALIZER);
      expect(scope.helpDescription).toBe(scope.helpText[UI.BRAIN_VISUALIZER]);

      scope.logConsoleButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.LOG_CONSOLE);
      expect(scope.helpDescription).toBe(scope.helpText[UI.LOG_CONSOLE]);

      scope.exitButtonClickHandler();
      expect(scope.currentSelectedUIElement).toBe(UI.EXIT_BUTTON);
      expect(scope.helpDescription).toBe(scope.helpText[UI.EXIT_BUTTON]);
    });

    it('should go back to the esv-web page when no "ctx" parameter was in the url', function() {
      scope.isCollabExperiment = false;
      scope.exit();
      expect(location.path()).toEqual('/esv-web');
    });

    it('should update simulation\'s initial camera pose', function(){
      scope.updateInitialCameraPose(null);
      expect(gz3d.scene.setDefaultCameraPose).not.toHaveBeenCalled();
      var camPose =  [1.0, 2.0, 3.0, -1.0, -2.0, -3.0];
      scope.updateInitialCameraPose(camPose);
      expect(gz3d.scene.setDefaultCameraPose).toHaveBeenCalled();
    });
  });

  describe('(EditMode)', function() {
    beforeEach(function () {
      simulationInfo.isCollabExperiment = true;
      lockServiceMock.tryAddLock.reset();
      lockServiceMock.releaseLock.reset();

      Gz3dViewCtrl = controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope,
        collabExperimentLockService: collabExperimentLockService
      });
    });

    it('should go back to the esv-web page when a "ctx" parameter was in the url', function() {
      scope.exit().then(function(){
        expect(location.path()).toEqual('/esv-web');
        expect(lockServiceCancelCallback).toHaveBeenCalled();
        expect(lockServiceMock.releaseLock).toHaveBeenCalled();
      });
    });

    it('should remove lock when destroy is called', function () {
      scope.$destroy();
      expect(lockServiceCancelCallback).toHaveBeenCalled();
      expect(lockServiceMock.releaseLock).toHaveBeenCalled();
    });
    it('should enable display of the editor panel', function () {
      scope.showEditorPanel = false;
      scope.isCollabExperiment = false;
      scope.toggleEditors();
      expect(scope.showEditorPanel).toBe(true);
    });

    it('should enable display of the editor panel in collab mode when there is no lock', function () {
      scope.showEditorPanel = false;
      scope.viewState.userID = 'test-user-id';
      scope.userEditingID ='';

      scope.toggleEditors();
      callback.resolve({ 'success': true });
      scope.$apply();

      expect(lockServiceMock.tryAddLock).toHaveBeenCalled();
      expect(scope.showEditorPanel).toBe(true);
      expect(scope.userEditingID).toBe('test-user-id');
    });

    it('should enable display of the editor panel in collab mode when there is a lock but the current user is the owner of the lock', function () {
      scope.showEditorPanel = false;
      var ownerId = 'my-id';
      scope.viewState.userID = ownerId;

      scope.toggleEditors();
      callback.resolve({ 'success': false, 'lock': { 'lockInfo': { 'user': { 'id': ownerId, 'displayName': 'test' }, 'date': 'thedate' } } });
      scope.$apply();

      expect(lockServiceMock.tryAddLock).toHaveBeenCalled();
      expect(scope.showEditorPanel).toBe(true);
      expect(scope.userEditingID).toBe(ownerId);
    });

    it('should NOT enable display of the editor panel in collab mode when there is a lock', function () {
      scope.showEditorPanel = false;
      scope.viewState.userID = 'current_user_id';
      var userName = 'testName';
      var theDate = '2016-05-17T17:21:05';
      var notCurrentUser = 'not_current_user';

      scope.toggleEditors();
      callback.resolve({ 'success': false, 'lock': { 'lockInfo': { 'user': { 'id': notCurrentUser, 'displayName': userName }, 'date': theDate } } });
      scope.$apply();

      expect(lockServiceMock.tryAddLock).toHaveBeenCalled();
      expect(scope.editIsDisabled).toBe(true);
      expect(scope.showEditorPanel).toBe(false);
      expect(scope.userEditingID).toBe(notCurrentUser);
      expect(scope.userEditing).toBe(userName);
      expect(scope.timeEditStarted).toBe(moment(new Date(theDate)).fromNow());

    });

    it('should NOT enable display of the editor panel in collab mode when an exception is thrown trying to get the lock', function () {
      scope.showEditorPanel = false;
      scope.viewState.userID = 'current_user_id';

      scope.toggleEditors();
      callback.reject('something went wrong');
      scope.$apply();

      expect(lockServiceMock.tryAddLock).toHaveBeenCalled();
      expect(scope.showEditorPanel).toBe(false);
      expect(scope.userEditingID).toBe('');
      expect(scope.userEditing).toBe('');
      expect(scope.timeEditStarted).toBe('');
    });

    it('should remove display of the editor panel and remove lock', function () {
      scope.showEditorPanel = true;
      scope.toggleEditors();
      callback.resolve();
      scope.$apply();

      expect(lockServiceMock.releaseLock).toHaveBeenCalled();
      expect(lockServiceMock.releaseLock.callCount).toBe(1);
    });

    it('should set all "..._lightHelper" nodes as visible during onSceneLoaded()', function () {
      spyOn(scope, 'setLightHelperVisibility').andCallThrough();
      spyOn(gz3d.scene.scene, 'traverse').andCallThrough();

      scope.onSceneLoaded();

      expect(scope.setLightHelperVisibility).toHaveBeenCalled();
      expect(gz3d.scene.scene.traverse).toHaveBeenCalled();
      expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(true);
    });

    it(' - setLightHelperVisibility() should work', function() {
      spyOn(gz3d.scene.scene, 'traverse').andCallThrough();

      expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(false);

      gz3d.scene.showLightHelpers = true;

      scope.setLightHelperVisibility();

      expect(gz3d.scene.scene.getObjectByName('test_lightHelper').visible).toBe(true);
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

  });


  describe('(BrainVisualizer)', function ()
  {
    beforeEach(function ()
    {
      Gz3dViewCtrl = controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope,
      });
    });

    it('should init brain visualizer data', function ()
    {
      simulationConfigServiceMock.simulateCatch = false;
      scope.initBrainvisualizerData();
      scope.$digest();
      expect(scope.loadingBrainvisualizerPanel).toBe(false);
    });

    it('should disable brain visualizer when no data', function ()
    {
      simulationConfigServiceMock.simulateCatch = true;
      scope.initBrainvisualizerData();
      scope.$digest();
      expect(scope.brainvisualizerIsDisabled).toBe(true);
    });

    it('should enable display of the brainvisualizer panel', function ()
    {
      scope.showBrainvisualizerPanel = false;
      scope.toggleBrainvisualizer();
      expect(scope.showBrainvisualizerPanel).toBe(true);
    });

    it('should open of the brainvisualizer panel', function ()
    {
      scope.loadingBrainvisualizerPanel = false;
      scope.brainvisualizerIsDisabled = false;
      scope.showBrainvisualizerPanel = false;
      scope.brainVisualizerButtonClickHandler();
      expect(scope.showBrainvisualizerPanel).toBe(true);
    });

    it('should display the help of brainvisualizer panel', function ()
    {
      scope.showBrainvisualizerPanel = false;
      scope.helpModeActivated = true;
      scope.brainVisualizerButtonClickHandler();
      expect(scope.showBrainvisualizerPanel).toBe(false);
      scope.helpModeActivated = false;
    });

    it('should not display brainvisualizer panel when disabled', function ()
    {
      scope.showBrainvisualizerPanel = false;
      scope.brainvisualizerIsDisabled = true;
      scope.brainVisualizerButtonClickHandler();
      expect(scope.showBrainvisualizerPanel).toBe(false);
      scope.brainvisualizerIsDisabled = false;
    });

    it('should open the log-console panel', function ()
    {
      scope.showLogConsole = false;
      scope.logConsoleButtonClickHandler();
      expect(scope.showLogConsole).toBe(true);
    });

    it('should display help of the log-console panel', function ()
    {
      scope.showLogConsole = false;
      scope.helpModeActivated = true;
      scope.logConsoleButtonClickHandler();
      expect(scope.showLogConsole).toBe(false);
    });
  });


 describe('(EnvironmentSettings)', function ()
  {
    beforeEach(function ()
    {
      Gz3dViewCtrl = controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope,
      });
    });

    it('should init default environment settings', function ()
    {
        scope.initComposerSettings();
        expect(scope.loadingEnvironmentSettingsPanel).toBe(false);
    });

    it('should enable display of the environment settings panel', function ()
    {
      scope.showEnvironmentSettingsPanel = false;
      scope.environmentSettingsClickHandler();
      expect(scope.showEnvironmentSettingsPanel).toBe(true);
    });

    it('should open of the environment settings panel', function ()
    {
      scope.showEnvironmentSettingsPanel = false;
      scope.environmentSettingsClickHandler();
      expect(scope.showEnvironmentSettingsPanel).toBe(true);
    });

    it('should display the help of environment settings panel', function ()
    {
      scope.showEnvironmentSettingsPanel = false;
      scope.helpModeActivated = true;
      scope.environmentSettingsClickHandler();
      expect(scope.showEnvironmentSettingsPanel).toBe(false);
      scope.helpModeActivated = false;
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
    var gz3dMock = {
      Initialize : jasmine.createSpy('Initialize'),
      deInitialize : jasmine.createSpy('deInitialize'),
      scene : {
        container : {
          addEventListener : jasmine.createSpy('addEventListener')
        }
      },
      iface: {
        addCanDeletePredicate: angular.noop,
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

    var simulationInfo = {
      serverConfig: { rosbridge: { topics: {} } }
    };

    $provide.value('simulationInfo', simulationInfo);
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

    spyOn(window, 'stop').andReturn(null);
  }));

  describe('(Clean up code tested with a mocked window object)', function () {

    beforeEach(function () {
      Gz3dViewCtrl = controller('Gz3dViewCtrl', {
        $rootScope: rootScope,
        $scope: scope
      });
    });

    it('should close rosbridge connections on onSimulationDone', function() {
      stateService.stopListeningForStatusInformation.reset();
      stateService.removeMessageCallback.reset();

      // call the method under test
      scope.onSimulationDone();

      expect(stateService.stopListeningForStatusInformation).toHaveBeenCalled();
      expect(stateService.removeMessageCallback).toHaveBeenCalled();
    });
  });
});
