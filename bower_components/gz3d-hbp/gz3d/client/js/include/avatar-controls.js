/**
 * Avatar controls for the gz3d camera/scene.
 */

/* global THREE: true */
/* global console: false */

THREE.AvatarControls = function(gz3dScene, avatar, camera, domElementPointerBindings, domElementKeyboardBindings)
{
  'use strict';

  this.gz3dScene = gz3dScene;
  this.avatar = avatar;
  this.camera = camera;
  this.domElementPointerBindings = angular.isDefined(domElementPointerBindings) ? domElementPointerBindings : document;
  this.domElementKeyboardBindings = angular.isDefined(domElementKeyboardBindings) ? domElementKeyboardBindings : document;

  if (this.domElementPointerBindings !== document) {
    this.domElementPointerBindings.setAttribute('tabindex', -1);
  }

  // hardcoded values, should be requestable from model at some point
  this.avatarRadius = 0.15;
  this.avatarEyeHeight = 1.6;
  this.avatarWaistHeight = 0.8;

  // Set to false to disable this control
  this.enabled = false;
  this.keyboardBindingsEnabled = true;
  this.mouseBindingsEnabled = true;

  this.lockVerticalMovement = false;

  this.movementSpeed = 0.05;
  this.lookSpeed = 0.01;
  this.touchSensitivity = 0.01;

  this.lookVertical = true;

  this.azimuth = 0.0;
  this.zenith = 0.0;
  this.zenithMin = Math.PI;
  this.zenithMax = 2*Math.PI;
  this.azimuthOnMouseDown = this.azimuth;
  this.zenithOnMouseDown = this.zenith;
  this.speedUpFactor = 3.0;

  this.shiftHold = false;
  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.moveUp = false;
  this.moveDown = false;

  this.rotateLeft = false;
  this.rotateRight = false;
  this.rotateUp = false;
  this.rotateDown = false;

  this.freeze = false;

  this.mouseDragOn = false;
  this.mousePosOnKeyDown = new THREE.Vector2();
  this.mousePosCurrent = new THREE.Vector2();

  this.startTouchDistance = new THREE.Vector2();
  this.startTouchMid = new THREE.Vector2();
  this.userStartPosition = new THREE.Vector3();
  this.cameraLookDirection = new THREE.Vector3();

  this.onMouseDown = function (event) {
    // HBP-NRP: The next three lines are commented since this leads to problems in chrome with respect
    // to AngularJS, also see: [NRRPLT-1992]
    //if (this.domElementPointerBindings !== document) {
    //  this.domElementPointerBindings.focus();
    //}

    event.preventDefault();
    event.stopPropagation();

    if (!this.mouseBindingsEnabled) {
      return;
    }

    switch (event.button) {
      case 0:
        //this.updateSphericalAngles();
        this.mousePosOnKeyDown.set(event.pageX, event.pageY);
        this.mousePosCurrent.copy(this.mousePosOnKeyDown);
        this.azimuthOnMouseDown = this.azimuth;
        this.zenithOnMouseDown = this.zenith;
        this.mouseDragOn = true;
        break;
    }
  };

  this.onMouseUp = function (event) {
    event.preventDefault();

    // We do not stop the event propagation here, since there may be other
    // components sitting on top, which also may have registered a handler
    // and expect the event to be fired.
    //event.stopPropagation();

    if (!this.mouseBindingsEnabled) {
      return;
    }

    switch (event.button) {
      case 0:
        this.mouseDragOn = false;
        this.azimuthOnMouseDown = this.azimuth;
        this.zenithOnMouseDown = this.zenith;
        break;
    }
  };

  this.onMouseMove = function (event) {
    // only update the position, when a mouse button is pressed
    // else end the lookAround-mode

    if (!this.mouseBindingsEnabled) {
      return;
    }

    if (event.buttons !== 0) {
      this.mousePosCurrent.set(event.pageX, event.pageY);
    } else {
      this.endLookAround();
    }
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

        this.userStartPosition.copy(this.avatar.position);
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
          straveDirection.set(touchMidDelta.x, -touchMidDelta.y, 0.0).applyQuaternion(this.camera.quaternion);
        }

        this.avatar.position.addVectors(this.userStartPosition, forwardDirection).add(straveDirection);

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
        this.userStartPosition = new THREE.Vector3();
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
    if(this.keyboardBindingsEnabled === false) {
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
    if(this.keyboardBindingsEnabled === false) {
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
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(0.0, 0.0, 1.0), rightAmount);
    this.avatar.quaternion.multiplyQuaternions(q, this.avatar.quaternion);
    // rotate up/down
    this.camera.rotateX(upAmount);
  };

  /**
   * Applies a pose during next update
   * @param position
   * @param lookAt
     */
  this.applyPose = function(position, lookAt) {
    this.applyPosePosition = position;
    this.applyPoseLookAt = lookAt;
    this.applyPoseDuringUpdate = true;
  }

  /**
   * set pose from a position and point to look at
   * @param position THREE.Vector3 position
   * @param lookAt THREE.Vector3 point to look at (world coordinates)
   */
  this.setPose = function(position, lookAt) {
    if (!(position instanceof THREE.Vector3) || !(lookAt instanceof THREE.Vector3)) {
      return;
    }

    // update position
    var posOnGround = this.projectOntoGround(position);
    if (angular.isDefined(posOnGround)) {
      //TODO: animate "fall down"
      this.avatar.position.copy(posOnGround);
      this.avatar.updateMatrixWorld();
    }

    // update orientation
    var camWorldPosition = this.camera.getWorldPosition();
    var vecForward = new THREE.Vector3().add(lookAt).sub(camWorldPosition).normalize();
    this.updateSphericalAngles(vecForward);
  };

  /**
   * Take a point in space and project it onto a mesh below/above
   * @param position THREE.Vector3 position in space
   * @returns {*}
     */
  this.projectOntoGround = function(position) {
    var that = this;
    var isObjectPartOfAvatar = function(object) {
      var partOfAvatar = false;
      object.traverseAncestors(function(node) {
        if (node.name && node.name === that.avatar.name) {
          partOfAvatar = true;
        }
      });

      return partOfAvatar;
    };

    // check for intersection below position
    var upVector = this.camera.up.clone();
    var raycaster = new THREE.Raycaster(position, upVector.negate());
    var intersects = raycaster.intersectObjects(gz3dScene.scene.children, true);
    for (var i=0; i < intersects.length; i=i+1) {
      // check that we hit some actual geometry and it is not our own avatar
      if (intersects[i].object instanceof THREE.Mesh && !isObjectPartOfAvatar(intersects[i].object)) {
        return intersects[i].point;
      }
    }

    // if no hits below, check if avatar can be placed above
    raycaster.set(position, upVector.negate());
    intersects = raycaster.intersectObjects(gz3dScene.scene.children, true);
    for (var j=0; j < intersects.length; j=j+1) {
      if (intersects[i].object instanceof THREE.Mesh && !isObjectPartOfAvatar(intersects[i].object)) {
        return intersects[i].point;
      }
    }

    return undefined;
  };

  /**
   * Update avatar quaternion from current azimuth and zenith
   */
  this.updateAvatarOrientation = function() {
    this.avatar.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.azimuth);
    this.avatar.updateMatrixWorld();
    this.camera.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), this.zenith);
    this.camera.updateMatrixWorld();
  };

  /**
   * update spherical angles by a world forward vector
   * @param vecForward
     */
  this.updateSphericalAngles = function(vecForward) {
    vecForward.normalize();

    this.azimuthOnMouseDown = this.azimuth = Math.atan2(vecForward.y, vecForward.x) - 0.5*Math.PI;
    this.zenithOnMouseDown = this.zenith = Math.max(this.zenithMin, Math.min(this.zenithMax, /*1.5*Math.PI*/Math.acos(vecForward.z) + Math.PI));
    this.updateAvatarOrientation();
  };

  /**
   * Method to be called during render cycles for updates between frames.
   * @param delta Time passed since last frame
     */
  this.update = function(delta) {
    if (!this.enabled) {
      return;
    }

    if (this.applyPoseDuringUpdate) {
      this.setPose(this.applyPosePosition, this.applyPoseLookAt);
      this.applyPoseDuringUpdate = false;
    }

    if (delta === undefined) {
      delta = 1.0;
    }

    var speed = 0.0;

    if (!this.freeze) {
      /* --- translation --- */
      speed = delta * this.movementSpeed;
      if (this.shiftHold) {
        speed = speed * this.speedUpFactor;
      }

      if (this.moveForward) {
        this.avatar.translateY(speed);
      }
      if (this.moveBackward) {
        this.avatar.translateY(-speed);
      }
      if (this.moveLeft) {
        this.avatar.translateX(-speed);
      }
      if (this.moveRight) {
        this.avatar.translateX(speed);
      }
      this.avatar.updateMatrixWorld();
      if (this.lockVerticalMovement) {
        // determine position on ground
        var projectionOrigin = this.avatar.getWorldPosition().clone().add(this.camera.up.clone().multiplyScalar(this.avatarWaistHeight));
        var pos = this.projectOntoGround(projectionOrigin);
        if (angular.isDefined(pos)) {
          var diff = new THREE.Vector3().subVectors(pos, this.avatar.getWorldPosition());
          if (diff.length() > 0.01) {
            this.avatar.position.copy(pos);
          }
        }
      } else {
        if (this.moveUp) {
          this.avatar.translateZ(speed);
        }
        if (this.moveDown) {
          this.avatar.translateZ(-speed);
        }
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

      /* --- rotation by means of a mouse drag --- */
      if (this.mouseDragOn) {
        var actualLookSpeed = delta * this.lookSpeed;
        if (!this.mouseBindingsEnabled) {
          actualLookSpeed = 0;
        }

        var mouseDelta = new THREE.Vector2();
        mouseDelta.x = this.mousePosCurrent.x - this.mousePosOnKeyDown.x;
        mouseDelta.y = this.mousePosCurrent.y - this.mousePosOnKeyDown.y;

        this.azimuth = this.azimuthOnMouseDown - mouseDelta.x * actualLookSpeed;
        this.azimuth = this.azimuth % (2 * Math.PI);

        // horizontally rotate the whole user object instead of only camera/"head" for now

        if (this.lookVertical) {
          this.zenith = this.zenithOnMouseDown + mouseDelta.y * actualLookSpeed;
          this.zenith = Math.max(this.zenithMin, Math.min(this.zenithMax, this.zenith));
        } else {
          this.zenith = Math.PI / 2;
        }
      }

      this.updateAvatarOrientation();
      this.gz3dScene.emitter.emit('entityChanged', this.avatar);
    }
  };

  this.onMouseDownManipulator = function(action) {
    this[action] = true;
  };

  this.onMouseUpManipulator = function(action) {
    this[action] = false;
  };

  function bind(scope, fn) {
    return function () {
      fn.apply(scope, arguments);
    };
  }

  this.domElementPointerBindings.addEventListener('mousemove', bind(this, this.onMouseMove), false);
  this.domElementPointerBindings.addEventListener('mousedown', bind(this, this.onMouseDown), false);
  this.domElementPointerBindings.addEventListener('mouseup', bind(this, this.onMouseUp), false);
  this.domElementPointerBindings.addEventListener('touchstart', bind(this, this.onTouchStart), false);
  this.domElementPointerBindings.addEventListener('touchmove', bind(this, this.onTouchMove), false);
  this.domElementPointerBindings.addEventListener('touchend', bind(this, this.onTouchEnd), false);

  this.domElementKeyboardBindings.addEventListener('keydown', bind(this, this.onKeyDown), false);
  this.domElementKeyboardBindings.addEventListener('keyup', bind(this, this.onKeyUp), false);

};

THREE.AvatarControls.prototype = Object.create(THREE.EventDispatcher.prototype);
