'use strict';

/* global THREE: true */

function createKeyEvent(eventType, key) {
  var event = document.createEvent('Event');
  event.keyCode = key;
  event.initEvent(eventType, true, true);

  return event;
}

function createMouseEvent(eventType, button, pageX, pageY) {
  var event = document.createEvent('Event');
  event.button = button;
  event.pageX = pageX;
  event.pageY = pageY;
  event.initEvent(eventType, true, true);

  return event;
}

function triggerKeyEvent(targetElement, eventType, key) {
  var event = createKeyEvent(eventType, key);
  targetElement.dispatchEvent(event);
}

function triggerMouseEvent(targetElement, eventType, button, x, y) {
  var event = createMouseEvent(eventType, button, x, y);
  targetElement.dispatchEvent(event);
}

describe('FirstPersonControls', function () {

  var camera;
  var domElement;
  var domElementForKeyBindings;
  var firstPersonControls;

  beforeEach(function() {
    camera = new THREE.PerspectiveCamera();

    domElement = document.createElement('dummyElement');
    domElementForKeyBindings = document.createElement('keyBindingDummyElement');
    spyOn(domElement, 'addEventListener').andCallThrough();
    spyOn(domElement, 'setAttribute').andCallThrough();
    spyOn(domElementForKeyBindings, 'addEventListener').andCallThrough();

    firstPersonControls = new THREE.FirstPersonControls(camera, domElement, domElementForKeyBindings);
    spyOn(firstPersonControls, 'onKeyDown').andCallThrough();
    spyOn(firstPersonControls, 'onKeyUp').andCallThrough();
    spyOn(firstPersonControls, 'onMouseDown').andCallThrough();
    spyOn(firstPersonControls, 'onMouseUp').andCallThrough();
    spyOn(firstPersonControls, 'onMouseMove').andCallThrough();
  });

  it('should get initialized', inject(function () {
    /* normal init from beforeEach */
    expect(firstPersonControls.object).toEqual(camera);
    expect(firstPersonControls.domElement).toEqual(domElement);

    /* some element !== document */
    firstPersonControls = new THREE.FirstPersonControls(camera, domElement, domElementForKeyBindings);
    expect(domElement.setAttribute).toHaveBeenCalledWith( 'tabindex', -1 );

    /* undefined element */
    firstPersonControls = new THREE.FirstPersonControls(camera);
    expect(firstPersonControls.domElement).toEqual(document);
  }));

  it('should register all relevant event listeners', inject(function () {
    expect(domElement.addEventListener.argsForCall[0][0]).toMatch(/contextmenu/);
    expect(domElement.addEventListener.argsForCall[1][0]).toMatch(/mousemove/);
    expect(domElement.addEventListener.argsForCall[2][0]).toMatch(/mousedown/);
    expect(domElement.addEventListener.argsForCall[3][0]).toMatch(/mouseup/);
    expect(domElementForKeyBindings.addEventListener.argsForCall[0][0]).toMatch(/keydown/);
    expect(domElementForKeyBindings.addEventListener.argsForCall[1][0]).toMatch(/keyup/);
  }));

  it('should handle key events for W/A/S/D/R/F/Q', inject(function() {
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 87/*W*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 65/*A*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 83/*S*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 68/*D*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 82/*R*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 70/*F*/);

    //expect(firstPersonControls.onKeyDown.callCount).toEqual(7);
    expect(firstPersonControls.moveForward).toBe(true);
    expect(firstPersonControls.moveLeft).toBe(true);
    expect(firstPersonControls.moveBackward).toBe(true);
    expect(firstPersonControls.moveRight).toBe(true);
    expect(firstPersonControls.moveUp).toBe(true);
    expect(firstPersonControls.moveDown).toBe(true);

    triggerKeyEvent(domElementForKeyBindings, 'keyup', 87/*W*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 65/*A*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 83/*S*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 68/*D*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 82/*R*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 70/*F*/);

    expect(firstPersonControls.moveForward).toBe(false);
    expect(firstPersonControls.moveLeft).toBe(false);
    expect(firstPersonControls.moveBackward).toBe(false);
    expect(firstPersonControls.moveRight).toBe(false);
    expect(firstPersonControls.moveUp).toBe(false);
    expect(firstPersonControls.moveDown).toBe(false);

    triggerKeyEvent(domElementForKeyBindings, 'keyup', 81/*Q*/);
    expect(firstPersonControls.freeze).toBe(true);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 81/*Q*/);
    expect(firstPersonControls.freeze).toBe(false);
  }));

  it('should handle key events for up/left/down/right/pageup/pagedown', inject(function() {
    //spyOn(firstPersonControls, 'onKeyDown').andCallThrough();

    triggerKeyEvent(domElementForKeyBindings, 'keydown', 38/*up*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 37/*left*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 40/*down*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 39/*right*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 33/*pageup*/);
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 34/*pagedown*/);

    expect(firstPersonControls.moveForward).toEqual(true);
    expect(firstPersonControls.moveLeft).toEqual(true);
    expect(firstPersonControls.moveBackward).toEqual(true);
    expect(firstPersonControls.moveRight).toEqual(true);
    expect(firstPersonControls.moveUp).toEqual(true);
    expect(firstPersonControls.moveDown).toEqual(true);

    triggerKeyEvent(domElementForKeyBindings, 'keyup', 38/*up*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 37/*left*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 40/*down*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 39/*right*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 33/*pageup*/);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 34/*pagedown*/);

    expect(firstPersonControls.moveForward).toEqual(false);
    expect(firstPersonControls.moveLeft).toEqual(false);
    expect(firstPersonControls.moveBackward).toEqual(false);
    expect(firstPersonControls.moveRight).toEqual(false);
    expect(firstPersonControls.moveUp).toEqual(false);
    expect(firstPersonControls.moveDown).toEqual(false);
  }));

  it('should translate according to the keys pressed', inject(function() {
    camera.position.set(0, 0, 10);
    camera.lookAt(new THREE.Vector3(0,0,0));
    var posStart = new THREE.Vector3(), posEnd = new THREE.Vector3();

    expect(firstPersonControls.enabled).toBe(true);

    posStart.copy(camera.position);
    firstPersonControls.moveForward = true;
    firstPersonControls.update();
    firstPersonControls.moveForward = false;
    posEnd.copy(camera.position);
    expect(posEnd.z - posStart.z < 0).toBe(true);

    posStart.copy(camera.position);
    firstPersonControls.moveBackward = true;
    firstPersonControls.update();
    firstPersonControls.moveBackward = false;
    posEnd.copy(camera.position);
    expect(posEnd.z - posStart.z > 0).toBe(true);

    posStart.copy(camera.position);
    firstPersonControls.moveLeft = true;
    firstPersonControls.update();
    firstPersonControls.moveLeft = false;
    posEnd.copy(camera.position);
    expect(posEnd.x - posStart.x < 0).toBe(true);

    posStart.copy(camera.position);
    firstPersonControls.moveRight = true;
    firstPersonControls.update();
    firstPersonControls.moveRight = false;
    posEnd.copy(camera.position);
    expect(posEnd.x - posStart.x > 0).toBe(true);

    posStart.copy(camera.position);
    firstPersonControls.moveUp = true;
    firstPersonControls.update();
    firstPersonControls.moveUp = false;
    posEnd.copy(camera.position);
    expect(posEnd.y - posStart.y > 0).toBe(true);

    posStart.copy(camera.position);
    firstPersonControls.moveDown = true;
    firstPersonControls.update();
    firstPersonControls.moveDown = false;
    posEnd.copy(camera.position);
    expect(posEnd.y - posStart.y < 0).toBe(true);
  }));

  it('should rotate according to the inputs', inject(function() {
    camera.position.set(0, 0, 10);
    camera.lookAt(new THREE.Vector3(0,0,0));
    var rotStart = new THREE.Euler(), rotEnd = new THREE.Euler();

    expect(firstPersonControls.enabled).toBe(true);

    rotStart.copy(camera.rotation);
    firstPersonControls.rotateUp = true;
    firstPersonControls.update();
    firstPersonControls.rotateUp = false;
    rotEnd.copy(camera.rotation);
    expect(rotEnd.x - rotStart.x > 0).toBe(true);

    rotStart.copy(camera.rotation);
    firstPersonControls.rotateDown = true;
    firstPersonControls.update();
    firstPersonControls.rotateDown = false;
    rotEnd.copy(camera.rotation);
    expect(rotEnd.x - rotStart.x < 0).toBe(true);

    rotStart.copy(camera.rotation);
    firstPersonControls.rotateRight = true;
    firstPersonControls.update();
    firstPersonControls.rotateRight = false;
    rotEnd.copy(camera.rotation);
    expect(rotEnd.z - rotStart.z > 0).toBe(true);

    rotStart.copy(camera.rotation);
    firstPersonControls.rotateLeft = true;
    firstPersonControls.update();
    firstPersonControls.rotateLeft = false;
    rotEnd.copy(camera.rotation);
    expect(rotEnd.z - rotStart.z < 0).toBe(true);
  }));

  it('should set direction variables accordingly', inject(function() {
    firstPersonControls.rotateLeft = false;
    firstPersonControls.onMouseDownManipulator('rotateLeft');
    expect(firstPersonControls.rotateLeft).toBe(true);
    firstPersonControls.onMouseUpManipulator('rotateLeft');
    expect(firstPersonControls.rotateLeft).toBe(false);
  }));

  it('should handle mousedown events', inject(function() {
    spyOn(firstPersonControls, 'updateSphericalAngles').andCallThrough();

    camera.position.copy(new THREE.Vector3(0,0,0));
    camera.lookAt(new THREE.Vector3(1,0,0));
    camera.up = new THREE.Vector3(0,0,1);
    camera.updateMatrix();

    expect(firstPersonControls.activeLook).toBe(true);

    triggerMouseEvent(domElement, 'mousedown', 0, 10, 20);

    expect(firstPersonControls.updateSphericalAngles).toHaveBeenCalled();
    expect(firstPersonControls.azimuth).toEqual(Math.PI * 2);
    expect(firstPersonControls.zenith).toBeCloseTo(Math.PI / 2, 5);
    expect(firstPersonControls.azimuthOnMouseDown).toEqual(firstPersonControls.azimuth);
    expect(firstPersonControls.zenithOnMouseDown).toBeCloseTo(firstPersonControls.zenith, 5);
    expect(firstPersonControls.mousePosOnKeyDown.x).toEqual(10);
    expect(firstPersonControls.mousePosOnKeyDown.y).toEqual(20);
    expect(firstPersonControls.mouseDragOn).toEqual(true);
  }));

  it('should handle mouseup events', inject(function() {
    expect(firstPersonControls.activeLook).toBe(true);
    firstPersonControls.mouseDragOn = true;

    triggerMouseEvent(domElement, 'mouseup', 0, 10, 20);

    expect(firstPersonControls.mouseDragOn).toEqual(false);
  }));

  it('should handle mousemove events', inject(function() {
    expect(firstPersonControls.activeLook).toBe(true);

    triggerMouseEvent(domElement, 'mousemove', 0, 10, 20);

    expect(firstPersonControls.mousePosCurrent.x).toEqual(10);
    expect(firstPersonControls.mousePosCurrent.y).toEqual(20);
  }));

  it('should rotate according to mouse movement', inject(function() {
    camera.position.copy(new THREE.Vector3(0,0,0));
    camera.lookAt(new THREE.Vector3(1,0,0));
    camera.up = new THREE.Vector3(0,0,1);
    camera.updateMatrix();
    firstPersonControls.updateSphericalAngles();

    var startAzimuth = Math.PI;
    var startZenith = Math.PI / 2;
    expect(firstPersonControls.azimuth).toEqual(startAzimuth * 2);
    expect(firstPersonControls.zenith).toBeCloseTo(startZenith, 5);

    var mouseDeltaX = Math.PI / 2;
    var mouseDeltaY = Math.PI / 4;
    firstPersonControls.mouseDragOn = true;
    firstPersonControls.mousePosOnKeyDown = new THREE.Vector2(0,0);
    firstPersonControls.mousePosCurrent = new THREE.Vector2(mouseDeltaX, mouseDeltaY);

    firstPersonControls.update();

    var expectedAzimuth = (firstPersonControls.azimuthOnMouseDown - mouseDeltaX * firstPersonControls.lookSpeed) % (2 * Math.PI);
    expect(firstPersonControls.azimuth).toBeCloseTo(expectedAzimuth, 5);
    var expectedZenith = firstPersonControls.zenithOnMouseDown + mouseDeltaY * firstPersonControls.lookSpeed;
    expect(firstPersonControls.zenith).toBeCloseTo(expectedZenith, 5);
  }));

  it('should ignore everything when disabled or frozen', inject(function() {
    camera.position.set(0, -1, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));
    firstPersonControls.mouseDragOn = true;
    firstPersonControls.mousePosOnKeyDown = new THREE.Vector2(0,0);
    firstPersonControls.mousePosCurrent = new THREE.Vector2(Math.PI / 2, Math.PI / 4);
    firstPersonControls.moveForward = true;
    firstPersonControls.moveLeft = true;
    firstPersonControls.moveUp = true;

    var cameraPos = new THREE.Vector3().copy(camera.position);
    var cameraQuat = new THREE.Quaternion().copy(camera.quaternion);

    /* disable */
    firstPersonControls.enabled = false;
    firstPersonControls.update();

    expect(camera.position.x).toEqual(cameraPos.x);
    expect(camera.position.y).toEqual(cameraPos.y);
    expect(camera.position.z).toEqual(cameraPos.z);
    expect(camera.quaternion.x).toEqual(cameraQuat.x);
    expect(camera.quaternion.y).toEqual(cameraQuat.y);
    expect(camera.quaternion.z).toEqual(cameraQuat.z);
    expect(camera.quaternion.w).toEqual(cameraQuat.w);

    /* freeze */
    firstPersonControls.enabled = true;
    firstPersonControls.freeze = true;
    firstPersonControls.update();

    expect(camera.position.x).toEqual(cameraPos.x);
    expect(camera.position.y).toEqual(cameraPos.y);
    expect(camera.position.z).toEqual(cameraPos.z);
    expect(camera.quaternion.x).toEqual(cameraQuat.x);
    expect(camera.quaternion.y).toEqual(cameraQuat.y);
    expect(camera.quaternion.z).toEqual(cameraQuat.z);
    expect(camera.quaternion.w).toEqual(cameraQuat.w);
  }));
});
