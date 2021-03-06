'use strict';

describe('Directive: environment-designer', function () {


  var $scope, element, stateService,
    panels, currentStateMock, gz3dMock, contextMenuState, objectInspectorService, simulationSDFWorld,
    simulationInfo, backendInterfaceService, hbpDialogFactory, environmentService;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('currentStateMockFactory'));
  beforeEach(module(function ($provide) {
    $provide.value('stateService', currentStateMock);
    var simulationInfoMock = {
      mode: undefined,
      contextID: '97923877-13ea-4b43-ac31-6b79e130d344',
      serverID: 'bbpce016',
      simulationID: 'mocked_simulation_id',
      serverConfig: {
        gzweb: {assets: {}},
        rosbridge: {
          topics: {
            cleError: {}
          }
        }
      },
      isPrivateExperiment: true
    };
    $provide.value('simulationInfo', simulationInfoMock);
    $provide.value('gz3d', gz3dMock);
    $provide.value('simulationSDFWorld', jasmine.createSpy('simulationSDFWorld').and.callThrough());
    $provide.value('contextMenuState', {
      toggleContextMenu: jasmine.createSpy('toggleContextMenu'),
      pushItemGroup: jasmine.createSpy('pushItemGroup')
    });
    $provide.value('objectInspectorService', {
      toggleView: jasmine.createSpy('toggleView')
    });
    $provide.value('bbpConfig', {
      get: jasmine.createSpy('get').and.returnValue(
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

  beforeEach(inject(function ($rootScope,
                              $compile,
                              $document,
                              EDIT_MODE,
                              STATE,
                              _currentStateMockFactory_,
                              _stateService_,
                              _contextMenuState_,
                              _objectInspectorService_,
                              _panels_,
                              _simulationSDFWorld_,
                              _simulationInfo_,
                              _backendInterfaceService_,
                              _hbpDialogFactory_,
                              _environmentService_) {

    $scope = $rootScope.$new();
    $scope.EDIT_MODE = EDIT_MODE;
    $scope.STATE = STATE;
    contextMenuState = _contextMenuState_;
    objectInspectorService = _objectInspectorService_;
    currentStateMock = _currentStateMockFactory_.get().stateService;
    stateService = _stateService_;
    simulationInfo = _simulationInfo_;
    panels = _panels_;
    simulationSDFWorld = _simulationSDFWorld_;
    backendInterfaceService = _backendInterfaceService_;
    hbpDialogFactory = _hbpDialogFactory_;
    environmentService = _environmentService_;
    element = $compile('<environment-designer />')($scope);
    $scope.$digest();

    var sceneMock = {
      setManipulationMode: jasmine.createSpy('setManipulationMode').
      and.callFake(function (m) {
        this.manipulationMode = m;
      }),
      manipulationMode: undefined,
      selectedEntity:{},
      selectEntity: jasmine.createSpy('selectEntity').
      and.callFake(function (obj) {
        this.selectedEntity = obj;
      }),
      getByName: jasmine.createSpy('getByName').
      and.callFake(function (name) {

        var obj = {};
        obj.name = name;
        return this.selectedEntity;
      })
    };

    /*jshint camelcase: false */
    gz3dMock = {
      iface: {gui: {emitter:{_events: {entityCreated: jasmine.createSpy('entityCreated')}}}},
      gui: {emitter: {emit: jasmine.createSpy('emit')}, guiEvents: {emit: jasmine.createSpy('emit'), _events: {notification_popup: jasmine.createSpy('notification_popup')}}},
      scene: sceneMock,
      toggleScreenChangeMenu: jasmine.createSpy('toggleScreenChangeMenu')
    };
  }));

  it('should initialize scope variables correctly', function () {
    expect($scope.assetsPath).toBeDefined();
  });

  it('should replace the element with the appropriate content', function () {
    expect(element.prop('outerHTML')).toContain('<!-- TEST: Environment Designer loaded correctly -->');
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
    var itemGroup = contextMenuState.pushItemGroup.calls.mostRecent().args[0];

    // initial structure
    expect(itemGroup.visible).toBe(false);
    expect(itemGroup.items[0].text).toEqual('Inspect');
    expect(itemGroup.items[0].visible).toBe(false);
    expect(itemGroup.items[1].text).toEqual('Delete');
    expect(itemGroup.items[1].visible).toBe(false);

    // check hide()
    itemGroup.visible = true;
    itemGroup.items[0].visible = true;
    itemGroup.items[1].visible = true;
    itemGroup.hide();
    expect(itemGroup.visible).toBe(false);
    expect(itemGroup.items[0].visible).toBe(false);
    expect(itemGroup.items[1].visible).toBe(false);

    var eventMock = {stopPropagation: jasmine.createSpy('stopPropagation')};
    // check call to edit item
    itemGroup.items[0].callback(eventMock);
    expect(objectInspectorService.toggleView).toHaveBeenCalled();
    expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(false);
    expect(eventMock.stopPropagation).toHaveBeenCalled();

    // check call to delete item
    spyOn($scope, 'deleteModel');
    itemGroup.items[1].callback(eventMock);
    expect($scope.deleteModel).toHaveBeenCalled();
    expect(eventMock.stopPropagation).toHaveBeenCalled();

    // see that anyhting containing 'robot' can't be deleted
    var modelMock = {name: 'my_robot'};
    itemGroup.show(modelMock);
    expect(itemGroup.visible).toBe(true);
    expect(itemGroup.items[0].visible).toBe(true);
    expect(itemGroup.items[1].visible).toBe(false);
    modelMock.name = 'iAmNotARobot';
    itemGroup.show(modelMock);
    expect(itemGroup.visible).toBe(true);
    expect(itemGroup.items[0].visible).toBe(true);
    expect(itemGroup.items[1].visible).toBe(true);
  });

  it('should pause the simulation when needed', function () {
    stateService.currentState = $scope.STATE.STARTED;
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(stateService.ensureStateBeforeExecuting.calls.mostRecent().args[0]).toBe($scope.STATE.PAUSED);
    stateService.currentState = $scope.STATE.STARTED;
    $scope.setEditMode($scope.EDIT_MODE.ROTATE);
    expect(stateService.ensureStateBeforeExecuting.calls.mostRecent().args[0]).toBe($scope.STATE.PAUSED);
  });

  it('should not update the state if already in the correct state', function () {
    expect(stateService.setCurrentState.calls.count()).toBe(0);
    stateService.currentState = $scope.STATE.STARTED;
    $scope.setEditMode($scope.EDIT_MODE.VIEW);
    expect(stateService.setCurrentState.calls.count()).toBe(0);
    stateService.currentState = $scope.STATE.PAUSED;
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(stateService.setCurrentState.calls.count()).toBe(0);
    stateService.currentState = $scope.STATE.PAUSED;
    $scope.setEditMode($scope.EDIT_MODE.ROTATE);
    expect(stateService.setCurrentState.calls.count()).toBe(0);
  });

  it('should call the right REST API for the SDF export process', function () {
    var exportSpy = jasmine.createSpy('export');
    simulationSDFWorld.and.callFake(
      function () {
        return {
          export: exportSpy.and.callFake(function () {
          })
        };
      });

    $scope.exportSDFWorld();
    expect(simulationSDFWorld).toHaveBeenCalled();
    expect(exportSpy).toHaveBeenCalled();
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
    expect(window.guiEvents.emit).not.toHaveBeenCalledWith('spawn_entity_start', 'box');

  });

  it('should execute correctly addModel("box")', function () {

    spyOn(window.guiEvents, 'emit');

    var addBoxBtnDomElem = element.find('#insert-entity-box');
    var addBoxBtn = angular.element(addBoxBtnDomElem);

    addBoxBtn.triggerHandler('mousedown');

    //should emit 'spawn_entity_start'
    expect(window.guiEvents.emit).toHaveBeenCalledWith('spawn_entity_start', 'box');
  });

  it('should open object inspector after adding a model', function () {

    var objName = 'cylinder_0';
    var obj = {};
    obj.name = objName;

    $scope.expectedObjectName = objName;

    $scope.selectCreatedEntity(objName + ' created');

    expect($scope.gz3d.scene.selectedEntity === obj);
    expect(objectInspectorService.toggleView).toHaveBeenCalled();
  });

  it('should check interceptEntityCreationEvent', function () {

    var objName = 'cylinder_0';
    var obj = {};
    obj.name = objName;

    $scope.addModel(objName);

    // $scope.defaultEntityCreatedCallback is overwritten within
    // $scope.interceptEntityCreationEvent()
    var toBeCalled = $scope.defaultEntityCreatedCallback;

    $scope.interceptEntityCreationEvent(obj);

    expect(toBeCalled).toHaveBeenCalled();
  });

  it('should create a new dummy anchor and click it when exporting the environment', function () {
    var exportSpy = jasmine.createSpy('export');
    simulationSDFWorld.and.callFake(function () {
      return {
        export: exportSpy.and.callFake(function (args, cb) {
          cb({'sdf': 'dummysdf'});
        })
      };
    });

    var dummyAnchorElement = {
      style: {},
      click: jasmine.createSpy('click')
    };

    spyOn(document, 'createElement').and.callFake(function () {
      return dummyAnchorElement;
    });

    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');

    $scope.exportSDFWorld();
    expect(exportSpy).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(dummyAnchorElement.click).toHaveBeenCalled();
  });

  it('should emit delete_entity and toggle menu when deleteModel is called', function () {
    $scope.deleteModel();//call function
    //should emit 'delete_entity'
    expect($scope.gz3d.gui.guiEvents.emit).toHaveBeenCalledWith('delete_entity');
    //should toggle menu
    expect(contextMenuState.toggleContextMenu).toHaveBeenCalledWith(false);
  });

  it('should correctly saveSDFIntoCollabStorage', function () {
    spyOn(backendInterfaceService, 'saveSDF');
    expect($scope.isSavingToCollab).toEqual(false);
    $scope.saveSDFIntoCollabStorage();
    expect(backendInterfaceService.saveSDF).toHaveBeenCalledWith(
      simulationInfo.contextID,
      jasmine.any(Function),
      jasmine.any(Function)
    );
    expect($scope.isSavingToCollab).toEqual(true);
    backendInterfaceService.saveSDF.calls.argsFor(0)[1]();
    expect($scope.isSavingToCollab).toBe(false);
    $scope.isSavingToCollab = true;
    spyOn(hbpDialogFactory, 'alert');
    backendInterfaceService.saveSDF.calls.argsFor(0)[2]();
    expect($scope.isSavingToCollab).toBe(false);
    expect(hbpDialogFactory.alert).toHaveBeenCalled();
  });

});
