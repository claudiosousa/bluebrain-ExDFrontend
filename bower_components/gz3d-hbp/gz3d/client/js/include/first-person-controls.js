/**
 * First person controls for the gz3d camera/scene.
 * Adapted from https://threejsdoc.appspot.com/doc/three.js/src.source/extras/controls/FirstPersonControls.js.html.
 *
 * Note that there is a third parameter now, called 'domElementForKeyBindings' which specifies to which element in
 * the DOM the key strokes are bound. (Before they were automatically bound to the parameter 'domElement').
 */

/* global THREE: true */
/* global console: false */

THREE.FirstPersonControls = function(userView)
{
  'use strict';

  var that = this;

  this.userView = userView;

  // Set to false to disable this control
  this.enabled = true;
  this.keyBindingsEnabled = true;

  this.movementSpeed = 0.002;
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
  this.speedDownFactor = 0.1;

  this.shiftHold = false;
  this.altHold = false;
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

  this.mouseRotate = false;
  this.mousePosOnKeyDown = new THREE.Vector2();
  this.mousePosCurrent = new THREE.Vector2();
  this.touchRotate = false;
  this.touchPosOnStart = new THREE.Vector2();
  this.touchPosCurrent = new THREE.Vector2();

  this.startTouchDistance = new THREE.Vector2();
  this.startTouchMid = new THREE.Vector2();
  this.startCameraPosition = new THREE.Vector3();
  this.cameraLookDirection = new THREE.Vector3();

  this.initialPosition = this.userView.camera.position.clone();
  this.initialRotation = this.userView.camera.quaternion.clone();

  this.onMouseDown = function (event) {
    // HBP-NRP: The next three lines are commented since this leads to problems in chrome with respect
    // to AngularJS, also see: [NRRPLT-1992]
    //if (this.domElement !== document) {
    //  this.domElement.focus();
    //}

    event.preventDefault();
    event.stopPropagation();

    if (that.activeLook) {
      switch (event.button) {
        case 0:
          that.updateSphericalAngles();
          that.mousePosOnKeyDown.set(event.pageX, event.pageY);
          that.mousePosCurrent.copy(that.mousePosOnKeyDown);
          that.azimuthOnMouseDown = that.azimuth;
          that.zenithOnMouseDown = that.zenith;
          that.mouseRotate = true;
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

    if (that.activeLook) {
      switch (event.button) {
        case 0:
          that.mouseRotate = false;
          that.azimuthOnMouseDown = that.azimuth;
          that.zenithOnMouseDown = that.zenith;
          break;
      }
    }
  };

  this.onMouseMove = function (event) {
    // only update the position, when a mouse button is pressed
    // else end the lookAround-mode
    if (event.buttons !== 0) {
      that.mousePosCurrent.set(event.pageX, event.pageY);
    } else {
      that.endLookAround();
    }
  };

  this.onMouseWheel = function (event) {
    var delta = Math.max(-1, Math.min(1, (-event.wheelDelta || event.detail)));
    window.firstPersonControls.userView.camera.translateZ(delta * window.firstPersonControls.mouseWheelSensitivity);
  };

  this.onTouchStart = function (event) {
    switch (event.touches.length) {
      case 1:
        // look around
        that.updateSphericalAngles();
        that.touchPosOnStart.set(event.touches[0].pageX, event.touches[0].pageY);
        that.touchPosCurrent.copy(that.touchPosOnStart);
        that.azimuthOnMouseDown = that.azimuth;
        that.zenithOnMouseDown = that.zenith;
        that.touchRotate = true;
        break;
      case 2:
        that.endLookAround();

        var touch1 = new THREE.Vector2(event.touches[0].pageX, event.touches[0].pageY);
        var touch2 = new THREE.Vector2(event.touches[1].pageX, event.touches[1].pageY);

        // Compute distance of both touches when they start touching the display
        that.startTouchDistance = touch1.distanceTo(touch2);

        // Compute the mid of both touches
        that.startTouchMid.addVectors(touch1, touch2).divideScalar(2.0);

        that.startCameraPosition.copy(that.userView.camera.position);
        break;
    }
  };

  this.onTouchMove = function (event) {
    event.preventDefault();
    switch (event.touches.length) {
      case 1:
        // look around
        that.touchPosCurrent.set(event.touches[0].pageX, event.touches[0].pageY);
        break;
      case 2:
        that.endLookAround();

        // Compute distance of both touches
        var touch1 = new THREE.Vector2(event.touches[0].pageX, event.touches[0].pageY);
        var touch2 = new THREE.Vector2(event.touches[1].pageX, event.touches[1].pageY);
        var distance = touch1.distanceTo(touch2);

        // How much did the touches moved compared to the initial touch distances
        var delta = distance - that.startTouchDistance;
        var forwardDirection = new THREE.Vector3();
        var straveDirection = new THREE.Vector3();

        // Only do something when the change is above a threshold. This prevents unwanted movements
        if (Math.abs(delta) >= 10) {
          forwardDirection = that.cameraLookDirection.clone().setLength((delta-10) * that.touchSensitivity);
        }

        // Compute the mid of both touches
        var touchMid = new THREE.Vector2().addVectors(touch1, touch2).divideScalar(2.0);
        var touchMidDistance = touchMid.distanceTo(that.startTouchMid);

        // Only strave when the change is above a threshold. This prevents unwanted movements
        if (Math.abs(touchMidDistance) >= 10) {
          var touchMidDelta = new THREE.Vector2().subVectors(touchMid, that.startTouchMid).multiplyScalar(that.touchSensitivity);
          straveDirection.set(-touchMidDelta.x, touchMidDelta.y, 0.0).applyQuaternion(that.userView.camera.quaternion);
        }

        that.userView.camera.position.addVectors(that.startCameraPosition, forwardDirection).add(straveDirection);

        break;
    }
  };

  this.onTouchEnd = function (event) {
    switch (event.touches.length) {
      case 0:
        // look around
        that.endLookAround();
        break;
      case 1:
        // Reset the start distance
        that.startTouchDistance = new THREE.Vector2();
        that.startCameraPosition = new THREE.Vector3();
        that.startTouchMid = new THREE.Vector2();
        break;
    }
  };

  this.endLookAround = function() {
    this.mouseRotate = false;
    this.touchRotate = false;
    this.azimuthOnMouseDown = this.azimuth;
    this.zenithOnMouseDown = this.zenith;
  };

  this.onKeyDown = function (event) {
    if(that.keyBindingsEnabled === false || event.metaKey || event.ctrlKey) {
      return;
    }
    that.shiftHold = event.shiftKey;
    that.altHold = event.altKey;
    switch(event.code) {

      case "KeyW":
        that.moveForward = true; break;

      case "KeyS":
        that.moveBackward = true; break;

      case "KeyA":
        that.moveLeft = true; break;

      case "KeyD":
        that.moveRight = true; break;

      case "ArrowUp":
        that.rotateUp = true; break;

      case "ArrowLeft":
        that.rotateLeft = true; break;

      case "ArrowDown":
        that.rotateDown = true; break;

      case "ArrowRight":
        that.rotateRight = true; break;

      case "PageUp":
      case "KeyR":
        that.moveUp = true; break;

      case "PageDown":
      case "KeyF":
        that.moveDown = true; break;
    }

    event.preventDefault();
  };

  this.onKeyUp = function (event) {
    if(that.keyBindingsEnabled === false) {
      return;
    }
    that.shiftHold = event.shiftKey;
    that.altHold = event.altKey;
    switch(event.code) {

      case "KeyW":
        that.moveForward = false; break;

      case "KeyS":
        that.moveBackward = false; break;

      case "KeyA":
        that.moveLeft = false; break;

      case "KeyD":
        that.moveRight = false; break;

      case "ArrowUp":
        that.rotateUp = false; break;

      case "ArrowLeft":
        that.rotateLeft = false; break;

      case "ArrowDown":
        that.rotateDown = false; break;

      case "ArrowRight":
        that.rotateRight = false; break;

      case "PageUp":
      case "KeyR":
        that.moveUp = false; break;

      case "PageDown":
      case "KeyF":
        that.moveDown = false; break;
    }

    event.preventDefault();
  };

  this.fpRotate = function(rightAmount, upAmount) {
    // rotate left/right
    // rotation happens around the world up axis so up remains up (no upside-down)
    var camera = this.userView.camera;
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(0.0, 0.0, 1.0), -rightAmount);
    camera.quaternion.multiplyQuaternions(q, camera.quaternion);
    // rotate up/down
    camera.rotateX(upAmount);
  };

  this.update = function(delta) {
    if (!this.enabled)
    {
      if (this.mouseRotate || this.touchRotate)
      {
        this.endLookAround();
      }
      return;
    }

    if (delta === undefined) {
      delta = 1.0;
    }

    var speed = 0.0;

    if (!this.freeze) {
      /* --- translation --- */
      if (this.initPosition) {
        this.userView.camera.position.copy(this.initialPosition);
      }

      speed = delta * this.movementSpeed;
      if (this.shiftHold) {
        speed = speed * this.speedUpFactor;
      }
      else if (this.altHold)
      {
        speed = speed * this.speedDownFactor;
      }

      if (this.moveForward) {
        this.userView.camera.translateZ(-speed);
      }
      if (this.moveBackward) {
        this.userView.camera.translateZ(speed);
      }
      if (this.moveLeft) {
        this.userView.camera.translateX(-speed);
      }
      if (this.moveRight) {
        this.userView.camera.translateX(speed);
      }
      if (this.moveUp) {
        this.userView.camera.translateY(speed);
      }
      if (this.moveDown) {
        this.userView.camera.translateY(-speed);
      }

      /* --- rotation by means of a manipulator --- */
      var ROTATION_SPEED_FACTOR = 0.2;
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
        this.userView.camera.quaternion.copy(this.initialRotation);
      }

      /* --- rotation by means of a mouse drag --- */
      if (this.mouseRotate) {
        var actualLookSpeed = this.lookSpeed;
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

        var targetPosition = this.target, position = this.userView.camera.position;

        targetPosition.x = position.x + Math.sin(this.zenith) * Math.cos(this.azimuth);
        targetPosition.y = position.y + Math.sin(this.zenith) * Math.sin(this.azimuth);
        targetPosition.z = position.z + Math.cos(this.zenith);

        this.userView.camera.lookAt(targetPosition);
        this.cameraLookDirection = new THREE.Vector3().subVectors(targetPosition, this.userView.camera.position);
      }

      /* --- rotation by means of a touch drag --- */
      if (this.touchRotate) {
        var actualLookSpeed = this.lookSpeed;
        if (!this.activeLook) {
          actualLookSpeed = 0;
        }

        var touchDelta = new THREE.Vector2();
        touchDelta.x = this.touchPosCurrent.x - this.touchPosOnStart.x;
        touchDelta.y = this.touchPosCurrent.y - this.touchPosOnStart.y;

        this.azimuth = this.azimuthOnMouseDown + touchDelta.x * actualLookSpeed;
        this.azimuth = this.azimuth % (2 * Math.PI);

        if (this.lookVertical) {
          this.zenith = this.zenithOnMouseDown - touchDelta.y * actualLookSpeed;
          this.zenith = Math.max(this.zenithMin, Math.min(this.zenithMax, this.zenith));
        } else {
          this.zenith = Math.PI / 2;
        }

        var targetPosition = this.target, position = this.userView.camera.position;

        targetPosition.x = position.x + Math.sin(this.zenith) * Math.cos(this.azimuth);
        targetPosition.y = position.y + Math.sin(this.zenith) * Math.sin(this.azimuth);
        targetPosition.z = position.z + Math.cos(this.zenith);

        this.userView.camera.lookAt(targetPosition);
        this.cameraLookDirection = new THREE.Vector3().subVectors(targetPosition, this.userView.camera.position);
      }

      this.userView.camera.updateMatrixWorld();  // I need to add this to get the camera working with the new ThreeJS version
    }
  };

  this.onMouseDownManipulator = function(action) {
    that[action] = true;
  };

  this.onMouseUpManipulator = function(action) {
    that[action] = false;
  };

  this.updateSphericalAngles = function() {
    var vecForward = new THREE.Vector3();
    vecForward.set(this.userView.camera.matrix.elements[8], this.userView.camera.matrix.elements[9], this.userView.camera.matrix.elements[10]);
    vecForward.normalize();

    this.zenith = Math.acos(-vecForward.z);
    this.azimuth = Math.atan2(vecForward.y, vecForward.x)  + Math.PI ;
  };

  this.attachEventListeners = function() {
    var userViewDOM = this.userView.container;
    this.domElementPointerBindings = userViewDOM ? userViewDOM : document;
    this.domElementKeyboardBindings = document;

    this.domElementPointerBindings.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
    this.domElementPointerBindings.addEventListener('mousedown', this.onMouseDown, false);
    this.domElementPointerBindings.addEventListener('mousemove', this.onMouseMove, false);
    this.domElementPointerBindings.addEventListener('mouseup', this.onMouseUp, false);
    this.domElementPointerBindings.addEventListener('touchstart', this.onTouchStart, false);
    this.domElementPointerBindings.addEventListener('touchmove', this.onTouchMove, false);
    this.domElementPointerBindings.addEventListener('touchend', this.onTouchEnd, false);

    this.domElementKeyboardBindings.addEventListener('keydown', this.onKeyDown, false);
    this.domElementKeyboardBindings.addEventListener('keyup', this.onKeyUp, false);

    this.domElementPointerBindings.addEventListener('mousewheel', this.onMouseWheel, false);
    this.domElementPointerBindings.addEventListener('DOMMouseScroll', this.onMouseWheel, false);
  };

  this.detachEventListeners = function() {
    if (this.domElementPointerBindings)
    {
      this.domElementPointerBindings.removeEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
      this.domElementPointerBindings.removeEventListener('mousedown', this.onMouseDown, false);
      this.domElementPointerBindings.removeEventListener('mousemove', this.onMouseMove, false);
      this.domElementPointerBindings.removeEventListener('mouseup', this.onMouseUp, false);
      this.domElementPointerBindings.removeEventListener('touchstart', this.onTouchStart, false);
      this.domElementPointerBindings.removeEventListener('touchmove', this.onTouchMove, false);
      this.domElementPointerBindings.removeEventListener('touchend', this.onTouchEnd, false);

      this.domElementKeyboardBindings.removeEventListener('keydown', this.onKeyDown, false);
      this.domElementKeyboardBindings.removeEventListener('keyup', this.onKeyUp, false);

      this.domElementPointerBindings.removeEventListener('mousewheel', this.onMouseWheel, false);
      this.domElementPointerBindings.removeEventListener('DOMMouseScroll', this.onMouseWheel, false);
    }
  };

};

THREE.FirstPersonControls.prototype = Object.create(THREE.EventDispatcher.prototype);
