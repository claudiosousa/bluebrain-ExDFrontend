'use strict';

describe('Controller: editorToolbarCntrl', function() {

  var $controller,
      $rootScope,
      $scope,
      $timeout,
      $window,
      location,
      EditorToolbarController,
      stateService,
      userContextService,
      userNavigationService,
      editorsPanelService,
      gz3d,
      hbpDialogFactory,
      environmentService,
      backendInterfaceService,
      splash,
      environmentRenderingService,
      objectInspectorService,
      simulationInfo,
      NAVIGATION_MODES,
      STATE,
      UI,
      EDIT_MODE,
      RESET_TYPE;

  // load the controller's module
  beforeEach(module('editorToolbarModule'));
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  beforeEach(module('stateServiceMock'));
  beforeEach(module('gz3dMock'));
  beforeEach(module('splashMock'));
  beforeEach(module('hbpDialogFactoryMock'));
  beforeEach(module('backendInterfaceServiceMock'));
  beforeEach(module('objectInspectorServiceMock'));
  beforeEach(module('userNavigationServiceMock'));
  beforeEach(module('userContextServiceMock'));
  beforeEach(module('editorsPanelServiceMock'));
  beforeEach(module('environmentRenderingServiceMock'));
  beforeEach(module('simulationInfoMock'));

  var simulationStateObject = {
    update: jasmine.createSpy('update'),
    state: jasmine.createSpy('state')
  };

  var simulationControlObject = {
    simulation: jasmine.createSpy('simulation')
  };

  var nrpBackendVersionsObject = {
    get: jasmine.createSpy('get')
  };

  beforeEach(module(function($provide) {

    var collab3DSettingsServiceMock = {};

    collab3DSettingsServiceMock.loadSettings = function() {
      var res = {};
      res.finally = function(callback) {
        callback(true);
      };
      return res;
    };

    $provide.value('collab3DSettingsService', collab3DSettingsServiceMock);

    $provide.value('simulationState', jasmine.createSpy('simulationState').and.returnValue(simulationStateObject));
    $provide.value('simulationControl', jasmine.createSpy('simulationControl').and.returnValue(simulationControlObject));

    $provide.value('nrpBackendVersions', jasmine.createSpy('nrpBackendVersions').and.returnValue(nrpBackendVersionsObject));
    $provide.value('nrpFrontendVersion', { get: jasmine.createSpy('get') });
    $provide.value('serverError', jasmine.createSpy('serverError'));
    $provide.value('panels', { open: jasmine.createSpy('open') });
    var experimentListMock = {
      experiments: jasmine.createSpy('experiments'),
    };
    $provide.value('experimentList', jasmine.createSpy('experimentList').and.returnValue(experimentListMock));
  }));

  beforeEach(inject(function(_$controller_,
                             _$rootScope_,
                             _$timeout_,
                             _$location_,
                             _$window_,
                             _stateService_,
                             _userContextService_,
                             _userNavigationService_,
                             _gz3d_,
                             _editorsPanelService_,
                             _hbpDialogFactory_,
                             _environmentService_,
                             _backendInterfaceService_,
                             _splash_,
                             _environmentRenderingService_,
                             _objectInspectorService_,
                             _simulationInfo_,
                             _STATE_,
                             _NAVIGATION_MODES_,
                             _UI_,
                             _EDIT_MODE_,
                             _RESET_TYPE_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $timeout = _$timeout_;
    location = _$location_;
    $window = _$window_;
    stateService = _stateService_;
    userContextService = _userContextService_;
    gz3d = _gz3d_;
    userNavigationService = _userNavigationService_;
    editorsPanelService = _editorsPanelService_;
    hbpDialogFactory = _hbpDialogFactory_;
    environmentService = _environmentService_;
    backendInterfaceService = _backendInterfaceService_;
    splash = _splash_;
    environmentRenderingService = _environmentRenderingService_;
    objectInspectorService = _objectInspectorService_;
    simulationInfo = _simulationInfo_;
    STATE = _STATE_;
    NAVIGATION_MODES = _NAVIGATION_MODES_;
    UI = _UI_;
    EDIT_MODE = _EDIT_MODE_;
    RESET_TYPE = _RESET_TYPE_;

    userContextService.hasEditRights.and.callFake(function(entity) {
      return (userContextService.isOwner || userNavigationService.isUserAvatar(entity)); // todo: investigate how to inject
    });
  }));

  describe('(ViewMode)', function() {

    beforeEach(function() {
      EditorToolbarController = $controller('editorToolbarCntrl', {
        $rootScope: $rootScope,
        $scope: $scope
      });
    });

    it('should set isJoiningStoppedSimulation to true when already stopped', function() {
      expect(userContextService.isJoiningStoppedSimulation).toBe(false);
      stateService.currentState = STATE.STOPPED;
      stateService.getCurrentState().then.calls.mostRecent().args[0](); //wtf!!!
      expect(userContextService.isJoiningStoppedSimulation).toBe(true);
    });

    it('should properly update navigation mode', function() {
      userNavigationService.nagitationMode = NAVIGATION_MODES.FREE_CAMERA;
      $scope.setNavigationMode(NAVIGATION_MODES.FREE_CAMERA);
      expect(userNavigationService.setModeFreeCamera).toHaveBeenCalled();

      $scope.setNavigationMode(NAVIGATION_MODES.GHOST);
      expect(userNavigationService.setModeGhost).toHaveBeenCalled();

      $scope.setNavigationMode(NAVIGATION_MODES.HUMAN_BODY);
      expect(userNavigationService.setModeHumanBody).toHaveBeenCalled();
    });

    it('should toggle showEditorPanel visibility on codeEditorButtonClickHandler()', function() {
      userContextService.editIsDisabled = false;
      $scope.codeEditorButtonClickHandler();
      expect(editorsPanelService.toggleEditors).toHaveBeenCalled();
    });

    it('should not toggle showEditorPanel visibility on codeEditorButtonClickHandler()', function() {
      userContextService.editIsDisabled = true;
      $scope.codeEditorButtonClickHandler();
      expect(editorsPanelService.toggleEditors).not.toHaveBeenCalled();
    });

    it('should ensure that the state is PAUSED when resetting', function() {
      $scope.resetButtonClickHandler();

      hbpDialogFactory.confirm().then.calls.mostRecent().args[0]();

      expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));
    });

    it('should show a popup when the reset button is pressed', function() {
      $scope.resetButtonClickHandler();
      expect(hbpDialogFactory.confirm).toHaveBeenCalled();
    });

    it('should pass the radio button value to resetService when Collab not available', function() {

      spyOn($scope, 'notifyResetToWidgets');
      $scope.request = { resetType: RESET_TYPE.RESET_ROBOT_POSE };

      $scope.__resetButtonClickHandler();
      $timeout.flush(100);

      environmentService.setPrivateExperiment(false); //Collab IS NOT available

      expect(backendInterfaceService.reset).toHaveBeenCalledWith(
      $scope.request,
      jasmine.any(Function),
      jasmine.any(Function));

      var successCallback = backendInterfaceService.reset.calls.mostRecent().args[1];
      successCallback();
      $timeout.flush(100);
      expect(gz3d.scene.applyComposerSettings).toHaveBeenCalledWith(true, false);
    });

    it('should notify the widgets when resetting', function() {
      spyOn($scope, 'notifyResetToWidgets').and.callThrough();

      $scope.request = { resetType: RESET_TYPE.RESET_WORLD };

      $scope.__resetButtonClickHandler();
      $timeout.flush(100);

      expect($scope.notifyResetToWidgets).toHaveBeenCalledWith(RESET_TYPE.RESET_WORLD);
    });

    it('should hide object inspector window when resetting', function() {
      $scope.request = { resetType: RESET_TYPE.RESET_FULL };

      $scope.__resetButtonClickHandler();
      $timeout.flush(100);

      expect(objectInspectorService.toggleView).toHaveBeenCalled();
      expect(gz3d.scene.selectEntity).toHaveBeenCalled();
    });

    it('should pass the radio button value to resetCollabService when Collab is available', function() {
      spyOn(_, 'defer');

      var testWorld = {
        type: RESET_TYPE.RESET_WORLD,
        headline: 'Resetting Environment',
        subHeadline: 'Downloading World SDF from the Collab'
      };
      var testBrain = {
        type: RESET_TYPE.RESET_BRAIN,
        headline: 'Resetting Brain',
        subHeadline: 'Downloading brain configuration file from the Collab'
      };
      var testCases = [testWorld, testBrain];

      for(var i = 0; i < testCases.length; i++) {

        $scope.resetButtonClickHandler();
        $scope.request = { resetType: testCases[i].type };
        environmentService.setPrivateExperiment(true); //Collab IS available
        $scope.splashScreen = undefined;

        hbpDialogFactory.confirm().then.calls.mostRecent().args[0]();

        $timeout.flush(100);
        expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));

        //ensureStateBeforeExecuting's first parameter is a state, second is a callback
        var resetFunction = stateService.ensureStateBeforeExecuting.calls.mostRecent().args[1];

        resetFunction(); // call the callback
        $timeout.flush(100);

        //open splash
        expect(splash.open).toHaveBeenCalled();

        //defer call
        expect(_.defer).toHaveBeenCalled();
        _.defer.calls.mostRecent().args[0](); // call deferred function

        expect(splash.spin).toBe(true);
        expect(splash.setMessage).toHaveBeenCalledWith(
        {
          headline: testCases[i].headline,
          subHeadline: testCases[i].subHeadline
        }
        );

        expect(backendInterfaceService.resetCollab).toHaveBeenCalledWith(
        simulationInfo.contextID,
        $scope.request,
        jasmine.any(Function),
        jasmine.any(Function)
        );

        backendInterfaceService.resetCollab.calls.mostRecent().args[2](); //2 is the success callback

        expect(splash.close).toHaveBeenCalled();
        expect($scope.splashScreen).not.toBeDefined();

        //reset spies
        splash.close.calls.reset();
        $scope.splashScreen = 'isDefined';

        backendInterfaceService.resetCollab.calls.mostRecent().args[3](); //3 is the failure callback
        $timeout.flush(100);

        expect(splash.close).toHaveBeenCalled();
        expect($scope.splashScreen).not.toBeDefined();
      }
    });

    it('shouldn\'t do anything if no radio button is set', function() {
      $scope.resetButtonClickHandler();
      $scope.request = { resetType: RESET_TYPE.NO_RESET };
      hbpDialogFactory.confirm().then.calls.mostRecent().args[0]();
      expect(backendInterfaceService.reset.calls.count()).toBe(0);
    });

    it('should reset GUI when reset type is RESET.RESET_ALL', function() {
      spyOn($scope, 'resetGUI').and.callThrough();

      $scope.$broadcast('RESET', RESET_TYPE.RESET_FULL);
      $scope.$digest();

      expect($scope.resetGUI).toHaveBeenCalled();
    });

    it('should call resetView() when "Reset Camera view" checkbox is checked', function() {
      //gz3d.scene.resetView is already being spied on

      $scope.resetButtonClickHandler();
      $scope.request = { resetType: RESET_TYPE.RESET_CAMERA_VIEW };

      $scope.__resetButtonClickHandler();
      $timeout.flush(100);
      expect(gz3d.scene.resetView).toHaveBeenCalled();
    });

    it('should register for status information', function() {
      $scope.state = STATE.UNDEFINED;
      stateService.currentState = STATE.STARTED;
      stateService.getCurrentState().then.calls.mostRecent().args[0]();
      expect(stateService.startListeningForStatusInformation).toHaveBeenCalled();
      expect(stateService.addMessageCallback).toHaveBeenCalled();
    });

    it('should open splash screen with callbackOnClose', function() {
      stateService.getCurrentState().then.calls.mostRecent().args[0]();
      stateService.currentState = STATE.STOPPED;
      $scope.sceneLoading = false;
      //Test the messageCallback
      $scope.splashScreen = undefined;
      stateService.addMessageCallback.calls.mostRecent().args[0]({
        progress: {
          'block_ui': 'False',
          task: 'Task1',
          subtask: 'Subtask1'
        }
      });
      expect(splash.open).toHaveBeenCalled();
      var callbackOnClose = splash.open.calls.mostRecent().args[1];
      expect(callbackOnClose).toBeDefined();
      expect(splash.setMessage).toHaveBeenCalledWith({ headline: 'Task1', subHeadline: 'Subtask1' });
      // test open splash screen without callbackOnClose
      $scope.splashScreen = undefined;
      stateService.currentState = STATE.INITIALIZED;
      stateService.addMessageCallback.calls.mostRecent().args[0]({
        progress: {
          'block_ui': 'False',
          task: 'Task1',
          subtask: 'Subtask1'
        }
      });
      callbackOnClose = splash.open.calls.mostRecent().args[1];
      expect(callbackOnClose).not.toBeDefined();
      // test "done" (without close, with onSimulationDone)
      splash.showButton = true;
      splash.spin = true;
      stateService.addMessageCallback.calls.mostRecent().args[0]({
        progress: {
          'block_ui': 'False',
          done: 'True'
        }
      });
      expect(splash.spin).toBe(false);
      expect(splash.setMessage).toHaveBeenCalledWith({ headline: 'Finished' });
      expect(splash.close).not.toHaveBeenCalled();
      // onSimulationDone() should have been called
      expect(stateService.removeMessageCallback).toHaveBeenCalled();

      // test "done" in IF path (with close, without onSimulationDone)
      stateService.currentState = STATE.STOPPED;
      $scope.splashScreen = undefined;
      splash.close.calls.reset();
      stateService.removeMessageCallback.calls.reset();
      splash.showButton = false;
      stateService.addMessageCallback.calls.mostRecent().args[0]({ progress: { 'block_ui': 'True', done: 'True' } });
      expect(splash.close).toHaveBeenCalled();
      // onSimulationDone() should NOT have been called
      expect(stateService.removeMessageCallback).not.toHaveBeenCalled();
      // test "timeout"
      stateService.addMessageCallback.calls.mostRecent().args[0]({ timeout: 264, simulationTime: 1, realTime: 2 });
      expect($scope.simTimeoutText).toBe(264);
      // test "simulationTime"
      expect($scope.simulationTimeText).toBe(1);
      // test "realTime"
      expect($scope.realTimeText).toBe(2);
    });

    it('should test light change', function() {

      var initiaLightness = 0.5;
      gz3d.scene.scene = {};
      gz3d.scene.emitter = { lightDiffuse: initiaLightness };
      gz3d.scene.findLightIntensityInfo = function() {
        return { min: this.emitter.lightDiffuse, max: this.emitter.lightDiffuse };
      };

      gz3d.scene.emitter.emit = function(msg, direction) {
        this.lightDiffuse += direction;
      };

      $scope.lightDiffuse = initiaLightness;

      $scope.modifyLightClickHandler(1, UI.INCREASE_LIGHT);
      expect(gz3d.scene.emitter.lightDiffuse).toBeGreaterThan(initiaLightness);

      $scope.modifyLightClickHandler(-1, UI.DECREASE_LIGHT);
      $scope.modifyLightClickHandler(-1, UI.DECREASE_LIGHT);
      expect(gz3d.scene.emitter.lightDiffuse).toBeLessThan(initiaLightness);
    });

    it('should call or skip camera controls according to mouse events and help mode status', function() {
      var e = { which: 1 }; // 1 for left mouse button
      $scope.helpModeActivated = false;
      $scope.requestMove(e, 'moveForward');
      expect(gz3d.scene.controls.onMouseDownManipulator).toHaveBeenCalledWith('moveForward');
      $scope.releaseMove(e, 'moveForward');
      expect(gz3d.scene.controls.onMouseUpManipulator).toHaveBeenCalledWith('moveForward');

      e.which = 2; // 2 for right mouse button
      $scope.helpModeActivated = false;
      gz3d.scene.controls.onMouseDownManipulator.calls.reset();
      gz3d.scene.controls.onMouseUpManipulator.calls.reset();
      $scope.requestMove(e, 'moveBackward');
      expect(gz3d.scene.controls.onMouseDownManipulator).not.toHaveBeenCalled();
      $scope.releaseMove(e, 'moveBackward');
      expect(gz3d.scene.controls.onMouseUpManipulator).not.toHaveBeenCalled();

      e.which = 1;
      $scope.helpModeActivated = true;
      gz3d.scene.controls.onMouseDownManipulator.calls.reset();
      gz3d.scene.controls.onMouseUpManipulator.calls.reset();
      $scope.requestMove(e, 'rotateRight');
      expect(gz3d.scene.controls.onMouseDownManipulator).not.toHaveBeenCalled();
      $scope.releaseMove(e, 'rotateRight');
      expect(gz3d.scene.controls.onMouseUpManipulator).not.toHaveBeenCalled();
    });

    it('should not set edit mode if the new mode is equal to the current one', function() {
      gz3d.scene.manipulationMode = EDIT_MODE.VIEW;

      //false case
      $scope.setEditMode(EDIT_MODE.VIEW);
      expect(gz3d.scene.setManipulationMode).not.toHaveBeenCalled();

      //true case
      $scope.setEditMode(EDIT_MODE.EDIT);
      expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.EDIT);
    });

    it('should correctly execute simControlButtonHandler', function() {
      //test setup
      var newState = STATE.STARTED;
      $scope.setEditMode = jasmine.createSpy('setEditMode');
      $scope.updateSimulation = jasmine.createSpy('updateSimulation');

      //call function under test
      $scope.simControlButtonHandler(newState);

      //check test outcome
      expect($scope.updateSimulation).toHaveBeenCalledWith(newState);
      expect($scope.setEditMode).toHaveBeenCalledWith(EDIT_MODE.VIEW);
    });

    it('should toggle the showSpikeTrain variable', function() {
      expect($scope.showSpikeTrain).toBe(false);
      $scope.spikeTrainButtonClickHandler();
      expect($scope.showSpikeTrain).toBe(true);
    });

    it('should toggle the showJoinPlot variable', function() {
      expect($scope.showJointPlot).toBe(false);
      $scope.jointPlotButtonClickHandler();
      expect($scope.showJointPlot).toBe(true);
    });

    it('should toggle the robot camera views', function() {
      expect($scope.showRobotView).toBe(undefined);
      expect(gz3d.scene.viewManager.views[0].type).toBe('camera');
      expect(gz3d.scene.viewManager.views[0].active).toBe(true);
      expect(gz3d.scene.viewManager.views[0].container.style.visibility).toBe('visible');
      expect(gz3d.scene.viewManager.views[1].type).toBe('camera');
      expect(gz3d.scene.viewManager.views[1].active).toBe(false);
      expect(gz3d.scene.viewManager.views[1].container.style.visibility).toBe('hidden');
      environmentRenderingService.hasCameraView.and.returnValue(true);
      $scope.robotViewButtonClickHandler();
      expect($scope.showRobotView).toBe(true);
      expect(gz3d.scene.viewManager.views[0].active).toBe(false);
      expect(gz3d.scene.viewManager.views[0].container.style.visibility).toBe('hidden');
      expect(gz3d.scene.viewManager.views[1].active).toBe(true);
      expect(gz3d.scene.viewManager.views[1].container.style.visibility).toBe('visible');
    });

    it('should do nothing on $destroy when all is undefined', function() {
      $scope.assetLoadingSplashScreen = undefined;
      gz3d.iface.webSocket = undefined;
      $scope.rosConnection = undefined;
      $scope.statusListener = undefined;

      $scope.$destroy();

      expect($scope.splashScreen).not.toBeDefined();
      expect($scope.assetLoadingSplashScreen).not.toBeDefined();
      expect($scope.statusListener).not.toBeDefined();
      expect($scope.worldStatsListener).not.toBeDefined();
      expect($scope.rosConnection).not.toBeDefined();
      expect(gz3d.iface.webSocket).not.toBeDefined();
    });

    it('should toggle the help mode variable and show the help text correctly', function() {
      $scope.helpModeActivated = false;
      $scope.toggleHelpMode();

      expect($scope.helpModeActivated).toBe(true);
      expect($scope.helpDescription).toBe('');
      expect($scope.currentSelectedUIElement).toBe(UI.UNDEFINED);

      $scope.simControlButtonHandler('state', 'PLAY_BUTTON');
      expect($scope.currentSelectedUIElement).toBe(UI.PLAY_BUTTON);
      expect($scope.helpDescription).toBe($scope.helpText[UI.PLAY_BUTTON]);
      $scope.simControlButtonHandler('state', 'PLAY_BUTTON');
      expect($scope.currentSelectedUIElement).toBe(UI.UNDEFINED);
      expect($scope.helpDescription).toBe('');

      $scope.resetButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.RESET_BUTTON);
      expect($scope.helpDescription).toBe($scope.helpText[UI.RESET_BUTTON]);

      $scope.timeDisplayClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.TIME_DISPLAY);
      expect($scope.helpDescription).toBe($scope.helpText[UI.TIME_DISPLAY]);

      $scope.modifyLightClickHandler(1, UI.INCREASE_LIGHT);
      expect($scope.currentSelectedUIElement).toBe(UI.INCREASE_LIGHT);
      expect($scope.helpDescription).toBe($scope.helpText[UI.INCREASE_LIGHT]);

      $scope.modifyLightClickHandler(1, UI.DECREASE_LIGHT);
      expect($scope.currentSelectedUIElement).toBe(UI.DECREASE_LIGHT);
      expect($scope.helpDescription).toBe($scope.helpText[UI.DECREASE_LIGHT]);

      $scope.cameraTranslationButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.CAMERA_TRANSLATION);
      expect($scope.helpDescription).toBe($scope.helpText[UI.CAMERA_TRANSLATION]);

      $scope.cameraRotationButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.CAMERA_ROTATION);
      expect($scope.helpDescription).toBe($scope.helpText[UI.CAMERA_ROTATION]);

      $scope.spikeTrainButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.SPIKE_TRAIN);
      expect($scope.helpDescription).toBe($scope.helpText[UI.SPIKE_TRAIN]);

      $scope.jointPlotButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.JOINT_PLOT);
      expect($scope.helpDescription).toBe($scope.helpText[UI.JOINT_PLOT]);

      $scope.robotViewButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.ROBOT_VIEW);
      expect($scope.helpDescription).toBe($scope.helpText[UI.ROBOT_VIEW]);

      $scope.ownerInformationClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.OWNER_DISPLAY);
      expect($scope.helpDescription).toBe($scope.helpText[UI.OWNER_DISPLAY]);

      $scope.environmentSettingsClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.ENVIRONMENT_SETTINGS);
      expect($scope.helpDescription).toBe($scope.helpText[UI.ENVIRONMENT_SETTINGS]);

      $scope.navigationModeMenuClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.USER_NAVIGATION);
      expect($scope.helpDescription).toBe($scope.helpText[UI.USER_NAVIGATION]);

      $scope.codeEditorButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.CODE_EDITOR);
      expect($scope.helpDescription).toBe($scope.helpText[UI.CODE_EDITOR]);

      $scope.brainVisualizerButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.BRAIN_VISUALIZER);
      expect($scope.helpDescription).toBe($scope.helpText[UI.BRAIN_VISUALIZER]);

      $scope.logConsoleButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.LOG_CONSOLE);
      expect($scope.helpDescription).toBe($scope.helpText[UI.LOG_CONSOLE]);

      $scope.exitButtonClickHandler();
      expect($scope.currentSelectedUIElement).toBe(UI.EXIT_BUTTON);
      expect($scope.helpDescription).toBe($scope.helpText[UI.EXIT_BUTTON]);
    });

    it('should go back to the esv-web page when no "ctx" parameter was in the url', function () {
      spyOn($window.location, 'reload');

      environmentService.setPrivateExperiment(false);
      $scope.exit();
      $timeout.flush();
      expect(location.path()).toEqual('/esv-web');
      expect($window.location.reload).toHaveBeenCalled();
    });
  });

  describe('(EditMode)', function() {
    beforeEach(function() {
      environmentService.setPrivateExperiment(true);

      EditorToolbarController = $controller('editorToolbarCntrl', {
        $rootScope: $rootScope,
        $scope: $scope
      });
    });

    it('should go back to the esv-web page when a "ctx" parameter was in the url', function () {
      spyOn($window.location, 'reload');

      $scope.exit();
      $timeout.flush();
      expect(location.path()).toEqual('/esv-private');
      expect(userContextService.deinit).toHaveBeenCalled();
      expect($window.location.reload).toHaveBeenCalled();
    });

    it('should clean up when exit is called', function() {
      spyOn($scope, 'cleanUp').and.callThrough();

      $scope.exit();

      expect($scope.cleanUp).toHaveBeenCalled();
    });
  });

  describe('(BrainVisualizer)', function() {
    beforeEach(function() {
      EditorToolbarController = $controller('editorToolbarCntrl', {
        $rootScope: $rootScope,
        $scope: $scope
      });
    });

    it('should enable display of the brainvisualizer panel', function() {
      $scope.showBrainvisualizerPanel = false;
      $scope.toggleBrainvisualizer();
      expect($scope.showBrainvisualizerPanel).toBe(true);
    });

    it('should open of the brainvisualizer panel', function() {
      $scope.loadingBrainvisualizerPanel = false;
      $scope.brainvisualizerIsDisabled = false;
      $scope.showBrainvisualizerPanel = false;
      $scope.brainVisualizerButtonClickHandler();
      expect($scope.showBrainvisualizerPanel).toBe(true);
    });

    it('should display the help of brainvisualizer panel', function() {
      $scope.showBrainvisualizerPanel = false;
      $scope.helpModeActivated = true;
      $scope.brainVisualizerButtonClickHandler();
      expect($scope.showBrainvisualizerPanel).toBe(false);
      $scope.helpModeActivated = false;
    });

    it('should open the log-console panel', function() {
      $scope.showLogConsole = false;
      $scope.logConsoleButtonClickHandler();
      expect($scope.showLogConsole).toBe(true);
    });

    it('should display help of the log-console panel', function() {
      $scope.showLogConsole = false;
      $scope.helpModeActivated = true;
      $scope.logConsoleButtonClickHandler();
      expect($scope.showLogConsole).toBe(false);
    });
  });

  describe('(EnvironmentSettings)', function() {
    beforeEach(function() {
      EditorToolbarController = $controller('editorToolbarCntrl', {
        $rootScope: $rootScope,
        $scope: $scope
      });
    });

    it('should enable display of the environment settings panel', function() {
      $scope.showEnvironmentSettingsPanel = false;
      $scope.environmentSettingsClickHandler();
      expect($scope.showEnvironmentSettingsPanel).toBe(true);
    });

    it('should open of the environment settings panel', function() {
      $scope.showEnvironmentSettingsPanel = false;
      $scope.environmentSettingsClickHandler();
      expect($scope.showEnvironmentSettingsPanel).toBe(true);
    });

    it('should display the help of environment settings panel', function() {
      $scope.showEnvironmentSettingsPanel = false;
      $scope.helpModeActivated = true;
      $scope.environmentSettingsClickHandler();
      expect($scope.showEnvironmentSettingsPanel).toBe(false);
      $scope.helpModeActivated = false;
    });
  });
});

