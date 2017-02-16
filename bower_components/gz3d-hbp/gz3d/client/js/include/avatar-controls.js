/**
 * Avatar controls for the gz3d camera/scene.
 */

/* global THREE: true */
/* global console: false */

THREE.AvatarControls = function(userNavigationService, gz3d, domElementPointerBindings, domElementKeyboardBindings)
{
  'use strict';

  this.userNavigationService = userNavigationService;

  this.gz3d = gz3d;
  this.domElementPointerBindings = angular.isDefined(domElementPointerBindings) ? domElementPointerBindings : document;
  this.domElementKeyboardBindings = angular.isDefined(domElementKeyboardBindings) ? domElementKeyboardBindings : document;

  if (this.domElementPointerBindings !== document) {
    this.domElementPointerBindings.setAttribute('tabindex', -1);
  }

  // hardcoded values, should be requestable from model at some point
  this.avatarRadius = 0.15;
  this.avatarEyeHeight = 1.6;

  // Set to false to disable this control
  this.enabled = false;
  this.keyboardBindingsEnabled = true;
  this.mouseBindingsEnabled = true;

  this.lockVerticalMovement = false;

  this.movementSpeed = 2.5;
  this.MOUSE_ROTATION_SPEED = 0.01;
  this.KEYBOARD_ROTATION_SPEED = 0.05;
  this.touchSensitivity = 0.01;

  this.lookVertical = true;
  this.thirdPerson = false;

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

  this.keyboardRotateLeft = false;
  this.keyboardRotateRight = false;
  this.keyboardRotateUp = false;
  this.keyboardRotateDown = false;

  this.freeze = false;

  this.mouseDragOn = false;
  this.mousePosOnKeyDown = new THREE.Vector2();
  this.mousePosCurrent = new THREE.Vector2();

  this.startTouchDistance = new THREE.Vector2();
  this.startTouchMid = new THREE.Vector2();
  this.userStartPosition = new THREE.Vector3();
  this.cameraLookDirection = new THREE.Vector3();

  // init ROS velocity topic for avatar movement
  this.rosConnection = this.userNavigationService.roslib.getOrCreateConnectionTo(this.userNavigationService.rosbridgeWebsocketUrl);

  this.linearVelocity = new THREE.Vector3();

  this.avatarRotation = new THREE.Quaternion();

  this.init = function(avatar, camera) {
    this.avatar = avatar;
    this.camera = camera;

    // attach camera to avatar object
    this.avatar.add(this.camera);
    this.camera.position.set(0, this.avatarRadius, this.avatarEyeHeight);
    this.camera.quaternion.set(0, 0, 0, 1);
    this.camera.updateMatrixWorld();
  };

  this.createAvatarTopics = function(avatarName) {
    this.linearVelocityTopicName = '/' + avatarName + '/user_avatar_basic/body/cmd_vel';
    this.linearVelocityTopic = this.userNavigationService.roslib.createTopic(
      this.rosConnection,
      this.linearVelocityTopicName,
      'geometry_msgs/Vector3'
    );

    this.avatarRotationTopicName = '/' + avatarName + '/cmd_rot';
    this.avatarRotationTopic = this.userNavigationService.roslib.createTopic(
      this.rosConnection,
      this.avatarRotationTopicName,
      'geometry_msgs/Quaternion'
    );
  };

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
        //this.updateSphericalAnglesFromForwardVector();
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
        //this.azimuthOnMouseDown = this.azimuth;
        //this.zenithOnMouseDown = this.zenith;
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
        this.updateSphericalAnglesFromForwardVector();
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
    if(this.keyboardBindingsEnabled === false || event.metaKey || event.ctrlKey) {
      return;
    }
    this.shiftHold = event.shiftKey;
    switch(event.code) {
      case "ArrowUp":
        this.keyboardRotateUp = true; break;
      case "KeyW":
        this.moveForward = true; break;

      case "ArrowLeft":
        this.keyboardRotateLeft = true; break;
      case "KeyA":
        this.moveLeft = true; break;

      case "ArrowDown":
        this.keyboardRotateDown = true; break;
      case "KeyS":
        this.moveBackward = true; break;

      case "ArrowRight":
        this.keyboardRotateRight = true; break;
      case "KeyD":
        this.moveRight = true; break;

      case "PageUp":
      case "KeyR":
        this.moveUp = true; break;

      case "PageDown":
      case "KeyF":
        this.moveDown = true; break;
    }
  };

  this.onKeyUp = function (event) {
    if(this.keyboardBindingsEnabled === false) {
      return;
    }
    this.shiftHold = event.shiftKey;
    switch(event.code) {
      case "ArrowUp":
        this.keyboardRotateUp = false; break;
      case "KeyW":
        this.moveForward = false; break;

      case "ArrowLeft":
        this.keyboardRotateLeft = false; break;
      case "KeyA":
        this.moveLeft = false; break;

      case "ArrowDown":
        this.keyboardRotateDown = false; break;
      case "KeyS":
        this.moveBackward = false; break;

      case "ArrowRight":
        this.keyboardRotateRight = false; break;
      case "KeyD":
        this.moveRight = false; break;

      case "PageUp":
      case "KeyR":
        this.moveUp = false; break;

      case "PageDown":
      case "KeyF":
        this.moveDown = false; break;

      case "KeyQ":
        this.freeze = !this.freeze; break;// TODO(Luc): handles this from gz3d-view.js with some visual indication that the scene is frozen

      case "KeyT":
      {
        this.thirdPerson = !this.thirdPerson;
        if (this.thirdPerson) {
          this.camera.position.set(0, -5, this.avatarEyeHeight + 1);
        } else {
          this.camera.position.set(0, this.avatarRadius, this.avatarEyeHeight);
        }
        this.camera.updateMatrixWorld();
        break;
      }
    }
  };

  this.keyboardRotate = function(rightAmount, upAmount) {
    // rotate left/right
    // rotation happens around the world up axis so up remains up (no upside-down)
    this.azimuth += rightAmount;
    this.zenith = Math.max(this.zenithMin, Math.min(this.zenithMax, this.zenith - upAmount));
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
    else {
      this.avatar.position.copy(position);
      this.avatar.updateMatrixWorld();
    }

    // update orientation
    var camWorldPosition = this.camera.getWorldPosition();
    var vecForward = new THREE.Vector3().add(lookAt).sub(camWorldPosition).normalize();
    this.updateSphericalAnglesFromForwardVector(vecForward);
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
    var intersects = raycaster.intersectObjects(gz3d.scene.scene.children, true);
    for (var i=0; i < intersects.length; i=i+1) {
      // check that we hit some actual geometry and it is not our own avatar
      if (intersects[i].object instanceof THREE.Mesh && !isObjectPartOfAvatar(intersects[i].object)) {
        return intersects[i].point;
      }
    }

    // if no hits below, check if avatar can be placed above
    raycaster.set(position, upVector.negate());
    intersects = raycaster.intersectObjects(gz3d.scene.scene.children, true);
    for (var j=0; j < intersects.length; j=j+1) {
      if (intersects[i].object instanceof THREE.Mesh && !isObjectPartOfAvatar(intersects[i].object)) {
        return intersects[i].point;
      }
    }

    return undefined;
  };

  /**
   * update spherical angles by a world forward vector
   * @param vecForward
     */
  this.updateSphericalAnglesFromForwardVector = function(vecForward) {
    vecForward.normalize();

    this.azimuth = Math.atan2(vecForward.y, vecForward.x) - 0.5 * Math.PI;
    this.azimuthOnMouseDown = this.azimuth;

    this.zenith = Math.max(this.zenithMin, Math.min(this.zenithMax, Math.acos(vecForward.z) + Math.PI));
    this.zenithOnMouseDown = this.zenith;
  };

  this.updateSphericalAnglesFromUserInput = function(timeDelta) {
    /* --- rotation by means of a manipulator --- */
    var speedup = this.shiftHold ? 2 : 1;
    var keyboardRotationSpeed = speedup * this.KEYBOARD_ROTATION_SPEED;
    if (this.keyboardRotateUp || this.keyboardRotateDown) {
      var sign = this.keyboardRotateUp ? 1.0 : -1.0;
      this.keyboardRotate(0.0, sign * keyboardRotationSpeed);
    }
    if (this.keyboardRotateRight) {
      this.keyboardRotate(-keyboardRotationSpeed, 0.0);
    }
    if (this.keyboardRotateLeft) {
      this.keyboardRotate(keyboardRotationSpeed, 0.0);
    }

    /* --- rotation by means of a mouse drag --- */
    if (this.mouseDragOn) {
      var actualLookSpeed = this.MOUSE_ROTATION_SPEED;
      if (!this.mouseBindingsEnabled) {
        actualLookSpeed = 0;
      }

      var mouseDelta = new THREE.Vector2().subVectors(this.mousePosCurrent, this.mousePosOnKeyDown);

      this.azimuth = this.azimuthOnMouseDown - mouseDelta.x * actualLookSpeed;

      // horizontally rotate the whole user object instead of only camera/"head" for now

      if (this.lookVertical) {
        this.zenith = this.zenithOnMouseDown + mouseDelta.y * actualLookSpeed;
        this.zenith = Math.max(this.zenithMin, Math.min(this.zenithMax, this.zenith));
      } else {
        this.zenith = Math.PI / 2;
      }
    }
  };

  /**
   * Update avatar quaternion from current azimuth
   */
  this.updateAvatarRotation = function() {
    /*if (this.azimuth > Math.PI) {
      this.azimuth -= 2 * Math.PI;
    } else if (this.azimuth < -Math.PI) {
      this.azimuth += 2 * Math.PI;
    }*/

    this.avatarRotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.azimuth);
    this.avatarRotation.normalize();
  };

  /**
   * Update avatar quaternion from current azimuth
   */
  this.publishAvatarRotation = function() {
    var rotationMsg = new ROSLIB.Message({
      x: this.avatarRotation.x,
      y: this.avatarRotation.y,
      z: this.avatarRotation.z,
      w: this.avatarRotation.w
    });

    this.avatarRotationTopic.publish(rotationMsg);
  };

  /**
   * Update camera quaternion from current azimuth and zenith
   */
  this.updateCameraRotation = function() {
    var rotation = new THREE.Quaternion();
    rotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-1, 0, 0), this.zenith));
    this.camera.quaternion.copy(rotation);
    this.camera.updateMatrixWorld();
  };

  this.updateLinearVelocity = function(delta) {
    var speed = this.movementSpeed;
    if (this.shiftHold) {
      speed = speed * this.speedUpFactor;
    }

    this.linearVelocity.set(0, 0, 0);
    if (this.moveForward) {
      this.linearVelocity.y = 1;
    }
    if (this.moveBackward) {
      this.linearVelocity.y = -1;
    }
    if (this.moveLeft) {
      this.linearVelocity.x = -1;
    }
    if (this.moveRight) {
      this.linearVelocity.x = 1;
    }
    if (!(this.lockVerticalMovement)) {
      if (this.moveUp) {
        this.linearVelocity.z = 1;
      }
      if (this.moveDown) {
        this.linearVelocity.z = -1;
      }
    }
    this.linearVelocity.normalize().multiplyScalar(speed);
    this.linearVelocity.applyQuaternion(this.avatar.quaternion);
  };

  this.publishLinearVelocity = function() {
    var velocityMsg = new ROSLIB.Message({
      x: this.linearVelocity.x,
      y: this.linearVelocity.y,
      z: this.linearVelocity.z
    });

    this.linearVelocityTopic.publish(velocityMsg);
  };

  /**
   * Method to be called during render cycles for updates between frames.
   * @param delta Time passed since last frame
     */
  this.update = function(delta) {
    if (!this.enabled) {
      if (this.mouseDragOn)
      {
        this.endLookAround();
      }
      return;
    }

    if (delta === undefined) {
      delta = 1.0;
    }

    if (this.applyPoseDuringUpdate) {
      this.setPose(this.applyPosePosition, this.applyPoseLookAt);
      gz3d.scene.emitter.emit('entityChanged', this.avatar);

      var vecForward = new THREE.Vector3().subVectors(this.applyPoseLookAt, this.applyPosePosition).normalize();
      this.updateSphericalAnglesFromForwardVector(vecForward);

      this.applyPoseDuringUpdate = false;
    }
    else {
      if (!this.freeze) {
        this.updateLinearVelocity(delta);
        this.publishLinearVelocity();

        this.updateSphericalAnglesFromUserInput(delta);
      }
    }

    this.updateAvatarRotation();
    this.publishAvatarRotation();

    this.updateCameraRotation();
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
