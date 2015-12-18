/* global THREE: false */

'use strict';

describe('Services: objectEditorService', function () {
  var objectEditorService;
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

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', stateServiceMock);
  }));

  beforeEach(function () {
    // load the module.
    module('objectEditorModule');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_objectEditorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_) {
      objectEditorService = _objectEditorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
    });
  });


  // check to see if it has the expected function
  it('should be initialized correctly', function () {
    expect(objectEditorService.isShown).toBe(false);
    expect(objectEditorService.selectedObject).not.toBeDefined();
  });

  it('should allow to toggle/set its display', function () {
    spyOn(objectEditorService, 'update').andCallThrough();
    spyOn(objectEditorService, 'setManipulationMode').andCallThrough();

    objectEditorService.toggleView();
    expect(objectEditorService.update).toHaveBeenCalled();
    expect(objectEditorService.isShown).toBe(true);

    objectEditorService.update.reset();

    objectEditorService.toggleView(false);
    expect(objectEditorService.update).not.toHaveBeenCalled();
    expect(objectEditorService.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.VIEW);
    expect(objectEditorService.isShown).toBe(false);
  });

  it('should be able to round numbers to displayable precisions', function() {
    var number = 1.23456789;
    var rounded = objectEditorService.roundToPrecision(number);
    expect(rounded).toBeCloseTo(number, objectEditorService.floatPrecision);
  });

  it('should update() correctly', function () {
    spyOn(document, 'getElementById').andCallFake(function (id) {
      if (!htmlMock[id]) {
        var newElement = document.createElement('div');
        htmlMock[id] = newElement;
      }
      return htmlMock[id];
    });
    spyOn(objectEditorService, 'roundToPrecision').andCallThrough();

    expect(gz3d.scene.selectedEntity).not.toBeDefined();
    objectEditorService.update();
    expect(objectEditorService.selectedObject).not.toBeDefined();

    gz3d.scene.selectedEntity = dummyObject;

    dummyObject.viewAs = 'normal';
    objectEditorService.update();
    expect(objectEditorService.selectedObject).toBe(dummyObject);
    // translation and rotation are being rounded on update
    expect(objectEditorService.roundToPrecision.calls.length).toBe(6);
    expect(document.getElementById('oe-viewmode-normal').checked).toBe(true);

    dummyObject.viewAs = 'transparent';
    objectEditorService.update();
    expect(document.getElementById('oe-viewmode-transparent').checked).toBe(true);

    dummyObject.viewAs = 'wireframe';
    objectEditorService.update();
    expect(document.getElementById('oe-viewmode-wireframe').checked).toBe(true);
  });

  it('should react correctly to changes to the object', function () {
    spyOn(dummyObject, 'updateMatrixWorld').andCallThrough();

    objectEditorService.selectedObject = dummyObject;
    var position = new THREE.Vector3(1, 2, 3);
    dummyObject.position.copy(position);
    objectEditorService.onObjectChange();

    expect(dummyObject.updateMatrixWorld).toHaveBeenCalled();
    expect(gz3d.scene.emitter.emit).toHaveBeenCalledWith('entityChanged', dummyObject);
  });

  it('should set the view mode correctly', function () {
    objectEditorService.selectedObject = dummyObject;
    dummyObject.viewAs = 'normal';

    objectEditorService.setViewMode('normal');
    expect(gz3d.scene.setViewAs).not.toHaveBeenCalled();

    objectEditorService.setViewMode('transparent');
    expect(gz3d.scene.setViewAs).toHaveBeenCalledWith(dummyObject, 'transparent');
  });

  it('should set the manipulation mode correctly', function () {
    gz3d.scene.setManipulationMode.reset();

    objectEditorService.selectedObject = dummyObject;

    // setting same view mode should do nothing
    gz3d.scene.manipulationMode = EDIT_MODE.VIEW;
    objectEditorService.setManipulationMode(EDIT_MODE.VIEW);
    expect(gz3d.scene.setManipulationMode).not.toHaveBeenCalled();

    // set to view mode
    gz3d.scene.manipulationMode = EDIT_MODE.TRANSLATE;
    objectEditorService.setManipulationMode(EDIT_MODE.VIEW);
    expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.VIEW);

    gz3d.scene.setManipulationMode.reset();

    // set to translate mode
    gz3d.scene.manipulationMode = EDIT_MODE.VIEW;
    objectEditorService.setManipulationMode(EDIT_MODE.TRANSLATE);
    expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));
    expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.TRANSLATE);
    expect(gz3d.scene.selectEntity).toHaveBeenCalledWith(dummyObject);

    gz3d.scene.setManipulationMode.reset();
    stateService.ensureStateBeforeExecuting.reset();
    gz3d.scene.selectEntity.reset();

    // set to rotate mode
    objectEditorService.setManipulationMode(EDIT_MODE.ROTATE);
    expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));
    expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.ROTATE);
    expect(gz3d.scene.selectEntity).toHaveBeenCalledWith(dummyObject);
  });
});
