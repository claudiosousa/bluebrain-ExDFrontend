/* global THREE: false */

'use strict';

describe('Services: objectInspectorService', function () {
  var $timeout, objectInspectorService, colorableObjectService;
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
      selectEntity: jasmine.createSpy('selectEntity'),

      modelManipulator: {
        isSelected: jasmine.createSpy('isSelected').andReturn(false),
        onPointerMove: {},
        selected: '',
        handleAxisLockEnd: jasmine.createSpy('handleAxisLockEnd'),
        selectPicker: jasmine.createSpy('selectPicker')
      }
    },
    gui: {
      guiEvents: new window.EventEmitter2({ verbose: true })
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
    module('simulationInfoService');
    module('simulationControlServices');
    module('colorableObjectModule');
    module('objectInspectorModule');
    module('experimentServices');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_, _colorableObjectService_) {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
    });
  });


  // check to see if it has the expected function
  it('should be initialized correctly', function () {
    expect(objectInspectorService.isShown).toBe(false);
    expect(objectInspectorService.selectedObject).not.toBeDefined();
  });

  it('should allow to toggle/set its display', function () {
    spyOn(objectInspectorService, 'setManipulationMode').andCallThrough();

    gz3d.scene.selectedEntity = dummyObject;
    objectInspectorService.toggleView();
    expect(objectInspectorService.selectedObject).toBeDefined();
    expect(objectInspectorService.isShown).toBe(true);

    gz3d.scene.selectedEntity = undefined;
    objectInspectorService.toggleView(false);
    expect(objectInspectorService.selectedObject).toBeDefined();
    expect(objectInspectorService.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.VIEW);
    expect(objectInspectorService.isShown).toBe(false);
  });

  it('should be able to round numbers to displayable precisions', function () {
    var number = 1.23456789;
    var rounded = objectInspectorService.roundToPrecision(number);
    expect(rounded).toBeCloseTo(number, objectInspectorService.floatPrecision);
  });

  it('should react to \'setTreeSelected\' event correctly', function () {
    spyOn(document, 'getElementById').andCallFake(function (id) {
      if (!htmlMock[id]) {
        var newElement = document.createElement('div');
        htmlMock[id] = newElement;
      }
      return htmlMock[id];
    });
    spyOn(objectInspectorService, 'roundToPrecision').andCallThrough();
    dummyObject.showCollision = undefined;
    objectInspectorService.toggleView();

    expect(gz3d.scene.selectedEntity).not.toBeDefined();
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(objectInspectorService.selectedObject).not.toBeDefined();

    gz3d.scene.selectedEntity = dummyObject;
    expect(dummyObject.showCollision).not.toBeDefined();
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(objectInspectorService.selectedObject).toBe(dummyObject);

    // translation and rotation are being rounded on update
    expect(objectInspectorService.roundToPrecision.calls.length).toBe(6);
    expect(dummyObject.showCollision).toBe(false);
    expect(objectInspectorService.showCollision).toBe(false);

    dummyObject.viewAs = 'normal';
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(document.getElementById('oi-viewmode-normal').checked).toBe(true);

    dummyObject.viewAs = 'transparent';
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(document.getElementById('oi-viewmode-transparent').checked).toBe(true);

    dummyObject.viewAs = 'wireframe';
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(document.getElementById('oi-viewmode-wireframe').checked).toBe(true);

    dummyObject.showCollision = true;
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
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

  it('should change collision geometry visibility', function () {
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

  it('should trigger  change collision geometry visibility', function () {
    spyOn(collisionVisualMock, 'traverse').andCallThrough();
  });

  it('should register guiEvents only once', function () {
    spyOn(gz3d.gui.guiEvents, 'on').andCallThrough();

    objectInspectorService.toggleView(true);

    objectInspectorService.toggleView(true);
    expect(gz3d.gui.guiEvents.on.calls.length).toBe(1);
    // gz3d.gui.guiEvents.emit('setTreeSelected');
    // $timeout.flush();
  });

  it('should call colorableObjectService.setEntityMaterial on selectMaterial', function () {
    spyOn(colorableObjectService, 'setEntityMaterial').andReturn();

    objectInspectorService.selectMaterial('TEST');

    expect(colorableObjectService.setEntityMaterial).toHaveBeenCalled();

  });

  it('should test onMouseMove', function () {
    var mouseEvent = {'test': 0};

    objectInspectorService.setSelectPicker(true);

    spyOn(objectInspectorService, 'setSelectPicker');

    objectInspectorService.onMouseMove(mouseEvent);

    expect(objectInspectorService.mouseEvent).toBe(mouseEvent);

    expect(gz3d.scene.modelManipulator.selectPicker).toHaveBeenCalled();
    expect(objectInspectorService.setSelectPicker).toHaveBeenCalledWith(false);
  });

  it('should test onMouseUp when gz3d.scene', function () {
    objectInspectorService.onMouseUp();
    expect(gz3d.scene.modelManipulator.handleAxisLockEnd).toHaveBeenCalled();
  });
});

describe('Services: objectInspectorService2', function () {
  var $timeout, objectInspectorService, colorableObjectService;
  var gz3d, stateService, EDIT_MODE, STATE;

  var gz3dMock = {
    scene: null
  };

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', {});
  }));

  beforeEach(function () {
    // load the module.
    module('simulationInfoService');
    module('simulationControlServices');
    module('colorableObjectModule');
    module('objectInspectorModule');
    module('experimentServices');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_, _colorableObjectService_) {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
    });
  });

  it('should test onXYZKeystroke when scene is null', function () {
    // expect no exception
    expect(objectInspectorService.onXYZKeystroke()).toBeUndefined();
  });

  it('should test onMouseUp', function () {
    // expect no exception
    expect(objectInspectorService.onMouseUp()).toBeUndefined();
  });
});

