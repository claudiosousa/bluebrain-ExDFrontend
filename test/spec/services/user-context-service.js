
'use strict';

describe('Services: userContextService', function () {

  var userContextService;

  var $rootScope, $scope, $window, $q;
  var userNavigationService, collabExperimentLockService, simulationInfo, bbpConfig, hbpIdentityUserDirectory,
    environmentService;

  var remoteProfileMock, lockServiceMock, cancelLockServiceMock;

  beforeEach(function() {
    module('userContextModule');
    module('exdFrontendApp');
  });

  // provide mock objects
  beforeEach(module(function ($provide) {
    // userNavigationService
    var userNavigationServiceMock = {
      isUserAvatar: jasmine.createSpy('isUserAvatar').and.callFake(function(entity) {
        if (entity.name === 'user_avatar') {
          return true;
        } else {
          return false;
        }
      })
    };
    $provide.value('userNavigationService', userNavigationServiceMock);

    // collabExperimentLockService
    cancelLockServiceMock = jasmine.createSpy('cancelLockServiceMock');
    lockServiceMock = {
      onLockChanged: jasmine.createSpy('onLockChanged').and.returnValue(cancelLockServiceMock),
      releaseLock: jasmine.createSpy('releaseLock').and.returnValue({
        catch: jasmine.createSpy('catch')
      })
    };

    var collabExperimentLockServiceMock = {
      createLockServiceForContext: jasmine.createSpy('createLockServiceForContext').and.returnValue(lockServiceMock)
    };
    $provide.value('collabExperimentLockService', collabExperimentLockServiceMock);

    // simulationInfo
    var simulationInfoMock = {
      isCollabExperiment: false,
      contextID: 'context_id'
    };
    $provide.value('simulationInfo', simulationInfoMock);

    // bbpConfig
    $provide.value('bbpConfig', window.bbpConfig);

    // hbpIdentityUserDirectory
    remoteProfileMock = {
      id: 'remote_user_id'
    };

    var hbpIdentityUserDirectoryMock = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
        then: jasmine.createSpy('then').and.callFake(function(fn) {
          fn(remoteProfileMock);
        })
      })
    };
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectoryMock);
  }));

  // inject dependencies
  beforeEach(function () {
    inject(function (_$rootScope_, _$window_, _$q_, _userContextService_, _userNavigationService_,
                     _collabExperimentLockService_, _simulationInfo_, _bbpConfig_, _hbpIdentityUserDirectory_,
                     _environmentService_)
    {
      userContextService = _userContextService_;

      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $window = _$window_;
      $q = _$q_;
      userNavigationService = _userNavigationService_;
      collabExperimentLockService = _collabExperimentLockService_;
      simulationInfo = _simulationInfo_;
      bbpConfig = _bbpConfig_;
      hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
      environmentService = _environmentService_;
    });
  });

  it(' - init() - userID, ownerID and isOwner()', function () {
    expect(userContextService.isOwner()).toBe(false);

    userContextService.userID = 'user_id';
    userContextService.ownerID = 'owner_id';
    expect(userContextService.isOwner()).toBe(false);

    userContextService.userID = 'owner_id';
    expect(userContextService.isOwner()).toBe(true);
  });

  it(' - onLockChangedCallback()', function () {
    spyOn(userContextService, 'setEditDisabled').and.callThrough();
    spyOn(userContextService, 'setLockDateAndUser').and.callThrough();

    var lockChangeEvent = {
      locked: true,
      lockInfo: {
        user: {
          id: userContextService.userID
        }
      }
    };

    userContextService.onLockChangedCallback(lockChangeEvent);
    expect(userContextService.setEditDisabled).toHaveBeenCalledWith(false);

    lockChangeEvent.lockInfo.user.id = 'not_the_user_id';
    userContextService.onLockChangedCallback(lockChangeEvent);
    expect(userContextService.setLockDateAndUser).toHaveBeenCalledWith(lockChangeEvent.lockInfo);

    lockChangeEvent.locked = false;
    userContextService.onLockChangedCallback(lockChangeEvent);
    expect(userContextService.setEditDisabled).toHaveBeenCalledWith(lockChangeEvent.locked);
  });

  it(' - hasEditRights()', function () {
    var avatarMock = {
      name: 'not_user_avatar'
    };

    userContextService.userID = userContextService.ownerID = 'owner';
    expect(userContextService.hasEditRights(avatarMock)).toBe(true);

    userContextService.userID = 'not_owner';
    expect(userContextService.hasEditRights(avatarMock)).toBe(false);

    avatarMock.name = 'user_avatar';
    expect(userContextService.hasEditRights(avatarMock)).toBe(true);
  });

  it(' - setLockDateAndUser()', function () {
    var lockInfoMock = {
      user: {
        displayName: 'display_name',
        id: 'id'
      },
      date: 'date'
    };

    userContextService.setLockDateAndUser(lockInfoMock);
    expect(userContextService.userEditing).toBe(lockInfoMock.user.displayName);
    expect(userContextService.userEditingID).toBe(lockInfoMock.user.id);
    expect(userContextService.timeEditStarted).toBe(moment(new Date(lockInfoMock.date)).fromNow());
  });

  it(' - setEditDisabled()', function () {
    userContextService.setEditDisabled(false);
    expect(userContextService.editIsDisabled).toBe(false);

    userContextService.setEditDisabled(true);
    expect(userContextService.editIsDisabled).toBe(true);
  });

  describe('local mode', function () {
    beforeEach(function() {
      window.bbpConfig.localmode.forceuser = true;

      userContextService.init();
    });

    it(' - after init()', function () {
      expect(userContextService.userID).toBe(window.bbpConfig.localmode.ownerID);
      expect(userContextService.ownerID).toBe(window.bbpConfig.localmode.ownerID);
      expect(userContextService.isInitialized).toBe(true);
    });
  });

  describe('remote collab mode', function () {
    beforeEach(function() {
      window.bbpConfig.localmode.forceuser = false;
      simulationInfo.isCollabExperiment = true;
      environmentService.setPrivateExperiment(true);
      userContextService.init();
    });

    it(' - after init()', function () {
      expect(hbpIdentityUserDirectory.getCurrentUser).toHaveBeenCalled();
      expect(hbpIdentityUserDirectory.getCurrentUser().then).toHaveBeenCalled();
      expect(userContextService.userID).toBe(remoteProfileMock.id);

      expect(collabExperimentLockService.createLockServiceForContext).toHaveBeenCalledWith(simulationInfo.contextID);
      expect(userContextService.lockService).toBe(lockServiceMock);
      expect(userContextService.cancelLockSubscription).toBe(cancelLockServiceMock);
      expect(lockServiceMock.onLockChanged).toHaveBeenCalledWith(userContextService.onLockChangedCallback);
      expect(userContextService.cancelLockSubscription).toBe(cancelLockServiceMock);
      expect(userContextService.isInitialized).toBe(true);
    });

    it(' - deinit()', function () {
      spyOn(userContextService, 'removeEditLock').and.callThrough();

      userContextService.deinit();

      expect(cancelLockServiceMock).toHaveBeenCalled();
      expect(userContextService.removeEditLock).toHaveBeenCalledWith(true);
    });
  });


});
