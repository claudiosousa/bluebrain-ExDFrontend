/**
 * First person controls for the gz3d camera/scene.
 * Adapted from https://threejsdoc.appspot.com/doc/three.js/src.source/extras/controls/FirstPersonControls.js.html.
 *
 * Note that there is a third parameter now, called 'domElementForKeyBindings' which specifies to which element in
 * the DOM the key strokes are bound. (Before they were automatically bound to the parameter 'domElement').
 */

/* global THREE: true */
/* global console: false */

THREE.FirstPersonControls = function(object, domElement, domElementForKeyBindings)
{
  'use strict';

  this.object = object;
  this.domElement = angular.isDefined(domElement) ? domElement : document;
  domElementForKeyBindings = angular.isDefined(domElementForKeyBindings) ? domElementForKeyBindings : document;

  if (this.domElement !== document) {
    this.domElement.setAttribute('tabindex', -1);
  }

  // Set to false to disable this control
  this.enabled = true;
  this.keyBindingsEnabled = true;

  this.movementSpeed = 0.05;
  this.lookSpeed = 0.01;
  this.touchSensitivity = 0.01;
  this.mouseWheelSensitivity = 0.25;

  this.target = new THREE.Vector3();
  this.lookVertical = true;

  this.activeLook = true;

  this.azimuth = 0.0;
  this.zenith = 0.0;
  this.zenithMin = 0.0;
  this.zenithMax = Math.PI;
  this.azimuthOnMouseDown = 0.0;
  this.zenithOnMouseDown = 0.0;
  this.speedUpFactor = 3.0;

  this.shiftHold = false;
  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.moveUp = false;
  this.moveDown = false;
  this.initPosition = false;

  this.rotateLeft = false;
  this.rotateRight = false;
  this.rotateUp = false;
  this.rotateDown = false;
  this.initRotation = false;

  this.freeze = false;

  this.mouseDragOn = false;
  this.mousePosOnKeyDown = new THREE.Vector2();
  this.mousePosCurrent = new THREE.Vector2();

  this.startTouchDistance = new THREE.Vector2();
  this.startTouchMid = new THREE.Vector2();
  this.startCameraPosition = new THREE.Vector3();
  this.cameraLookDirection = new THREE.Vector3();

  this.initialPosition = this.object.position.clone();
  this.initialRotation = this.object.quaternion.clone();

  this.onMouseDown = function (event) {
    // HBP-NRP: The next three lines are commented since this leads to problems in chrome with respect
    // to AngularJS, also see: [NRRPLT-1992]
    //if (this.domElement !== document) {
    //  this.domElement.focus();
    //}

    event.preventDefault();
    event.stopPropagation();

    if (this.activeLook) {
      switch (event.button) {
        case 0:
          this.updateSphericalAngles();
          this.mousePosOnKeyDown.set(event.pageX, event.pageY);
          this.mousePosCurrent.copy(this.mousePosOnKeyDown);
          this.azimuthOnMouseDown = this.azimuth;
          this.zenithOnMouseDown = this.zenith;
          this.mouseDragOn = true;
          break;
      }
    }
  };

  this.onMouseUp = function (event) {
    event.preventDefault();

    // We do not stop the event propagation here, since there may be other
    // components sitting on top, which also may have registered a handler
    // and expect the event to be fired.
    //event.stopPropagation();

    if (this.activeLook) {
      switch (event.button) {
        case 0:
          this.mouseDragOn = false;
          this.azimuthOnMouseDown = this.azimuth;
          this.zenithOnMouseDown = this.zenith;
          break;
      }
    }
  };

  this.onMouseMove = function (event) {
    // only update the position, when a mouse button is pressed
    // else end the lookAround-mode
    if (event.buttons !== 0) {
      this.mousePosCurrent.set(event.pageX, event.pageY);
    } else {
      this.endLookAround();
    }
  };

  this.onMouseWheel = function (event) {
    var delta = Math.max(-1, Math.min(1, (-event.wheelDelta || event.detail)));
    this.object.translateZ(delta * this.mouseWheelSensitivity);
  };

  this.onTouchStart = function (event) {
    switch (event.touches.length) {
      case 1:
        // look around
        this.updateSphericalAngles();
        this.mousePosOnKeyDown.set(event.touches[0].pageX, event.touches[0].pageY);
        this.mousePosCurrent.copy(this.mousePosOnKeyDown);
        this.azimuthOnMouseDown = this.azimuth;
        this.zenithOnMouseDown = this.zenith;
        this.mouseDragOn = true;
        break;
      case 2:
        this.endLookAround();

        var touch1 = new THREE.Vector2(event.touches[0].pageX, event.touches[0].pageY);
        var touch2 = new THREE.Vector2(event.touches[1].pageX, event.touches[1].pageY);

        // Compute distance of both touches when they start touching the display
        this.startTouchDistance = touch1.distanceTo(touch2);

        // Compute the mid of both touches
        this.startTouchMid.addVectors(touch1, touch2).divideScalar(2.0);

        this.startCameraPosition.copy(this.object.position);
        break;
    }
  };

  this.onTouchMove = function (event) {
    event.preventDefault();
    switch (event.touches.length) {
      case 1:
        // look around
        this.mousePosCurrent.set(event.touches[0].pageX, event.touches[0].pageY);
        break;
      case 2:
        this.endLookAround();

        // Compute distance of both touches
        var touch1 = new THREE.Vector2(event.touches[0].pageX, event.touches[0].pageY);
        var touch2 = new THREE.Vector2(event.touches[1].pageX, event.touches[1].pageY);
        var distance = touch1.distanceTo(touch2);

        // How much did the touches moved compared to the initial touch distances
        var delta = distance - this.startTouchDistance;
        var forwardDirection = new THREE.Vector3();
        var straveDirection = new THREE.Vector3();

        // Only do something when the change is above a threshold. This prevents unwanted movements
        if (Math.abs(delta) >= 10) {
          forwardDirection = this.cameraLookDirection.clone().setLength((delta-10) * this.touchSensitivity);
        }

        // Compute the mid of both touches
        var touchMid = new THREE.Vector2().addVectors(touch1, touch2).divideScalar(2.0);
        var touchMidDistance = touchMid.distanceTo(this.startTouchMid);

        // Only strave when the change is above a threshold. This prevents unwanted movements
        if (Math.abs(touchMidDistance) >= 10) {
          var touchMidDelta = new THREE.Vector2().subVectors(touchMid, this.startTouchMid).multiplyScalar(this.touchSensitivity);
          straveDirection.set(touchMidDelta.x, -touchMidDelta.y, 0.0).applyQuaternion(this.object.quaternion);
        }

        this.object.position.addVectors(this.startCameraPosition, forwardDirection).add(straveDirection);

        break;
    }
  };

  this.onTouchEnd = function (event) {
    switch (event.touches.length) {
      case 0:
        // look around
        this.endLookAround();
        break;
      case 1:
        // Reset the start distance
        this.startTouchDistance = new THREE.Vector2();
        this.startCameraPosition = new THREE.Vector3();
        this.startTouchMid = new THREE.Vector2();
        break;
    }
  };

  this.endLookAround = function() {
    this.mouseDragOn = false;
    this.azimuthOnMouseDown = this.azimuth;
    this.zenithOnMouseDown = this.zenith;
  };

  this.onKeyDown = function (event) {
    if(this.keyBindingsEnabled === false) {
      return;
    }
    this.shiftHold = event.shiftKey;
    switch(event.keyCode) {
      case 38: /*up*/
      case 87: /*W*/ this.moveForward = true; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = true; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = true; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = true; break;

      case 33: /*page up*/
      case 82: /*R*/ this.moveUp = true; break;

      case 34: /*page down*/
      case 70: /*F*/ this.moveDown = true; break;
    }
  };

  this.onKeyUp = function (event) {
    if(this.keyBindingsEnabled === false) {
      return;
    }
    this.shiftHold = event.shiftKey;
    switch(event.keyCode) {
      case 38: /*up*/
      case 87: /*W*/ this.moveForward = false; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = false; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = false; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = false; break;

      case 33: /*page up*/
      case 82: /*R*/ this.moveUp = false; break;

      case 34: /*page down*/
      case 70: /*F*/ this.moveDown = false; break;

      case 81: /*Q*/ this.freeze = !this.freeze; break;// TODO(Luc): handles this from gz3d-view.js with some visual indication that the scene is frozen
    }
  };

  this.fpRotate = function(rightAmount, upAmount) {
    // rotate left/right
    // rotation happens around the world up axis so up remains up (no upside-down)
    var camera = this.object;
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(0.0, 0.0, 1.0), rightAmount);
    camera.quaternion.multiplyQuaternions(q, camera.quaternion);
    // rotate up/down
    camera.rotateX(upAmount);
  };

  this.update = function(delta) {
    if (!this.enabled) {
      return;
    }

    if (delta === undefined) {
      delta = 1.0;
    }

    var speed = 0.0;

    if (!this.freeze) {
      /* --- translation --- */
      if (this.initPosition) {
        this.object.position.copy(this.initialPosition);
      }

      speed = delta * this.movementSpeed;
      if (this.shiftHold) {
        speed = speed * this.speedUpFactor;
      }

      if (this.moveForward) {
        this.object.translateZ(-speed);
      }
      if (this.moveBackward) {
        this.object.translateZ(speed);
      }
      if (this.moveLeft) {
        this.object.translateX(-speed);
      }
      if (this.moveRight) {
        this.object.translateX(speed);
      }
      if (this.moveUp) {
        this.object.translateY(speed);
      }
      if (this.moveDown) {
        this.object.translateY(-speed);
      }

      /* --- rotation by means of a manipulator --- */
      var ROTATION_SPEED_FACTOR = 0.1;
      if (this.rotateUp || this.rotateDown) {
        var sign = this.rotateUp ? 1.0 : -1.0;
        this.fpRotate(0.0, sign * ROTATION_SPEED_FACTOR * speed);
      }
      if (this.rotateRight) {
        this.fpRotate(ROTATION_SPEED_FACTOR * speed, 0.0);
      }
      if (this.rotateLeft) {
        this.fpRotate(-ROTATION_SPEED_FACTOR * speed, 0.0);
      }
      if (this.initRotation) {
        this.object.quaternion.copy(this.initialRotation);
      }

      /* --- rotation by means of a mouse drag --- */
      if (this.mouseDragOn) {
        var actualLookSpeed = delta * this.lookSpeed;
        if (!this.activeLook) {
          actualLookSpeed = 0;
        }

        var mouseDelta = new THREE.Vector2();
        mouseDelta.x = this.mousePosCurrent.x - this.mousePosOnKeyDown.x;
        mouseDelta.y = this.mousePosCurrent.y - this.mousePosOnKeyDown.y;

        this.azimuth = this.azimuthOnMouseDown - mouseDelta.x * actualLookSpeed;
        this.azimuth = this.azimuth % (2 * Math.PI);

        if (this.lookVertical) {
          this.zenith = this.zenithOnMouseDown + mouseDelta.y * actualLookSpeed;
          this.zenith = Math.max(this.zenithMin, Math.min(this.zenithMax, this.zenith));
        } else {
          this.zenith = Math.PI / 2;
        }

        var targetPosition = this.target, position = this.object.position;

        targetPosition.x = position.x + Math.sin(this.zenith) * Math.cos(this.azimuth);
        targetPosition.y = position.y + Math.sin(this.zenith) * Math.sin(this.azimuth);
        targetPosition.z = position.z + Math.cos(this.zenith);

        this.object.lookAt(targetPosition);
        this.cameraLookDirection = new THREE.Vector3().subVectors(targetPosition, this.object.position);
      }

      this.object.updateMatrixWorld();  // I need to add this to get the camera working with the new ThreeJS version
    }
  };

  this.onMouseDownManipulator = function(action) {
    this[action] = true;
  };

  this.onMouseUpManipulator = function(action) {
    this[action] = false;
  };

  this.updateSphericalAngles = function() {
    var vecForward = new THREE.Vector3();
    vecForward.set(this.object.matrix.elements[8], this.object.matrix.elements[9], this.object.matrix.elements[10]);
    vecForward.normalize();

    this.zenith = Math.acos(-vecForward.z);
    this.azimuth = Math.atan2(vecForward.y, vecForward.x)  + Math.PI ;
  };

  function bind(scope, fn) {
    return function () {
      fn.apply(scope, arguments);
    };
  }

  this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
  this.domElement.addEventListener('mousemove', bind(this, this.onMouseMove), false);
  this.domElement.addEventListener('mousedown', bind(this, this.onMouseDown), false);
  this.domElement.addEventListener('mouseup', bind(this, this.onMouseUp), false);
  this.domElement.addEventListener('touchstart', bind(this, this.onTouchStart), false);
  this.domElement.addEventListener('touchmove', bind(this, this.onTouchMove), false);
  this.domElement.addEventListener('touchend', bind(this, this.onTouchEnd), false);
  this.domElement.addEventListener('mousewheel', bind(this, this.onMouseWheel), false);
  this.domElement.addEventListener('DOMMouseScroll', bind(this, this.onMouseWheel), false);

  domElementForKeyBindings.addEventListener('keydown', bind(this, this.onKeyDown), false);
  domElementForKeyBindings.addEventListener('keyup', bind(this, this.onKeyUp), false);

};

THREE.FirstPersonControls.prototype = Object.create(THREE.EventDispatcher.prototype);