describe('Services: objectInspectorService3', function () {
  var $timeout, objectInspectorService, colorableObjectService;
  var gz3d, stateService, EDIT_MODE, STATE;

  var gz3dMock = {
    scene: {
      manipulationMode: 'translate',
      modelManipulator: {
        selected: 'null',
        pickerMeshes: [{'TX':'test'}],
        highlightPicker: jasmine.createSpy('highlightPicker')
      }
    }
  };

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', {});
  }));

  beforeEach(function () {
    // load the module.
    module('simulationInfoService');
    module('simulationControlServices');
    module('colorableObjectModule');
    module('objectInspectorModule');
    module('experimentServices');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_, _colorableObjectService_) {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
    });
  });

  it('should test onXYZKeystroke when modelManipulator.selected is \'null\' and X press', function () {
    var event = {keyCode:88};
    spyOn(objectInspectorService, 'setSelectPicker');
    spyOn(objectInspectorService, 'getMeshByName').andReturn('test');
    spyOn(document, 'addEventListener');

    objectInspectorService.onXYZKeystroke(event);

    expect(objectInspectorService.setSelectPicker).toHaveBeenCalledWith(true);
  });

});

describe('Services: objectInspectorService4', function () {
  var $timeout, objectInspectorService, colorableObjectService;
  var gz3d, stateService, EDIT_MODE, STATE;

  var gz3dMock = {
    scene: {
      manipulationMode: 'translate',
      modelManipulator: {
        selected: 'TX',
        pickerMeshes: [{'TX':'test'}],
        handleAxisLockEnd: jasmine.createSpy('handleAxisLockEnd')
      }
    }
  };

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', {});
  }));

  beforeEach(function () {
    // load the module.
    module('simulationInfoService');
    module('simulationControlServices');
    module('colorableObjectModule');
    module('objectInspectorModule');
    module('experimentServices');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_, _colorableObjectService_) {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
    });
  });

  it('should test onXYZKeystroke when modelManipulator.selected is not \'null\'', function () {
    objectInspectorService.onXYZKeystroke();
    expect(gz3d.scene.modelManipulator.handleAxisLockEnd).toHaveBeenCalled();
  });

});


