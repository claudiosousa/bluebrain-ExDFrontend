/**
 * First person controls for the gz3d camera/scene.
 * Adapted from https://threejsdoc.appspot.com/doc/three.js/src.source/extras/controls/FirstPersonControls.js.html.
 */

/* global THREE: true */

THREE.FirstPersonControls = function (object, domElement)
{
  'use strict';

  this.object = object;
  this.domElement = (domElement !== undefined) ? domElement : document;

  if ( this.domElement !== document ) {
    this.domElement.setAttribute( 'tabindex', -1 );
  }

  // Set to false to disable this control
  this.enabled = true;

  this.target = new THREE.Vector3();
  this.targetIndicator = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 20),
      new THREE.MeshPhongMaterial({emissive: 0x333300,
      ambient: 0xffff00,
      shading: THREE.SmoothShading}));
  this.targetIndicator.visible = false;
  this.showTargetIndicator = false;

  this.object.lookAt(this.target);

  this.movementSpeed = 0.2;
  this.lookSpeed = 0.01;

  this.lookVertical = true;
  this.autoForward = false;

  this.activeLook = true;

  this.autoSpeedFactor = 0.0;

  this.azimuth = 0;
  this.zenith = 0;
  this.zenithMin = 0;
  this.zenithMax = Math.PI;
  this.azimuthOnMouseDown = 0;
  this.zenithOnMouseDown = 0;

  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.moveUp = false;
  this.moveDown = false;
  this.freeze = false;

  this.mouseDragOn = false;
  this.mousePosOnKeyDown = new THREE.Vector2();
  this.mousePosCurrent = new THREE.Vector2();

  this.onMouseDown = function ( event ) {

    if ( this.domElement !== document ) {
      this.domElement.focus();
    }

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {
      switch ( event.button ) {
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

  this.onMouseUp = function ( event ) {

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {
      switch ( event.button ) {
        case 0:
          this.mouseDragOn = false;
          this.azimuthOnMouseDown = this.azimuth;
          this.zenithOnMouseDown = this.zenith;
          break;
        case 2:
      }
    }

  };

  this.onMouseMove = function ( event ) {

    this.mousePosCurrent.set(event.pageX, event.pageY);

  };

  this.onKeyDown = function ( event ) {

    switch( event.keyCode ) {

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

  this.onKeyUp = function ( event ) {

    switch( event.keyCode ) {

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

      case 81: /*Q*/ this.freeze = !this.freeze; break;

    }

  };

  this.update = function( delta ) {

    if (!this.enabled) {
      return;
    }

    if (delta === undefined) {
      delta = 1;
    }

    var actualMoveSpeed = 0;

    if ( !this.freeze ) {

      /* --- translation --- */

      actualMoveSpeed = delta * this.movementSpeed;

      if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) {
        this.object.translateOnAxis(new THREE.Vector3(0,0,1), -(actualMoveSpeed + this.autoSpeedFactor));
      }
      if ( this.moveBackward ) {
        this.object.translateOnAxis(new THREE.Vector3(0,0,1), actualMoveSpeed );
      }
      if ( this.moveLeft ) {
        this.object.translateOnAxis(new THREE.Vector3(1,0,0), - actualMoveSpeed );
      }
      if ( this.moveRight ) {
        this.object.translateOnAxis(new THREE.Vector3(1,0,0), actualMoveSpeed );
      }
      if ( this.moveUp ) {
        this.object.translateOnAxis(new THREE.Vector3(0,1,0), actualMoveSpeed );
      }
      if ( this.moveDown ) {
        this.object.translateOnAxis(new THREE.Vector3(0,1,0), - actualMoveSpeed );
      }

      /* --- rotation --- */

      if (this.mouseDragOn) {

        var actualLookSpeed = delta * this.lookSpeed;
        if ( !this.activeLook ) {
          actualLookSpeed = 0;
        }

        var mouseDelta = new THREE.Vector2();
        mouseDelta.x = this.mousePosCurrent.x - this.mousePosOnKeyDown.x;
        mouseDelta.y = this.mousePosCurrent.y - this.mousePosOnKeyDown.y;

        this.azimuth = this.azimuthOnMouseDown - mouseDelta.x * actualLookSpeed;
        this.azimuth = this.azimuth % (2 * Math.PI);

        if( this.lookVertical ) {
          this.zenith = this.zenithOnMouseDown + mouseDelta.y * actualLookSpeed;
          this.zenith = Math.max( this.zenithMin, Math.min( this.zenithMax, this.zenith ) );
        } else {
          this.zenith = Math.PI / 2;
        }

        var targetPosition = this.target, position = this.object.position;

        targetPosition.x = position.x + Math.sin(this.zenith) * Math.cos(this.azimuth);
        targetPosition.y = position.y + Math.sin(this.zenith) * Math.sin(this.azimuth);
        targetPosition.z = position.z + Math.cos(this.zenith);

        this.object.lookAt( targetPosition );
      }
    }

  };

  this.updateSphericalAngles = function() {
    var vecForward = new THREE.Vector3();
    vecForward.set(object.matrix.elements[8], object.matrix.elements[9], object.matrix.elements[10]);
    vecForward.normalize();

    this.zenith = Math.acos(-vecForward.z);
    this.azimuth = Math.atan(vecForward.y / vecForward.x) + Math.PI;
  };

  function bind( scope, fn ) {

    return function () {
      fn.apply( scope, arguments );
    };

  }

  this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
  this.domElement.addEventListener( 'mousemove', bind( this, this.onMouseMove ), false );
  this.domElement.addEventListener( 'mousedown', bind( this, this.onMouseDown ), false );
  this.domElement.addEventListener( 'mouseup', bind( this, this.onMouseUp ), false );
  this.domElement.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
  this.domElement.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );
};

THREE.FirstPersonControls.prototype = Object.create(THREE.EventDispatcher.prototype);
