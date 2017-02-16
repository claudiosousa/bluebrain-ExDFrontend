'use strict';

/* global THREE: true */

function createKeyEvent(eventType, code) {
  var event = document.createEvent('Event');
  event.code = code;
  event.shiftKey = false;
  event.initEvent(eventType, true, true);
  return event;
}

function createKeyEventWithShift(eventType, code) {
  var event = createKeyEvent(eventType, code);
  event.shiftKey = true;
  return event;
}

function createMouseEvent(eventType, button, pageX, pageY) {
  var event = document.createEvent('Event');
  event.button = button;
  // -1 means: no button was pressed
  if (button === -1) {
    event.button = 0;
    event.buttons = 0;
  }
  event.pageX = pageX;
  event.pageY = pageY;
  event.initEvent(eventType, true, true);

  return event;
}

function createZeroTouchEvent(targetElement, eventType) {
  var event = document.createEvent('Event');
  event.initEvent(eventType, true, true);
  event.touches = [];
  return event;
}

function createOneTouchEvent(targetElement, eventType, pageX, pageY) {
  var event = document.createEvent('Event');
  event.initEvent(eventType, true, true);
  event.touches = [{pageX: pageX, pageY: pageY}];
  return event;
}

function createTwoTouchEvent(targetElement, eventType, pageX1, pageY1, pageX2, pageY2) {
  var event = document.createEvent('Event');
  event.initEvent(eventType, true, true);
  event.touches = [{pageX: pageX1, pageY: pageY1}, {pageX: pageX2, pageY: pageY2}];
  return event;
}

function triggerKeyEvent(targetElement, eventType, code) {
  var event = createKeyEvent(eventType, code);
  targetElement.dispatchEvent(event);
}

function triggerKeyEventWithShift(targetElement, eventType, key) {
  var event = createKeyEventWithShift(eventType, key);
  targetElement.dispatchEvent(event);
}

function triggerMouseEvent(targetElement, eventType, button, x, y) {
  var event = createMouseEvent(eventType, button, x, y);
  targetElement.dispatchEvent(event);
}

function triggerZeroTouchEvent(targetElement, eventType) {
  var event = createZeroTouchEvent(targetElement, eventType);
  targetElement.dispatchEvent(event);
}

function triggerOneTouchEvent(targetElement, eventType, x, y) {
  var event = createOneTouchEvent(targetElement, eventType, x, y);
  targetElement.dispatchEvent(event);
}

