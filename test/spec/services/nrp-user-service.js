'use strict';

describe('Services: nrpUser', function () {
  var $rootScope, $q, nrpUser, initialForceuserValue, hbpIdentityUserDirectory;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('hbpIdentityUserDirectoryMock'));
  beforeEach(function () {
    initialForceuserValue = window.bbpConfig.localmode.forceuser;
  });

  afterEach(function () {
    window.bbpConfig.localmode.forceuser = initialForceuserValue;
  });

  beforeEach(inject(function (_$rootScope_, _$q_, $httpBackend, _nrpUser_, _hbpIdentityUserDirectory_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    nrpUser = _nrpUser_;
    hbpIdentityUserDirectory = _hbpIdentityUserDirectory_;
    hbpIdentityUserDirectory.reset();
    nrpUser.getCurrentUserInfo.cache.clear();
    nrpUser.getCurrentUser.cache.clear();
  }));

  it('should call hbpIdentityUserDirectory.getCurrentUser when not forcing user', function (done) {
    window.bbpConfig.localmode.forceuser = false;
    nrpUser.getCurrentUser().then(function(user) {
      expect(user.id).toBe('theUserID');
      expect(user.displayName).toBe('theOwnerName');
      done();
    });
    nrpUser.getCurrentUser();//second call should not increase underlying service call count due to memoization
    expect(hbpIdentityUserDirectory.getCurrentUser.calls.count()).toBe(1);
    $rootScope.$digest();
  });

  it('should return config ownerID when forcing config user', function (done) {
    window.bbpConfig.localmode.forceuser = true;
    expect(window.bbpConfig.localmode.ownerID).toBeDefined();
    nrpUser.getCurrentUser().then(function (user) {
      expect(user.id).toBe(window.bbpConfig.localmode.ownerID);
      done();
    });
    $rootScope.$digest();
    expect(hbpIdentityUserDirectory.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should call hbpIdentityUserDirectory.get when not forcing user', function () {
    window.bbpConfig.localmode.forceuser = false;
    nrpUser.getOwnerDisplayName('theOwnerName');
    nrpUser.getOwnerDisplayName('theOwnerName');//second call should not increase underlying service call count due to memoization
    $rootScope.$digest();
    expect(hbpIdentityUserDirectory.get).toHaveBeenCalledWith(['theOwnerName']);
    expect(hbpIdentityUserDirectory.get.calls.count()).toBe(1);
  });

  it('should return config ownerID when not forcing config user (getOwnerDisplayName)', function () {
    window.bbpConfig.localmode.forceuser = true;
    expect(window.bbpConfig.localmode.ownerID).toBeDefined();

    nrpUser.getOwnerDisplayName().then(function (owner) {
      expect(owner).toBe(window.bbpConfig.localmode.ownerID);
    });
    $rootScope.$digest();
    expect(hbpIdentityUserDirectory.get).not.toHaveBeenCalled();
  });

  it('should call hbpIdentityUserDirectory.getCurrentUser and hbpIdentityUserDirectory.isGroupMember when not forcing user', function () {
    window.bbpConfig.localmode.forceuser = false;
    nrpUser.getCurrentUserInfo();
    nrpUser.getCurrentUserInfo();//second call should not increase underlying service call count due to memoization
    $rootScope.$digest();
    expect(hbpIdentityUserDirectory.getCurrentUser.calls.count()).toBe(1);
    expect(hbpIdentityUserDirectory.isGroupMember.calls.count()).toBe(1);
  });

  it('should return config ownerID when not forcing config user (getCurrentUserInfo)', function () {
    window.bbpConfig.localmode.forceuser = true;
    expect(window.bbpConfig.localmode.ownerID).toBeDefined();

    nrpUser.getCurrentUserInfo().then(function (info) {
      expect(info).toEqual(
        {
            userID: window.bbpConfig.localmode.ownerID,
            hasEditRights: true,
            forceuser: true
        }
      );
    });
    $rootScope.$digest();
    expect(hbpIdentityUserDirectory.get).not.toHaveBeenCalled();
  });

  it('should call hbpIdentityUserDirectory.isGroupMember whith the correct argument', function () {
    nrpUser.isMemberOfClusterReservationGroup();
    expect(hbpIdentityUserDirectory.isGroupMember).toHaveBeenCalledWith('hbp-sp10-cluster-reservation');
  });

  it('should call hbpIdentityUserDirectory.isGroupMember whith the correct argument', function () {
    var sessionStorageKey = 'clusterReservation';
    spyOn(window.sessionStorage, 'getItem').and.returnValue(sessionStorageKey);
    expect(nrpUser.getReservation()).toBe('clusterReservation');
    expect(window.sessionStorage.getItem).toHaveBeenCalledWith(sessionStorageKey);
  });

});
