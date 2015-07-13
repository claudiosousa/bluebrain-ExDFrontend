/**
 * First person controls for the gz3d camera/scene.
 * Adapted from https://threejsdoc.appspot.com/doc/three.js/src.source/extras/controls/FirstPersonControls.js.html.
 *
 * Note that there is a third parameter now, called 'domElementForKeyBindings' which specifies to which element in
 * the DOM the key strokes are bound. (Before they were automatically bound to the parameter 'domElement').
 */

/* global THREE: true */

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

  this.movementSpeed = 0.05;
  this.lookSpeed = 0.01;

  this.target = new THREE.Vector3();
  this.lookVertical = true;

  this.activeLook = true;

  this.azimuth = 0.0;
  this.zenith = 0.0;
  this.zenithMin = 0.0;
  this.zenithMax = Math.PI;
  this.azimuthOnMouseDown = 0.0;
  this.zenithOnMouseDown = 0.0;

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

  this.initialPosition = new THREE.Vector3().copy(this.object.position);
  this.initialRotation = new THREE.Quaternion().copy(this.object.quaternion);

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
          this.azimuthOnMouseDown = this.azimuth;
          this.zenithOnMouseDown = this.zenith;
          this.mouseDragOn = true;
          break;
        case 2:
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
        case 2:
      }
    }
  };

  this.onMouseMove = function (event) {
    this.mousePosCurrent.set(event.pageX, event.pageY);
  };

  this.onKeyDown = function (event) {
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
      }
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
    vecForward.set(object.matrix.elements[8], object.matrix.elements[9], object.matrix.elements[10]);
    vecForward.normalize();

    this.zenith = Math.acos(-vecForward.z);
    this.azimuth = Math.atan(vecForward.y / vecForward.x) + Math.PI;
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

  domElementForKeyBindings.addEventListener('keydown', bind(this, this.onKeyDown), false);
  domElementForKeyBindings.addEventListener('keyup', bind(this, this.onKeyUp), false);

};

THREE.FirstPersonControls.prototype = Object.create(THREE.EventDispatcher.prototype);
