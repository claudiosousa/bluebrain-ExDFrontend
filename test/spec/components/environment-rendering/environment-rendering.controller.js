/* global THREE: false */

'use strict';

describe('Controller: EnvironmentRenderingController', function () {
  var environmentRenderingController,
    controller,
    scope,
    rootScope,
    log,
    timeout,
    window,
    stateService,
    simulationInfo,
    contextMenuState,
    exampleProgressData,
    simulations,
    fakeSimulationData,
    nrpBackendVersions,
    nrpFrontendVersion,
    STATE,
    gz3d,
    userNavigationService,
    collabExperimentLockServiceMock ={},
    lockServiceMock,
    q,
    callback,
    onLockChangedCallback,
    lockServiceCancelCallback,
    environmentService,
    userContextService,
    simulationStateObject,
    simulationControlObject,
    nrpBackendVersionsObject,
    colorableObjectService,
    experimentService;

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  beforeEach(module('stateServiceMock'));
  beforeEach(module('gz3dMock'));
  beforeEach(module('userNavigationServiceMock'));
  beforeEach(module('userContextServiceMock'));
  beforeEach(module('editorsPanelServiceMock'));
  beforeEach(module('contextMenuStateServiceMock'));
  beforeEach(module('simulationInfoMock'));
  beforeEach(module('assetLoadingSplashMock'));
  beforeEach(module('colorableObjectServiceMock'));
  beforeEach(module('experimentServiceMock'));

  beforeEach(module(function ($provide) {

    simulationStateObject = {
      update: jasmine.createSpy('update'),
      state: jasmine.createSpy('state')
    };

    simulationControlObject = {
      simulation: jasmine.createSpy('simulation')
    };

    nrpBackendVersionsObject = {
      get: jasmine.createSpy('get')
    };

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

    $provide.value('simulationState', jasmine.createSpy('simulationState').and.returnValue(simulationStateObject));
    $provide.value('simulationControl',  jasmine.createSpy('simulationControl').and.returnValue(simulationControlObject));

    $provide.value('nrpBackendVersions', jasmine.createSpy('nrpBackendVersions').and.returnValue(nrpBackendVersionsObject));
    $provide.value('nrpFrontendVersion', { get: jasmine.createSpy('get') });
    $provide.value('serverError', jasmine.createSpy('serverError'));
    $provide.value('panels', { open: jasmine.createSpy('open') });
    var experimentListMock = {
      experiments: jasmine.createSpy('experiments')
    };
    $provide.value('experimentList',jasmine.createSpy('experimentList').and.returnValue(experimentListMock));
    $provide.value('collabExperimentLockService', collabExperimentLockServiceMock);

    simulationStateObject.update.calls.reset();
    simulationStateObject.state.calls.reset();
    simulationControlObject.simulation.calls.reset();
    nrpBackendVersionsObject.get.calls.reset();
  }));



  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$log_,
                              _hbpIdentityUserDirectory_,
                              _$timeout_,
                              _$window_,
                              _simulationInfo_,
                              _stateService_,
                              _contextMenuState_,
                              _nrpBackendVersions_,
                              _nrpFrontendVersion_,
                              _STATE_,
                              _gz3d_,
                              _userNavigationService_,
                              _$q_,
                              _environmentService_,
                              _experimentService_,
                              _userContextService_,
                              _colorableObjectService_
                              ) {
    controller = $controller;
    rootScope = $rootScope;
    log = _$log_;
    scope = $rootScope.$new();
    timeout = _$timeout_;
    window = _$window_;
    window.location.reload = function () { };
    simulationInfo = _simulationInfo_;
    experimentService = _experimentService_;
    stateService = _stateService_;
    contextMenuState = _contextMenuState_;
    nrpBackendVersions = _nrpBackendVersions_;
    nrpFrontendVersion = _nrpFrontendVersion_;
    STATE = _STATE_;
    gz3d = _gz3d_;
    userNavigationService = _userNavigationService_;
    q = _$q_;
    environmentService = _environmentService_;
    userContextService = _userContextService_;
    colorableObjectService = _colorableObjectService_;

    callback = q.defer();
    lockServiceCancelCallback = jasmine.createSpy('cancelCallback');
    lockServiceMock = {
      tryAddLock : jasmine.createSpy('tryAddLock').and.returnValue(callback.promise),
      onLockChanged: jasmine.createSpy('onLockChanged').and.callFake(function (fn) {onLockChangedCallback = fn; return lockServiceCancelCallback;}),
      releaseLock: jasmine.createSpy('releaseLock').and.returnValue(callback.promise)
    };
    collabExperimentLockServiceMock.createLockServiceForContext = function(){
      return lockServiceMock;
    };

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

    scope.activeSimulation = undefined;

    fakeSimulationData = {
      owner: '1234',
      state: STATE.INITIALIZED,
      simulationID: 1,
      experimentConfiguration: 'FakeExperiment'
    };

    userContextService.hasEditRights.and.callFake(function(entity) {
      return (userContextService.isOwner || userNavigationService.isUserAvatar(entity));
    });

    // create mock for $log
    spyOn(log, 'error');

  }));

  describe('(ViewMode)', function () {
    var currentUserInfo1234, currentUserInfo1234Hash, otherUserInfo4321;

    beforeEach(function () {
      environmentRenderingController = controller('EnvironmentRenderingController', {
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

    it('should have editRights when owner', function () {
      userContextService.isOwner = false;
      expect(userContextService.hasEditRights({name: 'not-user-avatar'})).toBe(false);
      userContextService.isOwner = true;
      expect(userContextService.hasEditRights({name: 'not-user-avatar'})).toBe(true);
      expect(userNavigationService.isUserAvatar).toHaveBeenCalled();
    });

    it('should have editRights for user avatar', function () {
      userContextService.isOwner = false;
      expect(userContextService.hasEditRights({name: 'user-avatar'})).toBe(true);
      expect(userNavigationService.isUserAvatar).toHaveBeenCalled();
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
  });

});
