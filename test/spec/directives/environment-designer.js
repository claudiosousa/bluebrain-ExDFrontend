'use strict';

describe('Directive: environment-designer', function () {
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('exdFrontendApp.Constants'));
  beforeEach(module('currentStateMockFactory'));

  var simulationSDFWorldSpy;
  var $rootScope, $compile, $scope, element, stateService, panelsCloseSpy, currentStateMock;

  beforeEach(module('gz3dServices'));
  beforeEach(module(function ($provide) {
    $provide.value('$stateParams',
      {
        serverID : 'bbpce016',
        simulationID : 'mocked_simulation_id'
      }
    );
    $provide.value('bbpConfig', {
      get: jasmine.createSpy('get').andReturn(
        {
          'bbpce016': {
            gzweb: {
              assets: 'mock_assets',
              websocket: 'mock_websocket'
            }
          }
        }
      )
    });

    panelsCloseSpy = jasmine.createSpy('close');
    $provide.value('panels', {
      close: panelsCloseSpy
    });

  }));

  beforeEach(module('simulationControlServices', function ($provide) {
    $provide.decorator('simulationSDFWorld', function () {
      simulationSDFWorldSpy = jasmine.createSpy('simulationSDFWorld');
      return simulationSDFWorldSpy.andCallThrough();
    });
  }));

  beforeEach(module('simulationStateServices', function ($provide) {
    $provide.value(currentStateMock);
  }));

  beforeEach(inject(function (_$rootScope_, _$compile_, EDIT_MODE, STATE, _stateService_, _currentStateMockFactory_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $scope = $rootScope.$new();
    $scope.EDIT_MODE = EDIT_MODE;
    $scope.STATE = STATE;
    $scope.gz3d = {};
    stateService = _stateService_;
    currentStateMock = _currentStateMockFactory_.get();
    element = $compile('<environment-designer />')($scope);
    $scope.$digest();

    $scope.gz3d.scene = jasmine.createSpy('scene');
    $scope.gz3d.scene.setManipulationMode = jasmine.createSpy('setManipulationMode')
      .andCallFake(function (m) {
        $scope.gz3d.scene.manipulationMode = m;
      });
    $scope.gz3d.toggleScreenChangeMenu = jasmine.createSpy('toggleScreenChangeMenu');
  }));

  it('should replace the element with the appropriate content', function () {
    expect(element.prop('outerHTML')).toContain('<!-- TEST: Environment Designer loaded correctly -->');
  });

  it('should call correctly setEditMode', function () {
    spyOn($scope, 'setEditMode');

    var btns = element.find('button');
    var viewBtn      = angular.element(btns[0]),
        translateBtn = angular.element(btns[1]),
        rotateBtn    = angular.element(btns[2]);

    viewBtn.triggerHandler('click');
    expect($scope.setEditMode).toHaveBeenCalledWith($scope.EDIT_MODE.VIEW);

    translateBtn.triggerHandler('click');
    expect($scope.setEditMode).toHaveBeenCalledWith($scope.EDIT_MODE.TRANSLATE);

    rotateBtn.triggerHandler('click');
    expect($scope.setEditMode).toHaveBeenCalledWith($scope.EDIT_MODE.ROTATE);
  });

  it('should call correctly close panels when edit mode already set', function () {
    stateService.currentState = $scope.STATE.STARTED;
    $scope.gz3d.scene.manipulationMode = $scope.EDIT_MODE.TRANSLATE;
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(panelsCloseSpy).toHaveBeenCalled();
  });

  it('should correctly set the edit mode', function () {
    stateService.currentState = $scope.STATE.STARTED;
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalled();
    expect($scope.gz3d.scene.setManipulationMode).toHaveBeenCalledWith($scope.EDIT_MODE.TRANSLATE);
    expect($scope.gz3d.scene.manipulationMode).toBe($scope.EDIT_MODE.TRANSLATE);
  });

  it('should pause the simulation when needed', function () {
    stateService.currentState = $scope.STATE.STARTED;
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(stateService.ensureStateBeforeExecuting.mostRecentCall.args[0]).toBe($scope.STATE.PAUSED);
    stateService.currentState = $scope.STATE.STARTED;
    $scope.setEditMode($scope.EDIT_MODE.ROTATE);
    expect(stateService.ensureStateBeforeExecuting.mostRecentCall.args[0]).toBe($scope.STATE.PAUSED);
  });

  it('should not update the state if already in the correct state', function () {
    stateService.setCurrentState.callCount = 0;

    stateService.currentState = $scope.STATE.STARTED;
    $scope.setEditMode($scope.EDIT_MODE.VIEW);
    expect(stateService.setCurrentState.callCount).toBe(0);
    stateService.currentState = $scope.STATE.PAUSED;
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(stateService.setCurrentState.callCount).toBe(0);
    stateService.currentState = $scope.STATE.PAUSED;
    $scope.setEditMode($scope.EDIT_MODE.ROTATE);
    expect(stateService.setCurrentState.callCount).toBe(0);
  });

  it('should call the right REST API for the SDF export process', function () {
    var exportSpy = jasmine.createSpy('export');
    simulationSDFWorldSpy.andCallFake(function () {
      return {
        export: exportSpy.andCallFake(function () {})
      };
    });

    $scope.exportSDFWorld();
    expect(simulationSDFWorldSpy).toHaveBeenCalled();
    expect(exportSpy).toHaveBeenCalled();
  });

});
