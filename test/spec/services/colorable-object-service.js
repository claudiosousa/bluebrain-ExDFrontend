'use strict';

describe('Service colorableObjectService', function () {

  //simple object in the SDF file have a visual name hardcoded
  var SDF_SIMPLE_OBJECTS_VISUAL_NAME = 'COLORABLE_VISUAL';
  var TV_VISUAL_NAME = 'screen_glass';

  var colorableObjectService, httpBackend;

  var buildThreeObject = function (names) {
    return names.reduce(function (parent, name) {
      var newObj = new window.THREE.Object3D();
      if (parent) {
        parent[0].add(newObj);
        name = parent[1] + '::' + name;
      }
      newObj.name = name;
      return [newObj, name];
    }, null)[0];
  };

  beforeEach(function () {
    module('colorableObjectModule');

    inject(function (_colorableObjectService_, _$httpBackend_) {
      colorableObjectService = _colorableObjectService_;
      httpBackend = _$httpBackend_;
    });
  });


  it('should have an isColorableEntity function', function () {
    expect(angular.isFunction(colorableObjectService.isColorableEntity)).toBe(true);
  });

  it('should have an setEntityMaterial function', function () {
    expect(angular.isFunction(colorableObjectService.isColorableEntity)).toBe(true);
  });

  it('should find TV to be a colorable object', function () {
    var tvModel = buildThreeObject(['some_model', 'some_link', TV_VISUAL_NAME]);
    expect(colorableObjectService.isColorableEntity(tvModel)).toBe(true);
  });

  it('should find a simple SDF object to be a colorable object', function () {
    var simpleObjectInSDFFile = buildThreeObject(['some_model', 'some_link', SDF_SIMPLE_OBJECTS_VISUAL_NAME]);
    expect(colorableObjectService.isColorableEntity(simpleObjectInSDFFile)).toBe(true);
  });

  it('should find a dropped sphere to be a colorable object', function () {
    var droppedObject = buildThreeObject(['sphere_12', 'link', 'visual']);
    expect(colorableObjectService.isColorableEntity(droppedObject)).toBe(true);
  });

  it('should find a dropped cylinder to be a colorable object', function () {
    var droppedObject = buildThreeObject(['cylinder_2', 'link', 'visual']);
    expect(colorableObjectService.isColorableEntity(droppedObject)).toBe(true);
  });

  it('should find a dropped box to be a colorable object', function () {
    var droppedObject = buildThreeObject(['box_0', 'link', 'visual']);
    expect(colorableObjectService.isColorableEntity(droppedObject)).toBe(true);
  });

  it('should find random object not to be colorable object', function () {
    var droppedObject = buildThreeObject(['some_name', 'link', 'visual']);
    expect(colorableObjectService.isColorableEntity(droppedObject)).toBe(false);
  });

  var CHANGE_MATERIAL_URL = 'SOME_URL';
  var SIMULATION_ID = 123;
  var MATERIAL_COLOR = 'Gazebo/Red';

  it('should trigger update_material request', function () {
    var modelNames = ['box_0', 'link', 'visual'];
    var tvModel = buildThreeObject(modelNames);

    httpBackend.expectPUT(CHANGE_MATERIAL_URL + '/simulation/' + SIMULATION_ID + '/interaction/material_change',
      { 'visual_path': modelNames.join('::'), material: MATERIAL_COLOR }
    ).respond(200);

    colorableObjectService.setEntityMaterial({ serverBaseUrl: CHANGE_MATERIAL_URL, simulationID: SIMULATION_ID }, tvModel, MATERIAL_COLOR);

    httpBackend.flush();
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  it('should trigger update_material request and append emissive postfix', function () {
    var modelNames = ['some_model', 'some_link', TV_VISUAL_NAME];
    var emissivePostfix = 'Glow';
    var tvModel = buildThreeObject(modelNames);

    httpBackend.expectPUT(CHANGE_MATERIAL_URL + '/simulation/' + SIMULATION_ID + '/interaction/material_change',
      { 'visual_path': modelNames.join('::'), material: MATERIAL_COLOR + emissivePostfix }
    ).respond(200);

    colorableObjectService.setEntityMaterial({ serverBaseUrl: CHANGE_MATERIAL_URL, simulationID: SIMULATION_ID }, tvModel, MATERIAL_COLOR);

    httpBackend.flush();
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });
});