describe('Services: objectInspectorService5', function () {
  var $timeout, objectInspectorService, colorableObjectService;
  var gz3d, stateService, EDIT_MODE, STATE;

  var gz3dMock = {
    scene: {
      manipulationMode: 'rotate',
      modelManipulator: {
        selected: 'null',
        pickerMeshes: [{'RY':'test'}],
        highlightPicker: jasmine.createSpy('highlightPicker')
      }
    }
  };

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', {});
  }));

  beforeEach(function () {
    // load the module.
    module('simulationInfoService');
    module('simulationControlServices');
    module('colorableObjectModule');
    module('objectInspectorModule');
    module('experimentServices');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_, _colorableObjectService_) {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
    });
  });

  it('should test onXYZKeystroke when rotate', function () {
    var event = {keyCode:89};
    spyOn(objectInspectorService, 'setSelectPicker');
    spyOn(objectInspectorService, 'getMeshByName').andReturn('test');
    spyOn(document, 'addEventListener');

    objectInspectorService.onXYZKeystroke(event);

    expect(objectInspectorService.setSelectPicker).toHaveBeenCalledWith(true);
  });

});

describe('Services: objectInspectorService6', function () {
  var $timeout, objectInspectorService, colorableObjectService;
  var gz3d, stateService, EDIT_MODE, STATE;

  var gz3dMock = {
    scene: {
      manipulationMode: 'rotate',
      modelManipulator: {
        selected: 'null',
        pickerMeshes: [{'RZ':'test'}],
        highlightPicker: jasmine.createSpy('highlightPicker')
      }
    }
  };

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', {});
  }));

  beforeEach(function () {
    // load the module.
    module('simulationInfoService');
    module('simulationControlServices');
    module('colorableObjectModule');
    module('objectInspectorModule');
    module('experimentServices');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_, _colorableObjectService_) {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
    });
  });

  it('should test onXYZKeystroke when Z', function () {
    var event = {keyCode:90};
    spyOn(objectInspectorService, 'setSelectPicker');
    spyOn(objectInspectorService, 'getMeshByName').andReturn('test');
    spyOn(document, 'addEventListener');

    objectInspectorService.onXYZKeystroke(event);

    expect(objectInspectorService.setSelectPicker).toHaveBeenCalledWith(true);
  });

});

describe('Services: objectInspectorService7', function () {
  var $timeout, objectInspectorService, colorableObjectService;
  var gz3d, stateService, EDIT_MODE, STATE;

  var gz3dMock = {
    scene: {
      manipulationMode: 'rotate',
      modelManipulator: {
        selected: 'null',
        pickerMeshes: [{'RZ':'test'}],
        highlightPicker: jasmine.createSpy('highlightPicker')
      }
    }
  };

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', {});
  }));

  beforeEach(function () {
    // load the module.
    module('simulationInfoService');
    module('simulationControlServices');
    module('colorableObjectModule');
    module('objectInspectorModule');
    module('experimentServices');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_, _colorableObjectService_) {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
    });
  });

  it('should test onXYZKeystroke when AnyKey', function () {
    var event = {keyCode:0};
    spyOn(objectInspectorService, 'setSelectPicker');
    spyOn(objectInspectorService, 'getMeshByName').andReturn(null);
    spyOn(document, 'addEventListener');

    objectInspectorService.onXYZKeystroke(event);
  });
});


describe('Services: objectInspectorService8', function () {
  var $timeout, objectInspectorService, colorableObjectService;
  var gz3d, stateService, EDIT_MODE, STATE;

  var gz3dMock = {
    scene: {
      manipulationMode: 'translate',
      modelManipulator: {
        selected: 'null',
        pickerMeshes: [{'TX':'test'}],
        highlightPicker: jasmine.createSpy('highlightPicker'),
        selectPicker: jasmine.createSpy('selectPicker')
      }
    }
  };

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', {});
  }));

  beforeEach(function () {
    // load the module.
    module('simulationInfoService');
    module('simulationControlServices');
    module('colorableObjectModule');
    module('objectInspectorModule');
    module('experimentServices');
    module('exdFrontendApp.Constants');

    // inject service for testing.
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_, _colorableObjectService_) {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
    });
  });

  it('should test onXYZKeystroke when modelManipulator.selected is \'null\', X press and mouseMove', function () {
    var event = {keyCode:88};
    spyOn(objectInspectorService, 'setSelectPicker');
    spyOn(objectInspectorService, 'getMeshByName').andReturn('test');
    spyOn(document, 'addEventListener');
    spyOn(objectInspectorService, 'getMouseEvent').andReturn(true);

    objectInspectorService.onXYZKeystroke(event);

    expect(gz3d.scene.modelManipulator.selectPicker).toHaveBeenCalled();
  });

});
