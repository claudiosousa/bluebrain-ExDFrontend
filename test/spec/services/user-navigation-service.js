/* global THREE: false */

'use strict';

describe('Services: userNavigationService', function () {

  var userNavigationService;
  var NAVIGATION_MODES;

  var gz3d, camera, avatar, avatarControls, firstPersonControls;
  var hbpIdentityUserDirectory, userProfile, hbpIdentityUserDirectoryPromise, simulationInfo, roslib;

  // provide mock objects
  beforeEach(module(function ($provide) {
    // gz3d mock
    var gz3dMock = {
      iface: {
        modelInfoTopic: {
          subscribe: jasmine.createSpy('subscribe')
        }
      },
      scene: {
        scene: new THREE.Scene(),
        viewManager: {
          mainUserView: {
            camera: new THREE.PerspectiveCamera()
          }
        },
        controls: {},
        emitter: {
          emit: jasmine.createSpy('emit')
        }
      },
      gui: {
        emitter: {
          emit: jasmine.createSpy('emit')
        }
      },
      container: {},
      controls: {}
    };
    $provide.value('gz3d', gz3dMock);
    $provide.value('camera', gz3dMock.scene.viewManager.mainUserView.camera);

    // avatar mocks
    var avatarMock = new THREE.Object3D();
    $provide.value('avatar', avatarMock);

    var avatarControlsMock = {
      enabled: false,
      avatar: null,
      avatarRadius: 0.15,
      avatarEyeHeight: 1.6,
      init: jasmine.createSpy('init'),
      createAvatarTopics: jasmine.createSpy('createAvatarTopics'),
      applyPose: jasmine.createSpy('applyPose'),
      setPose: jasmine.createSpy('setPose')
    };
    $provide.value('avatarControls', avatarControlsMock);

    // free camera mocks
    var firstPersonControlsMock = {
      enabled: false,
      domElement: {
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener')
      }
    };
    $provide.value('firstPersonControls', firstPersonControlsMock);

    // hbpIdentityUserDirectory mock
    var userProfileMock = {
      id: 'mock_id',
      displayName: 'mock_displayname'
    };
    $provide.value('userProfile', userProfileMock);

    var hbpIdentityUserDirectoryPromiseMock = {
      //then: jasmine.createSpy('then').andReturn({ then: jasmine.createSpy('then')})};
      then: jasmine.createSpy('then').andCallFake(function (callback) {
        //userNavigationService.setUserData(hbpIdentityUserDirectoryPromiseObject.userProfileMock);
        callback(userProfileMock);
      })
    };
    $provide.value('hbpIdentityUserDirectoryPromise', hbpIdentityUserDirectoryPromiseMock);

    var hbpIdentityUserDirectoryMock = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').andReturn(hbpIdentityUserDirectoryPromiseMock)
    };
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectoryMock);

    var simulationInfoMock = {
      serverConfig: {
        rosbridge: {
          websocket: 'mock_rosbridge_websocket_url'
        }
      }
    };
    $provide.value('simulationInfo', simulationInfoMock);

    var roslibMock = {};
    $provide.value('roslib', roslibMock);
  }));

  beforeEach(function () {
    module('userNavigationModule');

    // inject service for testing.
    inject(function (_userNavigationService_, _NAVIGATION_MODES_, _gz3d_, _camera_, _avatar_, _avatarControls_, _firstPersonControls_,
                     _userProfile_, _hbpIdentityUserDirectory_, _hbpIdentityUserDirectoryPromise_, _simulationInfo_, _roslib_) {
      userNavigationService = _userNavigationService_;
      NAVIGATION_MODES = _NAVIGATION_MODES_;
      gz3d = _gz3d_;
      hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;

      camera = _camera_;
      avatar = _avatar_;
      avatarControls = _avatarControls_;
      firstPersonControls = _firstPersonControls_;
      userProfile = _userProfile_;
      hbpIdentityUserDirectoryPromise = _hbpIdentityUserDirectoryPromise_;
      simulationInfo = _simulationInfo_;
      roslib = _roslib_;
    });

    spyOn(THREE, 'FirstPersonControls').andReturn(firstPersonControls);
    spyOn(THREE, 'AvatarControls').andReturn(avatarControls);

    spyOn(gz3d.scene.scene, 'add').andCallThrough();

    spyOn(camera.position, 'set').andCallThrough();
    spyOn(camera.position, 'copy').andCallThrough();
    spyOn(camera, 'lookAt').andCallThrough();
    spyOn(camera, 'updateMatrixWorld').andCallThrough();
    spyOn(camera, 'getWorldPosition').andCallThrough();
    spyOn(camera, 'getWorldDirection').andCallThrough();

    spyOn(userNavigationService, 'removeAvatar').andCallThrough();
    spyOn(userNavigationService, 'createAvatar').andCallThrough();
    spyOn(userNavigationService, 'setModeFreeCamera').andCallThrough();
    spyOn(userNavigationService, 'setUserData').andCallThrough();
    spyOn(userNavigationService, 'saveCurrentPose').andCallThrough();
  });


  it(' - init()', function () {
    // check initial values
    expect(userNavigationService.avatarNameBase).toBe('user_avatar');
    expect(userNavigationService.avatarInitialized).toBe(false);
    expect(userNavigationService.avatarModelPathWithCollision).toBe('user_avatar_basic');
    expect(userNavigationService.avatarModelPathNoCollision).toBe('user_avatar_basic_no-collision');

    userNavigationService.init();

    expect(userNavigationService.rosbridgeWebsocketUrl).toBe(simulationInfo.serverConfig.rosbridge.websocket);
    expect(userNavigationService.roslib).toBe(roslib);

    expect(userNavigationService.userCamera).toBe(camera);

    expect(gz3d.iface.modelInfoTopic.subscribe).toHaveBeenCalledWith(jasmine.any(Function));

    expect(hbpIdentityUserDirectory.getCurrentUser).toHaveBeenCalled();
    expect(hbpIdentityUserDirectoryPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
    expect(userNavigationService.setUserData).toHaveBeenCalledWith(userProfile);
    expect(userNavigationService.avatarObjectName).toBe(userNavigationService.avatarNameBase + '_' + userProfile.id);
    expect(userNavigationService.userDisplayName).toBe(userProfile.displayName);

    expect(userNavigationService.removeAvatar).toHaveBeenCalled();

    // check free camera control settings are set as default
    expect(userNavigationService.freeCameraControls).toBe(firstPersonControls);
    expect(THREE.FirstPersonControls).toHaveBeenCalledWith(userNavigationService.userCamera, gz3d.scene.container, jasmine.any(Object));
    expect(THREE.AvatarControls).toHaveBeenCalledWith(userNavigationService, gz3d, gz3d.scene.container, jasmine.any(Object));
    expect(userNavigationService.avatarControls).toBe(avatarControls);
    expect(userNavigationService.setModeFreeCamera).toHaveBeenCalled();
    expect(userNavigationService.navigationMode).toBe(NAVIGATION_MODES.FREE_CAMERA);
    expect(userNavigationService.freeCameraControls.enabled).toBe(true);
    expect(gz3d.scene.controls).toBe(userNavigationService.freeCameraControls);
  });

  it(' - deinit()', function () {
    spyOn(userNavigationService, 'getUserAvatar').andReturn(avatar);
    spyOn(gz3d.scene.scene, 'remove');

    userNavigationService.deinit();

    expect(userNavigationService.getUserAvatar).toHaveBeenCalled();
    expect(gz3d.gui.emitter.emit).toHaveBeenCalledWith('deleteEntity', avatar);
    expect(gz3d.scene.scene.remove).toHaveBeenCalledWith(avatar);
  });

  it(' - setUserData()', function () {
    userNavigationService.setUserData(userProfile);

    expect(userNavigationService.userID).toBe(userProfile.id);
    expect(userNavigationService.userDisplayName).toBe(userProfile.displayName);
    expect(userNavigationService.avatarObjectName).toBe(userNavigationService.avatarNameBase + '_' + userProfile.id);
  });

  it(' - onModelInfo()', function () {
    spyOn(userNavigationService, 'initAvatar');

    var avatarName = 'avatarMock';
    userNavigationService.avatarObjectName = avatarName;
    var modelMessageMock = {
      name: avatarName
    };

    userNavigationService.navigationMode = NAVIGATION_MODES.FREE_CAMERA;
    userNavigationService.onModelInfo({});
    expect(userNavigationService.initAvatar).not.toHaveBeenCalled();

    userNavigationService.onModelInfo(modelMessageMock);
    expect(userNavigationService.initAvatar).not.toHaveBeenCalled();

    userNavigationService.navigationMode = NAVIGATION_MODES.HUMAN_BODY;
    userNavigationService.onModelInfo(modelMessageMock);
    expect(userNavigationService.initAvatar).toHaveBeenCalled();
  });

  it(' - getUserAvatar()', function () {
    spyOn(gz3d.scene.scene, 'traverse').andCallThrough();

    // test for existing avatar
    var avatarName = 'avatarMock';
    userNavigationService.avatarObjectName = avatar.name = avatarName;
    gz3d.scene.scene.add(avatar);

    var returnedAvatar = userNavigationService.getUserAvatar();

    expect(returnedAvatar).toBe(avatar);

    // test for missing scene
    gz3d.scene = undefined;
    returnedAvatar = userNavigationService.getUserAvatar();
    expect(returnedAvatar).not.toBeDefined();
  });

  it(' - createAvatar()', function () {
    userNavigationService.userCamera = camera;
    userNavigationService.currentPosition = null;
    userNavigationService.defaultPosition = new THREE.Vector3();
    userNavigationService.defaultLookAt = new THREE.Vector3();
    userNavigationService.avatarControls = avatarControls;

    var hasCollision = false;
    userNavigationService.createAvatar(hasCollision);

    expect(userNavigationService.avatarControls.avatar).toBeDefined();
    expect(userNavigationService.avatarControls.setPose).toHaveBeenCalledWith(userNavigationService.defaultPosition, userNavigationService.defaultLookAt);
    expect(gz3d.gui.emitter.emit).toHaveBeenCalledWith('entityCreated', jasmine.any(Object), userNavigationService.avatarModelPathNoCollision);

    THREE.AvatarControls.reset();
    userNavigationService.currentPosition = new THREE.Vector3();
    userNavigationService.currentDirection = new THREE.Vector3();
    userNavigationService.currentLookAt = new THREE.Vector3();
    hasCollision = true;
    expect(angular.isDefined(userNavigationService.avatarControls)).toBe(true);

    userNavigationService.createAvatar(hasCollision);

    expect(THREE.AvatarControls).not.toHaveBeenCalled();
    expect(userNavigationService.avatarControls.setPose).toHaveBeenCalledWith(userNavigationService.currentPosition, userNavigationService.currentLookAt);
    expect(gz3d.gui.emitter.emit).toHaveBeenCalledWith('entityCreated', jasmine.any(Object), userNavigationService.avatarModelPathWithCollision);
  });

  it(' - initAvatar()', function () {
    spyOn(userNavigationService, 'getUserAvatar').andCallThrough();
    userNavigationService.freeCameraControls = firstPersonControls;
    userNavigationService.avatarControls = avatarControls;
    userNavigationService.navigationMode = NAVIGATION_MODES.HUMAN_BODY;

    // test for missing avatar
    userNavigationService.initAvatar();
    expect(userNavigationService.avatarInitialized).toBe(false);


    // test for existing avatar
    var avatarName = 'avatarMock';
    userNavigationService.avatarObjectName = avatar.name = avatarName;
    gz3d.scene.scene.add(avatar);
    userNavigationService.userCamera = camera;

    userNavigationService.initAvatar();

    expect(userNavigationService.getUserAvatar).toHaveBeenCalled();
    expect(userNavigationService.avatarObject).toBe(avatar);
    expect(userNavigationService.freeCameraControls.enabled).toBe(false);
    expect(avatarControls.init).toHaveBeenCalledWith(avatar, camera);
    expect(avatarControls.lockVerticalMovement).toBe(true);
    expect(gz3d.scene.controls).toBe(avatarControls);
    expect(avatarControls.enabled).toBe(true);
    expect(userNavigationService.avatarInitialized).toBe(true);
  });

  it(' - removeAvatar()', function () {
    spyOn(userNavigationService, 'getUserAvatar').andCallThrough();
    // add avatar
    var avatarName = 'avatarMock';
    userNavigationService.avatarObjectName = avatar.name = avatarName;
    gz3d.scene.scene.add(avatar);

    userNavigationService.removeAvatar();

    expect(userNavigationService.getUserAvatar).toHaveBeenCalled();
    expect(gz3d.gui.emitter.emit).toHaveBeenCalledWith('deleteEntity', avatar);
    expect(userNavigationService.avatarInitialized).toBe(false);
  });

  it(' - setDefaultPose()', function () {
    var mockPosition = new THREE.Vector3(1,2,3);
    var mockLookAt = new THREE.Vector3(4,5,6);

    userNavigationService.setDefaultPose(mockPosition.x, mockPosition.y, mockPosition.z, mockLookAt.x, mockLookAt.y, mockLookAt.z);

    expect(userNavigationService.defaultPosition.x).toBe(1);
    expect(userNavigationService.defaultPosition.y).toBe(2);
    expect(userNavigationService.defaultPosition.z).toBe(3);
    expect(userNavigationService.defaultLookAt.x).toBe(4);
    expect(userNavigationService.defaultLookAt.y).toBe(5);
    expect(userNavigationService.defaultLookAt.z).toBe(6);
  });

  it(' - saveCurrentPose()', function () {
    // test for missing camera
    userNavigationService.saveCurrentPose();
    expect(userNavigationService.currentPosition).not.toBeDefined();
    expect(userNavigationService.currentDirection).not.toBeDefined();

    var mockPosition = new THREE.Vector3(1,2,3);
    var mockLookAt = new THREE.Vector3(4,5,6);
    camera.position.copy(mockPosition);
    camera.lookAt(mockLookAt);
    camera.updateMatrixWorld();
    var cameraWorldPosition = camera.getWorldPosition();
    var cameraWorldDirection = camera.getWorldDirection();
    camera.updateMatrixWorld.reset();
    camera.getWorldPosition.reset();
    camera.getWorldDirection.reset();

    userNavigationService.userCamera = camera;
    userNavigationService.saveCurrentPose();

    expect(camera.updateMatrixWorld).toHaveBeenCalled();
    expect(camera.getWorldPosition).toHaveBeenCalled();
    expect(camera.getWorldDirection).toHaveBeenCalled();
    expect(userNavigationService.currentPosition.x).toBe(cameraWorldPosition.x);
    expect(userNavigationService.currentPosition.y).toBe(cameraWorldPosition.y);
    expect(userNavigationService.currentPosition.z).toBe(cameraWorldPosition.z);
    expect(userNavigationService.currentDirection.x).toBe(cameraWorldDirection.x);
    expect(userNavigationService.currentDirection.y).toBe(cameraWorldDirection.y);
    expect(userNavigationService.currentDirection.z).toBe(cameraWorldDirection.z);
  });

  it(' - setModeHumanBody()', function () {
    // test for already in HUMAN_BODY mode
    userNavigationService.navigationMode = NAVIGATION_MODES.HUMAN_BODY;

    userNavigationService.setModeHumanBody();

    expect(userNavigationService.removeAvatar).not.toHaveBeenCalled();
    expect(userNavigationService.createAvatar).not.toHaveBeenCalled();

    // test for switching modes
    userNavigationService.navigationMode = NAVIGATION_MODES.FREE_CAMERA;
    userNavigationService.freeCameraControls = firstPersonControls;
    userNavigationService.avatarControls = avatarControls;
    userNavigationService.userCamera = camera;

    userNavigationService.setModeHumanBody();

    expect(userNavigationService.saveCurrentPose).toHaveBeenCalled();
    expect(gz3d.scene.scene.add).toHaveBeenCalledWith(camera);
    expect(camera.parent).toBe(gz3d.scene.scene);
    expect(userNavigationService.navigationMode).toBe(NAVIGATION_MODES.HUMAN_BODY);
    expect(userNavigationService.freeCameraControls.enabled).toBe(false);
    expect(gz3d.scene.controls).not.toBeDefined();
    expect(userNavigationService.removeAvatar).toHaveBeenCalled();
    expect(userNavigationService.createAvatar).toHaveBeenCalledWith(true);
  });

  it(' - setModeFreeCamera()', function () {
    // test for already in FREE_CAMERA mode
    userNavigationService.navigationMode = NAVIGATION_MODES.FREE_CAMERA;

    userNavigationService.setModeFreeCamera();

    expect(userNavigationService.saveCurrentPose).not.toHaveBeenCalled();
    expect(userNavigationService.removeAvatar).not.toHaveBeenCalled();

    // test for switching modes
    userNavigationService.freeCameraControls = firstPersonControls;
    userNavigationService.userCamera = camera;
    userNavigationService.navigationMode = NAVIGATION_MODES.HUMAN_BODY;
    var positionMock = new THREE.Vector3(1, 2, 3);
    userNavigationService.currentPosition = positionMock;
    var directionMock =  new THREE.Vector3(4, 5, 6);
    userNavigationService.currentDirection = directionMock;

    userNavigationService.setModeFreeCamera();

    expect(userNavigationService.navigationMode).toBe(NAVIGATION_MODES.FREE_CAMERA);
    expect(userNavigationService.saveCurrentPose).toHaveBeenCalled();
    expect(camera.parent).toBe(gz3d.scene.scene);
    expect(userNavigationService.removeAvatar).toHaveBeenCalled();
    expect(camera.position.copy).toHaveBeenCalled();
    expect(camera.updateMatrixWorld).toHaveBeenCalled();
    expect(camera.lookAt).toHaveBeenCalled();

    expect(userNavigationService.freeCameraControls.enabled).toBe(true);
    expect(gz3d.scene.controls).toBe(firstPersonControls);
  });
});
