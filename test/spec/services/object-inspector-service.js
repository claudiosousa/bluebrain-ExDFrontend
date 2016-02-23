/* global THREE: false */

'use strict';

describe('Services: objectInspectorService', function () {
  var objectInspectorService;
  var gz3d, stateService, EDIT_MODE, STATE;

  var gz3dMock = {
    scene: {
      selectedEntity: undefined,
      manipulationMode: undefined,
      emitter: {
        emit: jasmine.createSpy('emit')
      },
      setViewAs: jasmine.createSpy('setViewAs'),
      setManipulationMode: jasmine.createSpy('setManipulationMode'),
      selectEntity: jasmine.createSpy('selectEntity')
    }
  };
  var stateServiceMock = {
    ensureStateBeforeExecuting: jasmine.createSpy('ensureStateBeforeExecuting').andCallFake(
      function (state, callback) {
        callback();
    })
  };

  var htmlMock = {};
  htmlMock['oe-viewmode-normal'] = document.createElement('input');
  htmlMock['oe-viewmode-transparent'] = document.createElement('input');
  htmlMock['oe-viewmode-wireframe'] = document.createElement('input');

  var dummyObject = new THREE.Object3D();
  dummyObject.position.set(1, 2, 3);
  dummyObject.rotation.set(4, 5, 6);
  dummyObject.updateMatrixWorld();
  var collisionVisualMock = new THREE.Object3D();
  collisionVisualMock.name = 'test_COLLISION_VISUAL';
  dummyObject.add(collisionVisualMock);
  var meshMock = new THREE.Mesh();
  collisionVisualMock.add(meshMock);

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', stateServiceMock);
  }));

  beforeEach(function () {
    // load the module.
    module('objectInspectorModule');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_) {
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
    });
  });


  // check to see if it has the expected function
  it('should be initialized correctly', function () {
    expect(objectInspectorService.isShown).toBe(false);
    expect(objectInspectorService.selectedObject).not.toBeDefined();
  });

  it('should allow to toggle/set its display', function () {
    spyOn(objectInspectorService, 'update').andCallThrough();
    spyOn(objectInspectorService, 'setManipulationMode').andCallThrough();

    objectInspectorService.toggleView();
    expect(objectInspectorService.update).toHaveBeenCalled();
    expect(objectInspectorService.isShown).toBe(true);

    objectInspectorService.update.reset();

    objectInspectorService.toggleView(false);
    expect(objectInspectorService.update).not.toHaveBeenCalled();
    expect(objectInspectorService.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.VIEW);
    expect(objectInspectorService.isShown).toBe(false);
  });

  it('should be able to round numbers to displayable precisions', function() {
    var number = 1.23456789;
    var rounded = objectInspectorService.roundToPrecision(number);
    expect(rounded).toBeCloseTo(number, objectInspectorService.floatPrecision);
  });

  it('should update() correctly', function () {
    spyOn(document, 'getElementById').andCallFake(function (id) {
      if (!htmlMock[id]) {
        var newElement = document.createElement('div');
        htmlMock[id] = newElement;
      }
      return htmlMock[id];
    });
    spyOn(objectInspectorService, 'roundToPrecision').andCallThrough();

    expect(gz3d.scene.selectedEntity).not.toBeDefined();
    objectInspectorService.update();
    expect(objectInspectorService.selectedObject).not.toBeDefined();

    gz3d.scene.selectedEntity = dummyObject;
    expect(dummyObject.showCollision).not.toBeDefined();
    objectInspectorService.update();
    expect(objectInspectorService.selectedObject).toBe(dummyObject);
    // translation and rotation are being rounded on update
    expect(objectInspectorService.roundToPrecision.calls.length).toBe(6);
    expect(dummyObject.showCollision).toBe(false);
    expect(objectInspectorService.showCollision).toBe(false);

    dummyObject.viewAs = 'normal';
    objectInspectorService.update();
    expect(document.getElementById('oi-viewmode-normal').checked).toBe(true);

    dummyObject.viewAs = 'transparent';
    objectInspectorService.update();
    expect(document.getElementById('oi-viewmode-transparent').checked).toBe(true);

    dummyObject.viewAs = 'wireframe';
    objectInspectorService.update();
    expect(document.getElementById('oi-viewmode-wireframe').checked).toBe(true);

    dummyObject.showCollision = true;
    objectInspectorService.update();
    expect(objectInspectorService.showCollision).toBe(true);
  });

  it('should react correctly to changes to the object', function () {
    spyOn(dummyObject, 'updateMatrixWorld').andCallThrough();

    objectInspectorService.selectedObject = dummyObject;
    var position = new THREE.Vector3(1, 2, 3);
    dummyObject.position.copy(position);
    objectInspectorService.onObjectChange();

    expect(dummyObject.updateMatrixWorld).toHaveBeenCalled();
    expect(gz3d.scene.emitter.emit).toHaveBeenCalledWith('entityChanged', dummyObject);
  });

  it('should set the view mode correctly', function () {
    objectInspectorService.selectedObject = dummyObject;
    dummyObject.viewAs = 'normal';

    objectInspectorService.setViewMode('normal');
    expect(gz3d.scene.setViewAs).not.toHaveBeenCalled();

    objectInspectorService.setViewMode('transparent');
    expect(gz3d.scene.setViewAs).toHaveBeenCalledWith(dummyObject, 'transparent');
  });

  it('should set the manipulation mode correctly', function () {
    gz3d.scene.setManipulationMode.reset();

    objectInspectorService.selectedObject = dummyObject;

    // setting same view mode should do nothing
    gz3d.scene.manipulationMode = EDIT_MODE.VIEW;
    objectInspectorService.setManipulationMode(EDIT_MODE.VIEW);
    expect(gz3d.scene.setManipulationMode).not.toHaveBeenCalled();

    // set to view mode
    gz3d.scene.manipulationMode = EDIT_MODE.TRANSLATE;
    objectInspectorService.setManipulationMode(EDIT_MODE.VIEW);
    expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.VIEW);

    gz3d.scene.setManipulationMode.reset();

    // set to translate mode
    gz3d.scene.manipulationMode = EDIT_MODE.VIEW;
    objectInspectorService.setManipulationMode(EDIT_MODE.TRANSLATE);
    expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));
    expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.TRANSLATE);
    expect(gz3d.scene.selectEntity).toHaveBeenCalledWith(dummyObject);

    gz3d.scene.setManipulationMode.reset();
    stateService.ensureStateBeforeExecuting.reset();
    gz3d.scene.selectEntity.reset();

    // set to rotate mode
    objectInspectorService.setManipulationMode(EDIT_MODE.ROTATE);
    expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));
    expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.ROTATE);
    expect(gz3d.scene.selectEntity).toHaveBeenCalledWith(dummyObject);
  });

  it('should change collision geometry visibility', function() {
    spyOn(collisionVisualMock, 'traverse').andCallThrough();

    objectInspectorService.selectedObject = dummyObject;
    meshMock.visible = false;
    objectInspectorService.showCollision = objectInspectorService.selectedObject.showCollision = false;

    objectInspectorService.showCollision = true;
    objectInspectorService.onShowCollisionChange();
    expect(dummyObject.showCollision).toBe(true);
    expect(collisionVisualMock.traverse).toHaveBeenCalled();
    expect(meshMock.visible).toBe(true);
  });
});