function triggerTwoTouchEvent(targetElement, eventType, x1, y1, x2, y2) {
  var event = createTwoTouchEvent(targetElement, eventType, x1, y1, x2, y2);
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
    spyOn(domElement, 'addEventListener').and.callThrough();
    spyOn(domElement, 'setAttribute').and.callThrough();
    spyOn(domElementForKeyBindings, 'addEventListener').and.callThrough();

    firstPersonControls = new THREE.FirstPersonControls(camera, domElement, domElementForKeyBindings);
    spyOn(firstPersonControls, 'onKeyDown').and.callThrough();
    spyOn(firstPersonControls, 'onKeyUp').and.callThrough();
    spyOn(firstPersonControls, 'onMouseDown').and.callThrough();
    spyOn(firstPersonControls, 'onMouseUp').and.callThrough();
    spyOn(firstPersonControls, 'onMouseMove').and.callThrough();
    spyOn(firstPersonControls, 'onTouchStart').and.callThrough();
    spyOn(firstPersonControls, 'onTouchMove').and.callThrough();
    spyOn(firstPersonControls, 'onTouchEnd').and.callThrough();
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
    expect(domElement.addEventListener.calls.argsFor(0)[0]).toMatch(/contextmenu/);
    expect(domElement.addEventListener.calls.argsFor(1)[0]).toMatch(/mousemove/);
    expect(domElement.addEventListener.calls.argsFor(2)[0]).toMatch(/mousedown/);
    expect(domElement.addEventListener.calls.argsFor(3)[0]).toMatch(/mouseup/);
    expect(domElement.addEventListener.calls.argsFor(4)[0]).toMatch(/touchstart/);
    expect(domElement.addEventListener.calls.argsFor(5)[0]).toMatch(/touchmove/);
    expect(domElement.addEventListener.calls.argsFor(6)[0]).toMatch(/touchend/);
    expect(domElementForKeyBindings.addEventListener.calls.argsFor(0)[0]).toMatch(/keydown/);
    expect(domElementForKeyBindings.addEventListener.calls.argsFor(1)[0]).toMatch(/keyup/);
  }));

  it('s for W/A/S/D/R/F/Q', inject(function() {
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'KeyW');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'KeyA');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'KeyS');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'KeyD');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'KeyR');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'KeyF');

    //expect(firstPersonControls.onKeyDown.calls.count()).toEqual(7);
    expect(firstPersonControls.moveForward).toBe(true);
    expect(firstPersonControls.moveLeft).toBe(true);
    expect(firstPersonControls.moveBackward).toBe(true);
    expect(firstPersonControls.moveRight).toBe(true);
    expect(firstPersonControls.moveUp).toBe(true);
    expect(firstPersonControls.moveDown).toBe(true);

    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'KeyW');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'KeyA');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'KeyS');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'KeyD');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'KeyR');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'KeyF');

    expect(firstPersonControls.moveForward).toBe(false);
    expect(firstPersonControls.moveLeft).toBe(false);
    expect(firstPersonControls.moveBackward).toBe(false);
    expect(firstPersonControls.moveRight).toBe(false);
    expect(firstPersonControls.moveUp).toBe(false);
    expect(firstPersonControls.moveDown).toBe(false);

    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'KeyQ');
    expect(firstPersonControls.freeze).toBe(true);
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'KeyQ');
    expect(firstPersonControls.freeze).toBe(false);
  }));

  it('should handle key events for up/left/down/right/pageup/pagedown', inject(function() {
    //spyOn(firstPersonControls, 'onKeyDown').and.callThrough();

    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'ArrowUp');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'ArrowLeft');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'ArrowDown');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'ArrowRight');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'PageUp');
    triggerKeyEvent(domElementForKeyBindings, 'keydown', 'PageDown');
    expect(firstPersonControls.shiftHold).toEqual(false);
    expect(firstPersonControls.rotateUp).toEqual(true);
    expect(firstPersonControls.rotateLeft).toEqual(true);
    expect(firstPersonControls.rotateDown).toEqual(true);
    expect(firstPersonControls.rotateRight).toEqual(true);
    expect(firstPersonControls.moveUp).toEqual(true);
    expect(firstPersonControls.moveDown).toEqual(true);

    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'ArrowUp');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'ArrowLeft');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'ArrowDown');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'ArrowRight');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'PageUp');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'PageDown');

    expect(firstPersonControls.rotateUp).toEqual(false);
    expect(firstPersonControls.rotateLeft).toEqual(false);
    expect(firstPersonControls.rotateDown).toEqual(false);
    expect(firstPersonControls.rotateRight).toEqual(false);
    expect(firstPersonControls.moveUp).toEqual(false);
    expect(firstPersonControls.moveDown).toEqual(false);
  }));

  it('should handle key events for up/left/down/right/pageup/pagedown with Shift modifier', inject(function() {
    //spyOn(firstPersonControls, 'onKeyDown').and.callThrough();

    triggerKeyEventWithShift(domElementForKeyBindings, 'keydown', 'ArrowUp');
    triggerKeyEventWithShift(domElementForKeyBindings, 'keydown', 'ArrowLeft');
    triggerKeyEventWithShift(domElementForKeyBindings, 'keydown', 'ArrowDown');
    triggerKeyEventWithShift(domElementForKeyBindings, 'keydown', 'ArrowRight');
    triggerKeyEventWithShift(domElementForKeyBindings, 'keydown', 'PageUp');
    triggerKeyEventWithShift(domElementForKeyBindings, 'keydown', 'PageDown');

    expect(firstPersonControls.shiftHold).toEqual(true);
    expect(firstPersonControls.rotateUp).toEqual(true);
    expect(firstPersonControls.rotateLeft).toEqual(true);
    expect(firstPersonControls.rotateDown).toEqual(true);
    expect(firstPersonControls.rotateRight).toEqual(true);
    expect(firstPersonControls.moveUp).toEqual(true);
    expect(firstPersonControls.moveDown).toEqual(true);

    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'ArrowUp');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'ArrowLeft');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'ArrowDown');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'ArrowRight');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'PageUp');
    triggerKeyEvent(domElementForKeyBindings, 'keyup', 'PageDown');

    expect(firstPersonControls.shiftHold).toEqual(false);
    expect(firstPersonControls.rotateUp).toEqual(false);
    expect(firstPersonControls.rotateLeft).toEqual(false);
    expect(firstPersonControls.rotateDown).toEqual(false);
    expect(firstPersonControls.rotateRight).toEqual(false);
    expect(firstPersonControls.moveUp).toEqual(false);
    expect(firstPersonControls.moveDown).toEqual(false);
  }));

  it('should navigate faster with Shift modifier and according key pressed', inject(function() {
    camera.position.set(0, 0, 10);
    camera.lookAt(new THREE.Vector3(0,0,0));
    var posStart = new THREE.Vector3();

    expect(firstPersonControls.enabled).toBe(true);

    posStart.copy(camera.position);
    firstPersonControls.moveForward = true;
    firstPersonControls.update();
    firstPersonControls.moveForward = false;
    var posDiffNoShift = Math.abs(camera.position.z - posStart.z);

    posStart.copy(camera.position);
    firstPersonControls.moveForward = true;
    firstPersonControls.shiftHold = true;
    firstPersonControls.update();
    firstPersonControls.moveForward = false;
    firstPersonControls.shiftHold = false;
    var posDiffWithShift = Math.abs(camera.position.z - posStart.z);

    expect(posDiffWithShift / posDiffNoShift).toBeCloseTo(firstPersonControls.speedUpFactor);
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
    expect(rotEnd.z - rotStart.z < 0).toBe(true);

    rotStart.copy(camera.rotation);
    firstPersonControls.rotateLeft = true;
    firstPersonControls.update();
    firstPersonControls.rotateLeft = false;
    rotEnd.copy(camera.rotation);
    expect(rotEnd.z - rotStart.z > 0).toBe(true);
  }));

  it('should set direction variables accordingly', inject(function() {
    firstPersonControls.rotateLeft = false;
    firstPersonControls.onMouseDownManipulator('rotateLeft');
    expect(firstPersonControls.rotateLeft).toBe(true);
    firstPersonControls.onMouseUpManipulator('rotateLeft');
    expect(firstPersonControls.rotateLeft).toBe(false);
  }));

  it('should handle mousedown events', inject(function() {
    spyOn(firstPersonControls, 'updateSphericalAngles').and.callThrough();

    camera.position.copy(new THREE.Vector3(0,0,0));
    camera.lookAt(new THREE.Vector3(1,0,0));
    camera.up = new THREE.Vector3(0,0,1);
    camera.updateMatrix();

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
    firstPersonControls.mouseDragOn = true;

    triggerMouseEvent(domElement, 'mouseup', 0, 10, 20);

    expect(firstPersonControls.mouseDragOn).toEqual(false);
  }));

  it('should handle mousemove events', inject(function() {
    triggerMouseEvent(domElement, 'mousemove', 0, 10, 20);

    expect(firstPersonControls.mousePosCurrent.x).toEqual(10);
    expect(firstPersonControls.mousePosCurrent.y).toEqual(20);
  }));

  it('should handle mousemove events when no button was pressed', inject(function() {
    firstPersonControls.mousePosCurrent.x = 0;
    firstPersonControls.mousePosCurrent.y = 0;

    triggerMouseEvent(domElement, 'mousemove', -1, 10, 20);

    expect(firstPersonControls.mousePosCurrent.x).toEqual(0);
    expect(firstPersonControls.mousePosCurrent.y).toEqual(0);
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

  //#######################
  // Touch with one finger
  //#######################
  it('should handle touchstart events', inject(function() {
    spyOn(firstPersonControls, 'updateSphericalAngles').and.callThrough();

    camera.position.copy(new THREE.Vector3(0,0,0));
    camera.lookAt(new THREE.Vector3(1,0,0));
    camera.up = new THREE.Vector3(0,0,1);
    camera.updateMatrix();

    triggerOneTouchEvent(domElement, 'touchstart', 10, 20);

    expect(firstPersonControls.updateSphericalAngles).toHaveBeenCalled();
    expect(firstPersonControls.azimuth).toEqual(Math.PI * 2);
    expect(firstPersonControls.zenith).toBeCloseTo(Math.PI / 2, 5);
    expect(firstPersonControls.azimuthOnMouseDown).toEqual(firstPersonControls.azimuth);
    expect(firstPersonControls.zenithOnMouseDown).toBeCloseTo(firstPersonControls.zenith, 5);
    expect(firstPersonControls.mousePosOnKeyDown.x).toEqual(10);
    expect(firstPersonControls.mousePosOnKeyDown.y).toEqual(20);
    expect(firstPersonControls.mouseDragOn).toEqual(true);
  }));

  it('should handle touchend events', inject(function() {
    firstPersonControls.mouseDragOn = true;

    triggerZeroTouchEvent(domElement, 'touchend');

    expect(firstPersonControls.mouseDragOn).toEqual(false);
  }));

  it('should handle touchmove events', inject(function() {
    triggerOneTouchEvent(domElement, 'touchmove', 20, 30);

    expect(firstPersonControls.mousePosCurrent.x).toEqual(20);
    expect(firstPersonControls.mousePosCurrent.y).toEqual(30);
  }));

  it('should rotate according to touch movement', inject(function() {
    camera.position.copy(new THREE.Vector3(0,0,0));
    camera.lookAt(new THREE.Vector3(1,0,0));
    camera.up = new THREE.Vector3(0,0,1);
    camera.updateMatrix();

    triggerOneTouchEvent(domElement, 'touchstart', 0, 0);

    var mouseDeltaX = Math.PI / 2;
    var mouseDeltaY = Math.PI / 4;

    triggerOneTouchEvent(domElement, 'touchmove', mouseDeltaX, mouseDeltaY);

    firstPersonControls.update();

    var expectedAzimuth = (Math.PI * 2 - mouseDeltaX * firstPersonControls.lookSpeed) % (2 * Math.PI);
    expect(firstPersonControls.azimuth).toBeCloseTo(expectedAzimuth, 5);
    var expectedZenith = Math.PI / 2 + mouseDeltaY * firstPersonControls.lookSpeed;
    expect(firstPersonControls.zenith).toBeCloseTo(expectedZenith, 5);
  }));

  //#######################
  // Touch with two fingers
  //#######################
  it('should handle touchstart events 2 touches', inject(function() {
    spyOn(firstPersonControls, 'updateSphericalAngles').and.callThrough();

    camera.position.copy(new THREE.Vector3(0,0,0));
    camera.lookAt(new THREE.Vector3(1,0,0));
    camera.up = new THREE.Vector3(0,0,1);
    camera.updateMatrix();

    firstPersonControls.mouseDragOn = true;

    triggerTwoTouchEvent(domElement, 'touchstart', 10, 20, 20, 30);

    expect(firstPersonControls.mouseDragOn).toEqual(false);
    expect(firstPersonControls.startTouchDistance).toBeCloseTo(Math.sqrt(10 * 10 + 10 * 10), 5);
    expect(firstPersonControls.startTouchMid).toEqual(new THREE.Vector2(15, 25));
    expect(firstPersonControls.startCameraPosition).toEqual(new THREE.Vector3(0,0,0));
  }));

  it('should handle touchend events 2 touches', inject(function() {
    firstPersonControls.mouseDragOn = true;

    triggerOneTouchEvent(domElement, 'touchend');

    expect(firstPersonControls.startTouchDistance).toEqual(new THREE.Vector2());
    expect(firstPersonControls.startTouchMid).toEqual(new THREE.Vector2());
    expect(firstPersonControls.startCameraPosition).toEqual(new THREE.Vector3());
  }));

  it('should handle move forward/backward touch gesture', inject(function() {
    camera.position.copy(new THREE.Vector3(0,0,0));
    camera.lookAt(new THREE.Vector3(1,0,0));
    camera.up = new THREE.Vector3(0,0,1);
    camera.updateMatrix();
    firstPersonControls.cameraLookDirection = new THREE.Vector3(1,0,0);

    triggerTwoTouchEvent(domElement, 'touchstart', 100, 100, 100, 110);
    // Move both touches 50 pixels to each side
    triggerTwoTouchEvent(domElement, 'touchmove', 100, 50, 100, 160);

    expect(firstPersonControls.mouseDragOn).toEqual(false);
    expect(camera.position).toEqual(new THREE.Vector3((100-10) * firstPersonControls.touchSensitivity, 0, 0));
  }));

  it('should handle move sidewards/upwards touch gesture', inject(function() {
    camera.position.copy(new THREE.Vector3(0,0,0));
    camera.lookAt(new THREE.Vector3(1,0,0));
    camera.up = new THREE.Vector3(0,0,1);
    camera.updateMatrix();
    firstPersonControls.cameraLookDirection = new THREE.Vector3(1,0,0);

    triggerTwoTouchEvent(domElement, 'touchstart', 100, 100, 100, 110);
    // Move both touches 50 pixels = 0.5m to one side
    triggerTwoTouchEvent(domElement, 'touchmove', 100, 150, 100, 160);

    expect(firstPersonControls.mouseDragOn).toEqual(false);
    expect(camera.position).toEqual(new THREE.Vector3(0, -50 * firstPersonControls.touchSensitivity, 0));
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
