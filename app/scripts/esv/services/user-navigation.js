/* global THREE: false */
/* global console: false */
(function () {
    'use strict';

    angular.module('userNavigationModule', [])
      .constant('NAVIGATION_MODES', {
        FREE_CAMERA: 'FreeCamera',
        GHOST: 'Ghost',
        HUMAN_BODY: 'HumanBody'
      })
      .factory('userNavigationService', [
        'NAVIGATION_MODES',
        'gz3d',
        'hbpIdentityUserDirectory',
        function (NAVIGATION_MODES, gz3d, hbpIdentityUserDirectory) {
          return {

            navigationMode: undefined,
            avatarObject: undefined,
            avatarObjectName: undefined,
            avatarNameBase: 'user_avatar',
            avatarInitialized: false,
            avatarModelPathWithCollision: 'user_avatar_basic',
            avatarModelPathNoCollision: 'user_avatar_basic_no-collision',
            userCamera: undefined,
            defaultPosition: undefined,
            defaultLookAt: undefined,
            userID: undefined,
            userDisplayName: undefined,

            init: function() {

              this.navigationMode = undefined;

              this.userCamera = gz3d.scene.viewManager.mainUserView.camera;
              if (!angular.isDefined(this.userCamera.parent)) {
                gz3d.scene.scene.add(this.userCamera);
              }

              // react to updates from gazebo server
              gz3d.iface.modelInfoTopic.subscribe(this.onModelInfo.bind(this));


              this.avatarObjectName = this.avatarNameBase;
              // get user info
              var that = this;
              hbpIdentityUserDirectory.getCurrentUser().then(function (profile) {
                that.setUserData(profile);
              });

              that.removeAvatar();

              // set up controls
              var domElementForKeyBindings = document.getElementsByTagName('body')[0];
              this.freeCameraControls = new THREE.FirstPersonControls(this.userCamera, gz3d.scene.container, domElementForKeyBindings);

              // start in free camera mode
              this.setModeFreeCamera();
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
                if (!found && node.name && node.name === that.avatarObjectName) {
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
              this.avatarControls = new THREE.AvatarControls(gz3d.scene, this.avatarObject, this.userCamera, gz3d.scene.container, domElementForKeyBindings);
              // set pose
              if (angular.isDefined(this.currentPosition) && angular.isDefined(this.currentDirection)) {
                // current position saved before
                var lookAt = this.currentPosition.clone().add(this.currentDirection.clone().multiplyScalar(100));
                this.avatarControls.applyPose(this.currentPosition, lookAt);
              } else {
                // no current position, default
                this.avatarControls.applyPose(this.defaultPosition, this.defaultLookAt);
              }

              switch (this.navigationMode) {
                case NAVIGATION_MODES.HUMAN_BODY:
                      // humans can't fly
                      this.avatarControls.lockVerticalMovement = true;
                      break;
              }

              // add camera to avatar object
              this.userCamera.parent = this.avatarObject;
              this.userCamera.position.set(0, this.avatarControls.avatarRadius, this.avatarControls.avatarEyeHeight);
              this.userCamera.updateMatrixWorld();

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
            },

            setModeHumanBody: function() {
              if (this.navigationMode === NAVIGATION_MODES.HUMAN_BODY) {
                return;
              }

              this.navigationMode = NAVIGATION_MODES.HUMAN_BODY;

              this.freeCameraControls.enabled = false;
              gz3d.scene.controls = undefined;

              this.saveCurrentPose();
              this.userCamera.parent = gz3d.scene.scene;

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
              this.userCamera.parent = gz3d.scene.scene;

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