// TODO: refactor more so in belongs to a new simulationService whatever
describe('Controller: Gz3dViewCtrl - mocked window', function() {
  var editorToolbar,
      controller,
      scope,
      rootScope,
      stateService,
      window,
      document,
      environmentRenderingService;

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  beforeEach(module('simulationInfoMock'));
  beforeEach(module('environmentRenderingServiceMock'));

  beforeEach(module(function($provide) {
    var getCurrentStateSpy = jasmine.createSpy('getCurrentState');
    var getThenSpy = jasmine.createSpy('then');

    getCurrentStateSpy.and.callFake(function() {
      return { then: getThenSpy.and.callFake(function(f) { f(); }) };
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
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller,
                             $rootScope,
                             _stateService_,
                             _$window_,
                             _$document_,
                             _environmentRenderingService_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    stateService = _stateService_;
    window = _$window_;
    document = _$document_;
    environmentRenderingService = _environmentRenderingService_;

    spyOn(window, 'stop').and.returnValue(null);
  }));

  describe('(Clean up code tested with a mocked window object)', function() {

    beforeEach(function() {
      editorToolbar = controller('editorToolbarCntrl', {
        $rootScope: rootScope,
        $scope: scope
      });
    });

    it('should close rosbridge connections on onSimulationDone', function() {
      stateService.stopListeningForStatusInformation.calls.reset();
      stateService.removeMessageCallback.calls.reset();

      // call the method under test
      scope.onSimulationDone();

      expect(stateService.stopListeningForStatusInformation).toHaveBeenCalled();
      expect(stateService.removeMessageCallback).toHaveBeenCalled();
    });
  });
});
