/* global THREE: false */
/* global GZ3D: false */

'use strict';

GZ3D.TRANSFORM_TYPE_NAME_PREFIX = { //same as GZ3D.TRANSFORM_TYPE_NAME_PREFIX
  TRANSLATE:  'T',
  SCALE:      'S',
  ROTATE:     'R',
  ALL:        'A',
  NONE:       'N'
};

describe('Services: objectInspectorService', function () {
  var $timeout, objectInspectorService, colorableObjectService;
  var gz3d, stateService, EDIT_MODE, STATE, OBJECT_VIEW_MODE;
  var mockObject;

  var DummyModelManipulator = function() {
    this.isSelected = jasmine.createSpy('isSelected').andReturn(false);
    this.onPointerMove = {};
    this.selected = '';
    this.handleAxisLockEnd = jasmine.createSpy('handleAxisLockEnd');
    this.selectPicker = jasmine.createSpy('selectPicker');
  };
  DummyModelManipulator.prototype = Object.create(THREE.EventDispatcher.prototype);

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

      modelManipulator: new DummyModelManipulator()
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


  var collisionVisualMock = new THREE.Object3D();
  collisionVisualMock.name = 'test_COLLISION_VISUAL';

  var meshMock = new THREE.Mesh();
  collisionVisualMock.add(meshMock);

  var prepareDummyObject = function(collisionVisualMock) {

    var dummyObject  = new THREE.Object3D();
    dummyObject.position.set(1, 2, 3);
    dummyObject.rotation.set(4, 5, 6);
    dummyObject.scale.set(2, 2 ,2);
    dummyObject.updateMatrixWorld();
    dummyObject.userData = {shapeName: 'complex'};
    dummyObject.getShapeName = function () { return dummyObject.userData.shapeName || 'complex'; };

    dummyObject.add(collisionVisualMock);
    return dummyObject;

  };

  // provide mock objects
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gz3dMock);
    $provide.value('stateService', stateServiceMock);
    $provide.value('mockObject', prepareDummyObject(collisionVisualMock));
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
    inject(function (_$timeout_, _objectInspectorService_, _gz3d_, _stateService_, _EDIT_MODE_, _STATE_,
      _colorableObjectService_, _mockObject_, _OBJECT_VIEW_MODE_)
    {
      $timeout = _$timeout_;
      objectInspectorService = _objectInspectorService_;
      gz3d = _gz3d_;
      stateService = _stateService_;
      EDIT_MODE = _EDIT_MODE_;
      STATE = _STATE_;
      colorableObjectService = _colorableObjectService_;
      mockObject = _mockObject_;
      OBJECT_VIEW_MODE = _OBJECT_VIEW_MODE_;
    });

  });

  // check to see if it has the expected function
  it('should be initialized correctly', function () {
    expect(objectInspectorService.isShown).toBe(false);
    expect(objectInspectorService.selectedObject).not.toBeDefined();
  });

  it('should allow to toggle/set its display', function () {
    spyOn(objectInspectorService, 'setManipulationMode').andCallThrough();

    gz3d.scene.selectedEntity = mockObject;
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
    mockObject.showCollision = undefined;
    objectInspectorService.toggleView();

    expect(gz3d.scene.selectedEntity).not.toBeDefined();
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(objectInspectorService.selectedObject).not.toBeDefined();

    gz3d.scene.selectedEntity = mockObject;
    expect(mockObject.showCollision).not.toBeDefined();
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(objectInspectorService.selectedObject).toBe(mockObject);

    // translation, scaling. rotation are being rounded on update
    expect(objectInspectorService.roundToPrecision.calls.length).toBe(18);
    expect(mockObject.showCollision).toBe(false);
    expect(objectInspectorService.showCollision).toBe(false);

    mockObject.viewAs = 'normal';
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(document.getElementById('oi-viewmode-normal').checked).toBe(true);

    mockObject.viewAs = 'transparent';
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(document.getElementById('oi-viewmode-transparent').checked).toBe(true);

    mockObject.viewAs = 'wireframe';
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(document.getElementById('oi-viewmode-wireframe').checked).toBe(true);

    mockObject.showCollision = true;
    gz3d.gui.guiEvents.emit('setTreeSelected');
    $timeout.flush();
    expect(objectInspectorService.showCollision).toBe(true);
  });

  it('should react to \'delete_entity\' event correctly: shown', function () {

    gz3d.scene.selectedEntity = mockObject;
    objectInspectorService.toggleView(true);
    expect(objectInspectorService.isShown).toBe(true);

    gz3d.gui.guiEvents.emit('delete_entity');
    gz3d.scene.selectedEntity = null;

    $timeout.flush();
    expect(objectInspectorService.selectedObject).toBeFalsy();

  });

  it('should react correctly to changes to the object', function () {
    spyOn(mockObject, 'updateMatrixWorld').andCallThrough();
    spyOn(objectInspectorService, 'updateSelectedObject').andCallThrough();

    objectInspectorService.selectedObject = mockObject;
    var position = new THREE.Vector3(1, 2, 3);
    mockObject.position.copy(position);
    objectInspectorService.onObjectChange(GZ3D.TRANSFORM_TYPE_NAME_PREFIX.TRANSLATE);

    expect(mockObject.updateMatrixWorld).toHaveBeenCalled();
    expect(objectInspectorService.updateSelectedObject).toHaveBeenCalledWith(GZ3D.TRANSFORM_TYPE_NAME_PREFIX.TRANSLATE);
    expect(gz3d.scene.emitter.emit).toHaveBeenCalledWith('entityChanged', mockObject);
  });

  var axes = ['x','y','z'];

  angular.forEach(axes, function(axis) {

    var idx = 'T' + axis.toUpperCase();

    it('should NOT update the selected object while translating, if the new value is undefined', function () {
     spyOn(objectInspectorService, 'onObjectChange');

     //new value is undefined
     objectInspectorService.translation[axis] = undefined;

     //trigger onTranslationChange
     objectInspectorService.onTranslationChange(axis);

     //should not invoke onObjectChange
     expect(objectInspectorService.onObjectChange).not.toHaveBeenCalled();
    });

    it('should update the selected object while translating, if the new value is 0', function () {
     spyOn(objectInspectorService, 'onObjectChange');
     //new value is 0
     objectInspectorService.translation[axis] = 0;

     //trigger onTranslationChange
     objectInspectorService.onTranslationChange(axis);

     //must not invoke onObjectChange
     expect(objectInspectorService.onObjectChange).toHaveBeenCalled();
    });

    idx = 'S' + axis.toUpperCase();

    it('should NOT update the selected object while scaling, if the new value is 0', function () {
     spyOn(objectInspectorService, 'onObjectChange');
     //new value is 0
     objectInspectorService.scaling[axis] = 0;

     //trigger onScaleChange
     objectInspectorService.onScaleChange(axis);

     //must not invoke onObjectChange
     expect(objectInspectorService.onObjectChange).not.toHaveBeenCalled();
    });

    it('should NOT update the selected object while scaling, if the new value is undefined', function () {
     spyOn(objectInspectorService, 'onObjectChange');
     //new value is undefined
     objectInspectorService.scaling[axis] = undefined;

     //trigger onScaleChange
     objectInspectorService.onScaleChange(axis);

     //must not invoke onObjectChange
     expect(objectInspectorService.onObjectChange).not.toHaveBeenCalled();
    });

    idx = 'R' + axis.toUpperCase();

    it('should NOT update the selected object while rotating, if the new value is undefined', function () {
     spyOn(objectInspectorService, 'onObjectChange');
     //new value is undefined
     objectInspectorService.rotationEuler[axis] = undefined;

     //trigger onRotationChange
     objectInspectorService.onRotationChange(axis);

     //must not invoke onObjectChange
     expect(objectInspectorService.onObjectChange).not.toHaveBeenCalled();
    });

    it('should update the selected object while rotating, if the new value is 0', function () {
     spyOn(objectInspectorService, 'onObjectChange');
     //new value is 0
     objectInspectorService.rotationEuler[axis] = 0;

     //trigger onRotationChange
     objectInspectorService.onRotationChange(axis);

     //must not invoke onObjectChange
     expect(objectInspectorService.onObjectChange).toHaveBeenCalled();
    });
  });

  angular.forEach(axes, function(axis) {

      var oldScaling;
      var newValue = 0.5;
      var shapeName;

      it('should perform shape preserving scaling: Sphere', function () {

        shapeName= 'sphere';
        oldScaling = mockObject.scale;

        preserveShapeTestSetup(axis, newValue, shapeName);

        objectInspectorService.onScaleChange(axis);// invoke test target

        shapeConstraintsTest(newValue, axis, oldScaling, shapeName);
      });

      it('should perform shape preserving scaling: Cylinder', function () {

        shapeName = 'cylinder';
        oldScaling = mockObject.scale;

        preserveShapeTestSetup(axis, newValue, shapeName);

        objectInspectorService.onScaleChange(axis);// invoke test target

        shapeConstraintsTest(newValue, axis, oldScaling, shapeName);

      });

      it('should perform shape preserving scaling: Box', function () {

        shapeName = 'box';
        oldScaling = mockObject.scale;

        preserveShapeTestSetup(axis, newValue, shapeName);

        objectInspectorService.onScaleChange(axis);// invoke test target

        shapeConstraintsTest(newValue, axis, oldScaling, shapeName);

      });

   });

  var preserveShapeTestSetup = function (axis, newValue, shapeName) {
   mockObject.userData.shapeName = shapeName;

   objectInspectorService.selectedObject = mockObject;
   objectInspectorService.scaling.copy(mockObject.scale);

   objectInspectorService.scaling[axis] = newValue;

  };

  var shapeConstraintsTest = function (newValue, axis, oldScaling, shapeName) {
    var expectedScaling;
    switch(shapeName) {

      case 'sphere':
        // X = Y = Z
        expect(objectInspectorService.scaling).toEqual(new THREE.Vector3(newValue, newValue, newValue));
        break;
      case 'cylinder':
        expectedScaling = new THREE.Vector3();

        if(axis === 'x' || axis === 'y') {
          // X = Y, Z
          expectedScaling.set(newValue, newValue, oldScaling.z);
        }
        else {
          expectedScaling.set(oldScaling.x, oldScaling.y, newValue);
        }
        expect(objectInspectorService.scaling).toEqual(expectedScaling);
        break;
      case 'box':
        // X, Y, Z are independent
        expectedScaling = new THREE.Vector3().copy(oldScaling);
        expectedScaling[axis] = newValue;
        expect(objectInspectorService.scaling).toEqual(expectedScaling);
    }

  };

  it('should disable the inspector scale fields when a complex shape is selected', function() {

     objectInspectorService.selectedObject = mockObject;//complex object

     expect(objectInspectorService.isSelectedObjectSimpleShape()).toBe(false);
  });

  it('should set the view mode', function () {
    objectInspectorService.selectedObject = mockObject;
    mockObject.viewAs = 'normal';

    objectInspectorService.setViewMode('normal');
    expect(gz3d.scene.setViewAs).not.toHaveBeenCalled();

    objectInspectorService.setViewMode('transparent');
    expect(gz3d.scene.setViewAs).toHaveBeenCalledWith(mockObject, 'transparent');
  });

  it('should set the manipulation mode correctly', function () {
    gz3d.scene.setManipulationMode.reset();

    objectInspectorService.selectedObject = mockObject;

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
    expect(gz3d.scene.selectEntity).toHaveBeenCalledWith(mockObject);

    gz3d.scene.setManipulationMode.reset();
    stateService.ensureStateBeforeExecuting.reset();
    gz3d.scene.selectEntity.reset();

    // set to scale mode
    gz3d.scene.manipulationMode = EDIT_MODE.VIEW;
    objectInspectorService.setManipulationMode(EDIT_MODE.SCALE);
    expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));
    expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.SCALE);
    expect(gz3d.scene.selectEntity).toHaveBeenCalledWith(mockObject);

    gz3d.scene.setManipulationMode.reset();
    stateService.ensureStateBeforeExecuting.reset();
    gz3d.scene.selectEntity.reset();

    // set to rotate mode
    objectInspectorService.setManipulationMode(EDIT_MODE.ROTATE);
    expect(stateService.ensureStateBeforeExecuting).toHaveBeenCalledWith(STATE.PAUSED, jasmine.any(Function));
    expect(gz3d.scene.setManipulationMode).toHaveBeenCalledWith(EDIT_MODE.ROTATE);
    expect(gz3d.scene.selectEntity).toHaveBeenCalledWith(mockObject);
  });

  it('should highlight the the correct fields when manipulating an object', function () {

    objectInspectorService.selectedStyle = {
      'TX': '', 'TY': '', 'TZ': '',
      'SX': '', 'SY': '', 'SZ': '',
      'RX': '', 'RY': '', 'RZ': ''
    };


    var containsStr = function(a, b) {return a.search(b) !== -1;};

    var buildIsSelectedFunction = function(manipulatorAxis) {
       return function (idx) {
          return containsStr(manipulatorAxis, idx);
       };
    };

    var test =  function (manipulatorAxisUnderTest) {
       //iterate over selectedStyle
       angular.forEach(
        objectInspectorService.selectedStyle,
        function(fieldStyle, field) {

          var transform = field[0];
          var axis = field[1];

          if(containsStr(manipulatorAxisUnderTest, transform) &&
             containsStr(manipulatorAxisUnderTest, axis)) {

             expect(fieldStyle).not.toBe('');//highlighted
          }
          else {
            if(manipulatorAxisUnderTest !== 'RE') {
              expect(fieldStyle).toBe('');//not highlighted
            }
            else if (transform === 'R') { //cheking R{X,Y,Z} fields
              //since RE is selected, every field must be highlighted
              expect(fieldStyle).not.toBe('');//highlighted
            }
          }
        }
       );
    };

    gz3d.scene.selectedEntity =
      objectInspectorService.selectedObject =
        gz3d.scene.modelManipulator.selected = mockObject;

    var invokeUpdate = function(manipulatorAxes) {
        //set isSelected function
        gz3d.scene.modelManipulator.isSelected = buildIsSelectedFunction(manipulatorAxes);
        objectInspectorService.onMouseMove(); //invoke update
    };

    //Translate
    angular.forEach(
      ['TX', 'TY', 'TZ', 'TXY', 'TXZ','TYZ'],
      function (manipulatorAxes) {
        invokeUpdate(manipulatorAxes);
        test(manipulatorAxes);
      }
    );

    //Scale
    angular.forEach(
      ['SX', 'SY', 'SZ'],
      function (manipulatorAxes) {
        invokeUpdate(manipulatorAxes);
        test(manipulatorAxes);
      }
    );

    //Rotate
    angular.forEach(
      ['RX', 'RY', 'RZ', 'RE'],
      function (manipulatorAxes) {
        invokeUpdate(manipulatorAxes);
        test(manipulatorAxes);
      }
    );

  });

  it('should change collision geometry visibility', function () {
  
    spyOn(collisionVisualMock, 'traverse').andCallThrough();

    objectInspectorService.selectedObject = mockObject;
    meshMock.visible = false;
    objectInspectorService.showCollision = objectInspectorService.selectedObject.showCollision = false;

    objectInspectorService.showCollision = true;
    objectInspectorService.onShowCollisionChange();
    expect(mockObject.showCollision).toBe(true);
    expect(collisionVisualMock.traverse).toHaveBeenCalled();
    expect(meshMock.visible).toBe(true);
  });

  it('should trigger change collision geometry visibility', function () {
    spyOn(collisionVisualMock, 'traverse').andCallThrough();
  });

  it('should correctly detect simple Shapes when selecting', function () {

    objectInspectorService.selectedObject = {
      isSimpleShape: function() {return true;}
    };//simple object

    expect(objectInspectorService.isSelectedObjectSimpleShape()).toBe(true);

    objectInspectorService.selectedObject = {
      isSimpleShape: undefined
    };//non simple object

    expect(objectInspectorService.isSelectedObjectSimpleShape()).toBe(false);

  });

  it('should set view mode when updating and a light is selected', function () {

      gz3d.scene.selectedEntity = new THREE.Light(); //select a light

      spyOn(objectInspectorService, 'checkLightSelected').andCallThrough();
      spyOn(objectInspectorService, 'setViewMode').andCallThrough();

      //invoke target
      objectInspectorService.update();

      expect(objectInspectorService.checkLightSelected).toHaveBeenCalled();
      expect(objectInspectorService.setViewMode).toHaveBeenCalledWith(OBJECT_VIEW_MODE.WIREFRAME);
  });

  it('should register guiEvents only once', function () {
    spyOn(gz3d.gui.guiEvents, 'on').andCallThrough();

    objectInspectorService.toggleView(true);

    objectInspectorService.toggleView(true);
    expect(gz3d.gui.guiEvents.on.calls.length).toBe(2);
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

  it('should test onAxisMoveEnd when gz3d.scene', function () {
    objectInspectorService.onAxisMoveEnd();
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

  it('should test onAxisMoveEnd', function () {
    // expect no exception
    expect(objectInspectorService.onAxisMoveEnd()).toBeUndefined();
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
    var event = {code:'KeyX'};
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
    var event = {code:'KeyY'};
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
    var event = {code:'KeyZ'};
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
    var event = {code:'KeyX'};
    spyOn(objectInspectorService, 'setSelectPicker');
    spyOn(objectInspectorService, 'getMeshByName').andReturn('test');
    spyOn(document, 'addEventListener');
    spyOn(objectInspectorService, 'getMouseEvent').andReturn(true);

    objectInspectorService.onXYZKeystroke(event);

    expect(gz3d.scene.modelManipulator.selectPicker).toHaveBeenCalled();
  });

});
