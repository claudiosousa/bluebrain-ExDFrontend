/* global THREE: false */
/* global console: false */
(function () {
    'use strict';

    angular.module('userNavigationModule', ['nrpUser'])
      .constant('NAVIGATION_MODES', {
        FREE_CAMERA: 'FreeCamera',
        GHOST: 'Ghost',
        HUMAN_BODY: 'HumanBody'
      })
      .factory('userNavigationService', [
        'NAVIGATION_MODES',
        'gz3d',
        'nrpUser',
        'simulationInfo',
        'roslib',
        function (NAVIGATION_MODES, gz3d, nrpUser, simulationInfo, roslib) {
          return {

            navigationMode: undefined,
            avatarObject: undefined,
            avatarObjectName: undefined,
            avatarNameBase: 'user_avatar',
            avatarInitialized: false,
            userDataInitialized: false,
            avatarModelPathWithCollision: 'user_avatar_basic',
            avatarModelPathNoCollision: 'user_avatar_basic_no-collision',
            userCamera: undefined,
            defaultPosition: undefined,
            defaultLookAt: undefined,
            userID: undefined,
            userDisplayName: undefined,

            rosbridgeWebsocketUrl: undefined,
            roslib: undefined,

            init: function() {

              this.rosbridgeWebsocketUrl = simulationInfo.serverConfig.rosbridge.websocket;
              this.roslib = roslib;

              this.userCamera = gz3d.scene.viewManager.mainUserView.camera;

              // react to updates from gazebo server
              gz3d.iface.modelInfoTopic.subscribe(this.onModelInfo.bind(this));


              this.avatarObjectName = this.avatarNameBase;
              // get user info
              var that = this;
              nrpUser.getCurrentUser().then(function (profile) {
                that.setUserData(profile);

                that.removeAvatar();

                // set up controls
                var domElementForKeyBindings = document.getElementsByTagName('body')[0];
                that.freeCameraControls = new THREE.FirstPersonControls(that.userCamera, gz3d.scene.container, domElementForKeyBindings);

                // start in free camera mode
                that.setModeFreeCamera();
              });
            },

            deinit: function() {
              var avatar = this.getUserAvatar();
              if (angular.isDefined(avatar)) {
                gz3d.gui.emitter.emit('deleteEntity', avatar);
                gz3d.scene.scene.remove(avatar);
              }
            },

            setUserData: function(profile) {
              this.userID = profile.id;
              this.userDisplayName = profile.displayName;
              this.avatarObjectName = this.avatarNameBase + '_' + this.userID;
              this.userDataInitialized = true;
            },

            onModelInfo: function(modelMessage) {
              // check if message concerns avatar and in avatar mode
              if ((this.navigationMode !== NAVIGATION_MODES.HUMAN_BODY) || (modelMessage.name !== this.avatarObjectName)) {
                return;
              }

              if (!this.avatarInitialized) {
                this.initAvatar();
              }
            },

            getUserAvatar: function() {
              if(!angular.isDefined(gz3d.scene)) {
                return undefined;
              }

              var that = this;
              var avatar;
              var found = false;
              gz3d.scene.scene.traverse(function(node) {
                if (!found && node.name && node.name.indexOf(that.avatarObjectName) !== -1) {
                  avatar = node;
                  found = true;
                }
              });

              return avatar;
            },

            createAvatar: function(hasCollision) {
              var avatar = new THREE.Object3D();
              avatar.name = this.avatarObjectName;
              var modelName;
              if (hasCollision) {
                modelName = this.avatarModelPathWithCollision;
              } else {
                modelName = this.avatarModelPathNoCollision;
              }

              gz3d.gui.emitter.emit('entityCreated', avatar, modelName);
            },

            initAvatar: function() {
              this.avatarObject = this.getUserAvatar();
              if (!angular.isDefined(this.avatarObject)) {
                return;
              }

              // avatar controls
              this.freeCameraControls.enabled = false;
              var domElementForKeyBindings = document.getElementsByTagName('body')[0];
              this.avatarControls = new THREE.AvatarControls(this, gz3d, this.avatarObject, this.userCamera, gz3d.scene.container, domElementForKeyBindings);

              switch (this.navigationMode) {
                case NAVIGATION_MODES.HUMAN_BODY:
                      // humans can't fly
                      this.avatarControls.lockVerticalMovement = true;
                      break;
              }

              // attach camera to avatar object
              this.avatarObject.add(this.userCamera);
              this.userCamera.position.set(0, this.avatarControls.avatarRadius, this.avatarControls.avatarEyeHeight);
              this.userCamera.quaternion.set(0, 0, 0, 1);
              this.userCamera.updateMatrixWorld();

              // set pose
              if (angular.isDefined(this.currentPosition) && angular.isDefined(this.currentDirection) && angular.isDefined(this.currentLookAt)) {
                this.avatarControls.applyPose(this.currentPosition, this.currentLookAt);
              } else {
                // no current position, default
                this.avatarControls.applyPose(this.defaultPosition, this.defaultLookAt);
              }

              // set and activate controls
              gz3d.scene.controls = this.avatarControls;
              this.avatarControls.enabled = true;

              this.avatarInitialized = true;
            },

            removeAvatar: function() {
              var avatar = this.getUserAvatar();
              if (angular.isDefined(avatar)) {
                gz3d.gui.emitter.emit('deleteEntity', avatar);
                gz3d.scene.scene.remove(avatar);
              }
              this.avatarInitialized = false;
            },

            setDefaultPose: function(posX, posY, posZ, lookAtX, lookAtY, lookAtZ) {
              this.defaultPosition = new THREE.Vector3(posX, posY, posZ);
              this.defaultLookAt = new THREE.Vector3(lookAtX, lookAtY, lookAtZ);
            },

            saveCurrentPose: function() {
              if (!angular.isDefined(this.userCamera)) {
                return;
              }
              this.userCamera.updateMatrixWorld();
              this.currentPosition = this.userCamera.getWorldPosition();
              this.currentDirection = this.userCamera.getWorldDirection();
              var raycaster = new THREE.Raycaster(this.currentPosition, this.currentDirection);
              var intersections = raycaster.intersectObjects(gz3d.scene.scene.children, true);
              if (intersections.length > 0) {
                this.currentLookAt = new THREE.Vector3().copy(intersections[0].point);
              } else {
                this.currentLookAt = this.currentPosition.clone().add(this.currentDirection.clone().multiplyScalar(100));
              }
            },

            setModeHumanBody: function() {
              if (this.navigationMode === NAVIGATION_MODES.HUMAN_BODY) {
                return;
              }

              this.saveCurrentPose();
              // detach camera
              gz3d.scene.scene.add(this.userCamera);

              this.navigationMode = NAVIGATION_MODES.HUMAN_BODY;

              this.freeCameraControls.enabled = false;
              gz3d.scene.controls = undefined;

              this.removeAvatar();
              var avatarCollision = true;
              this.createAvatar(avatarCollision);

              this.freeCameraControls.domElement.removeEventListener('mousewheel', this.freeCameraControls.onMouseWheel);
              this.freeCameraControls.domElement.removeEventListener('DOMMouseScroll', this.freeCameraControls.onMouseWheel);
            },

            setModeFreeCamera: function() {
              if (this.navigationMode === NAVIGATION_MODES.FREE_CAMERA) {
                return;
              }

              this.navigationMode = NAVIGATION_MODES.FREE_CAMERA;

              this.saveCurrentPose();

              // detach camera
              gz3d.scene.scene.add(this.userCamera);

              this.removeAvatar();

              if (angular.isDefined(this.currentPosition) && angular.isDefined(this.currentDirection)) {
                this.userCamera.position.copy(this.currentPosition);
                this.userCamera.updateMatrixWorld();
                var lookAt = this.currentPosition.clone().add(this.currentDirection.clone().multiplyScalar(100));
                this.userCamera.lookAt(lookAt);
              }

              window.firstPersonControls = this.freeCameraControls;
              this.freeCameraControls.domElement.addEventListener('mousewheel', this.freeCameraControls.onMouseWheel, false);
              this.freeCameraControls.domElement.addEventListener('DOMMouseScroll', this.freeCameraControls.onMouseWheel, false);

              this.freeCameraControls.enabled = true;
              gz3d.scene.controls = this.freeCameraControls;
            }
          };
        }
      ]);
  }());
