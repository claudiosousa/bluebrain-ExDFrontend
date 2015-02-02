'use strict';

/* global THREE: true */

describe('gz3dCameraModule -> cameraManipulation', function () {

  beforeEach(module('gz3dCameraModule'));

  // mock and provide dependencies
  var gzInitializationMock = {};

  var camera = new THREE.PerspectiveCamera();
  var initPosition = new THREE.Vector3().copy(camera.position);
  var initRotation = new THREE.Quaternion().copy(camera.quaternion);
  var rootScopeMock = {};
  rootScopeMock.scene = {};
  rootScopeMock.scene.camera = camera;

  beforeEach(module(function($provide) {
    $provide.value('gzInitialization', gzInitializationMock);
    $provide.value('$rootScope', rootScopeMock);
  }));

  // inject and set stuff
  var cameraManipulation;
  var rootScope;
  var gzInitialization;
  beforeEach(inject(function (_cameraManipulation_, _$rootScope_, _gzInitialization_) {
    cameraManipulation = _cameraManipulation_;
    rootScope = _$rootScope_;
    gzInitialization = _gzInitialization_;

    // create a mock for console
    spyOn(console, 'error');
  }));

  it('is initialized', inject(function () {
    expect(cameraManipulation).toBeDefined();
    expect(rootScope.scene.camera).toBeDefined();
    expect(gzInitialization).toBeDefined();
  }));

  it('should be able make the camera face the origin', inject(function() {
    spyOn(camera, 'lookAt').andCallThrough();

    cameraManipulation.lookAtOrigin();

    expect(camera.lookAt).toHaveBeenCalledWith(new THREE.Vector3(0,0,0));
  }));

  it('should be able to reset the camera to its initial pose', inject(function() {
    spyOn(camera.position, 'copy').andCallThrough();
    spyOn(camera.quaternion, 'copy').andCallThrough();

    cameraManipulation.resetToInitialPose();

    expect(camera.position.copy).toHaveBeenCalledWith(initPosition);
    expect(camera.quaternion.copy).toHaveBeenCalledWith(initRotation);
  }));

  it('should perform camera translation (first person mode)', inject(function () {
    spyOn(camera, 'translateOnAxis').andCallThrough();

    // starting position
    var startPos = new THREE.Vector3(0, 0, 10);
    rootScope.scene.camera.position = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
    cameraManipulation.lookAtOrigin();

    // test translation
    var translation = new THREE.Vector3(-10, 5, 10);

    cameraManipulation.firstPersonTranslate(translation.x, translation.y, translation.z);

    expect(camera.translateOnAxis).toHaveBeenCalledWith(new THREE.Vector3( 1, 0, 0 ), translation.x);
    expect(camera.translateOnAxis).toHaveBeenCalledWith(new THREE.Vector3( 0, 1, 0 ), translation.y);
    expect(camera.translateOnAxis).toHaveBeenCalledWith(new THREE.Vector3( 0, 0, -1 ), translation.z);

    // unfortunately comparing THREE.Vector3 fails although values are equal, so ...
    expect(rootScope.scene.camera.position.x).toBe(startPos.x + translation.x);
    expect(rootScope.scene.camera.position.y).toBe(startPos.y + translation.y);
    expect(rootScope.scene.camera.position.z).toBe(startPos.z - translation.z);
  }));

  it('should perform camera rotation (first person mode)', inject(function () {
    spyOn(camera.quaternion, 'multiplyQuaternions').andCallThrough();
    spyOn(camera, 'rotateOnAxis').andCallThrough();

    // starting position
    rootScope.scene.camera.position = new THREE.Vector3(0,0,10);
    cameraManipulation.lookAtOrigin();

    // test rotation
    var degreeRight = 90;
    var degreeUp = 45;

    cameraManipulation.firstPersonRotate(degreeRight, degreeUp);

    expect(camera.quaternion.multiplyQuaternions).toHaveBeenCalled();
    expect(camera.rotateOnAxis).toHaveBeenCalledWith(new THREE.Vector3( 1, 0, 0), (degreeUp/180)*Math.PI);
  }));
});
