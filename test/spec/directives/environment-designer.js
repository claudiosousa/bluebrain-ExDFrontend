'use strict';

describe('Directive: environment-designer', function () {


  var $rootScope, $compile, $scope, $document, element, stateService,
    panels, currentStateMock, gz3dMock, contextMenuState, simulationSDFWorld,
    simulationInfo;

  var simulationInfoMock =
  {
    mode : undefined,
    serverID : 'bbpce016',
    simulationID : 'mocked_simulation_id',
    serverConfig: {
      gzweb: {},
      rosbridge: {
        topics: {
          transferFunctionError: {}
        }
      }
    }
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('currentStateMockFactory'));
  beforeEach(module(function ($provide) {
    $provide.value('stateService', currentStateMock);
    $provide.value('simulationInfo', simulationInfoMock);
    $provide.value('gz3d', gz3dMock);
    $provide.value('simulationSDFWorld', jasmine.createSpy('simulationSDFWorld').andCallThrough());
    $provide.value('contextMenuState', {
      toggleContextMenu: jasmine.createSpy('toggleContextMenu'),
      pushItemGroup : jasmine.createSpy('pushItemGroup')
    });
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
    $provide.value('panels', {
      close: jasmine.createSpy('close')
    });
  }));

  beforeEach(inject(function (
    _$rootScope_,
    _$compile_,
    _$document_,
    EDIT_MODE,
    STATE,
    OPERATION_MODE,
    _currentStateMockFactory_,
    _stateService_,
    _contextMenuState_,
    _panels_,
    _simulationSDFWorld_,
    _simulationInfo_) {

    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $document = _$document_;
    $scope = $rootScope.$new();
    $scope.EDIT_MODE = EDIT_MODE;
    $scope.STATE = STATE;
    contextMenuState = _contextMenuState_;
    currentStateMock = _currentStateMockFactory_.get().stateService;
    stateService = _stateService_;
    simulationInfoMock.mode = OPERATION_MODE.EDIT;
    simulationInfo = _simulationInfo_;
    panels = _panels_;
    simulationSDFWorld = _simulationSDFWorld_;
    element = $compile('<environment-designer />')($scope);
    $scope.$digest();
    var sceneMock = {
      setManipulationMode: jasmine.createSpy('setManipulationMode').
        andCallFake(function (m) {
          this.manipulationMode = m;
        }),

      manipulationMode: undefined
    };
    gz3dMock = {
      gui: { emitter: { emit: jasmine.createSpy('emit') } },
      scene: sceneMock,
      toggleScreenChangeMenu: jasmine.createSpy('toggleScreenChangeMenu')
    };
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
    expect(panels.close).toHaveBeenCalled();
  });

  it('should correctly set the edit mode', function () {
    stateService.currentState = $scope.STATE.STARTED;
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalled();
    expect($scope.gz3d.scene.setManipulationMode).toHaveBeenCalledWith($scope.EDIT_MODE.TRANSLATE);
    expect($scope.gz3d.scene.manipulationMode).toBe($scope.EDIT_MODE.TRANSLATE);
  });

  it('should call correctly contextMenuState.pushItemGroup', function () {
    stateService.currentState = $scope.STATE.PAUSED;
    var itemGroup = contextMenuState.pushItemGroup.mostRecentCall.args[0];
    expect(itemGroup.visible).toBe(false);
    expect(itemGroup.items[0].visible).toBe(false);
    itemGroup.visible = true;
    itemGroup.items[0].visible = true;
    itemGroup.hide();
    expect(itemGroup.visible).toBe(false);
    expect(itemGroup.items[0].visible).toBe(false);
    var eventMock = { stopPropagation: jasmine.createSpy('stopPropagation') };
    spyOn($scope, 'deleteModel');
    itemGroup.items[0].callback(eventMock);
    expect($scope.deleteModel).toHaveBeenCalled();
    expect(eventMock.stopPropagation).toHaveBeenCalled();
    var modelMock = { name: 'my_robot'};
    expect(itemGroup.show(modelMock)).toBe(false);
    modelMock.name = 'iAmNotARobot';
    expect(itemGroup.show(modelMock)).toBe(true);
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
    expect(stateService.setCurrentState.callCount).toBe(0);
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
    simulationSDFWorld.andCallFake(
    function () {
      return {
        export: exportSpy.andCallFake(function(){})
      };
    });

    $scope.exportSDFWorld();
    expect(simulationSDFWorld).toHaveBeenCalled();
    expect(exportSpy).toHaveBeenCalled();
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


  it('should call correctly addModel("box")', function () {
    spyOn($scope, 'addModel');

    var addBoxBtnDomElem = element.find('#insert-entity-box');
    var addBoxBtn = angular.element(addBoxBtnDomElem);

    addBoxBtn.triggerHandler('mousedown');
    expect($scope.addModel).toHaveBeenCalledWith('box');
  });

  it('should not spawn models when in INITIALIZED state', function () {
    spyOn($scope, 'addModel');
    spyOn(window.guiEvents, 'emit');
    $scope.stateService.currentState = $scope.STATE.INITIALIZED;
    var addBoxBtnDomElem = element.find('#insert-entity-box');
    var addBoxBtn = angular.element(addBoxBtnDomElem);

    addBoxBtn.triggerHandler('mousedown');
    expect($scope.addModel).toHaveBeenCalledWith('box');
    expect(window.guiEvents.emit).not.toHaveBeenCalledWith('spawn_entity_start','box');

  });

  it('should execute correctly addModel("box")', function () {

    spyOn(window.guiEvents, 'emit');
    spyOn($scope, 'setEditMode');

    var addBoxBtnDomElem = element.find('#insert-entity-box');
    var addBoxBtn = angular.element(addBoxBtnDomElem);

    addBoxBtn.triggerHandler('mousedown');

    //should emit 'spawn_entity_start'
    expect(window.guiEvents.emit).toHaveBeenCalledWith('spawn_entity_start','box');

    //should set translate mode
    expect($scope.setEditMode).toHaveBeenCalledWith($scope.EDIT_MODE.TRANSLATE);

    //should close panel
    expect(panels.close).toHaveBeenCalled();

  });

  it('should create a new dummy anchor and click it when exporting the environment', function () {
    var exportSpy = jasmine.createSpy('export');
    simulationSDFWorld.andCallFake(function () {
      return {
        export: exportSpy.andCallFake(function (args, cb) { cb({'sdf': 'dummysdf'}); })
      };
    });

    var dummyAnchorElement = {
      setAttribute: jasmine.createSpy('setAttribute'),
      style: {
        display: undefined
      },
      click: jasmine.createSpy('click')
    };

    spyOn(angular, 'element').andCallFake(function () { return [dummyAnchorElement]; });

    $scope.exportSDFWorld();
    expect(exportSpy).toHaveBeenCalled();
    expect(angular.element).toHaveBeenCalled();
    expect(dummyAnchorElement.click).toHaveBeenCalled();
  });

  it('should emit delete_entity and toggle menu when deleteModel is called', function () {
    $scope.deleteModel();//call function
    //should emit 'delete_entity'
    expect($scope.gz3d.gui.emitter.emit).toHaveBeenCalled();
    //should toggle menu
    expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(false);

  });

});
