'use strict';

describe('Services: nrpUser', function() {
    var $rootScope, nrpUser, initialForceuserValue, clbUser;

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));
    beforeEach(module('clbUserMock'));

    beforeEach(function() {
        initialForceuserValue = window.bbpConfig.localmode.forceuser;
    });

    afterEach(function() {
        window.bbpConfig.localmode.forceuser = initialForceuserValue;
    });

    beforeEach(inject(function(_$rootScope_, $httpBackend, _nrpUser_, _clbUser_) {
        $rootScope = _$rootScope_;
        nrpUser = _nrpUser_;
        clbUser = _clbUser_;

        clbUser.reset();
        nrpUser.getCurrentUserInfo.cache.clear();
        nrpUser.getCurrentUser.cache.clear();
    }));

    it('should call clbUser.getCurrentUser when not forcing user', function(done) {
        window.bbpConfig.localmode.forceuser = false;
        nrpUser.getCurrentUser().then(function(user) {
            expect(user.id).toBe('theUserID');
            expect(user.displayName).toBe('theOwnerName');
            done();
        });
        nrpUser.getCurrentUser();//second call should not increase underlying service call count due to memoization
        expect(clbUser.getCurrentUser.calls.count()).toBe(1);
        $rootScope.$digest();
    });

    it('should return config ownerID when forcing config user', function(done) {
        window.bbpConfig.localmode.forceuser = true;
        expect(window.bbpConfig.localmode.ownerID).toBeDefined();
        nrpUser.getCurrentUser().then(function(user) {
            expect(user.id).toBe(window.bbpConfig.localmode.ownerID);
            expect(clbUser.getCurrentUser).not.toHaveBeenCalled();
            done();
        });
        expect(clbUser.getCurrentUser).not.toHaveBeenCalled();
        $rootScope.$digest();
    });

    it('should call clbUser.get when not forcing user', function() {
        window.bbpConfig.localmode.forceuser = false;
        nrpUser.getOwnerDisplayName('theOwnerName');
        nrpUser.getOwnerDisplayName('theOwnerName');//second call should not increase underlying service call count due to memoization
        $rootScope.$digest();
        expect(clbUser.get).toHaveBeenCalledWith(['theOwnerName']);
        expect(clbUser.get.calls.count()).toBe(1);
    });

    it('should return config ownerID when forcing config user (getOwnerDisplayName)', function() {
        window.bbpConfig.localmode.forceuser = true;
        expect(window.bbpConfig.localmode.ownerID).toBeDefined();

        nrpUser.getOwnerDisplayName().then(function(owner) {
            expect(owner).toBe(window.bbpConfig.localmode.ownerID);
        });
        $rootScope.$digest();
        expect(clbUser.get).not.toHaveBeenCalled();
    });

    it('should call clbUser.getCurrentUser and clbUser.isGroupMember when not forcing user', function() {
        window.bbpConfig.localmode.forceuser = false;
        clbUser.getCurrentUser.calls.reset();
        clbUser.isGroupMember.calls.reset();
        nrpUser.getCurrentUserInfo();
        nrpUser.getCurrentUserInfo();//second call should not increase underlying service call count due to memoization
        $rootScope.$digest();
        expect(clbUser.getCurrentUser.calls.count()).toBe(1);
        expect(clbUser.isGroupMember.calls.count()).toBe(1);
    });

    it('should return config ownerID when not forcing config user (getCurrentUserInfo)', function() {
        window.bbpConfig.localmode.forceuser = true;
        expect(window.bbpConfig.localmode.ownerID).toBeDefined();

        nrpUser.getCurrentUserInfo().then(function(info) {
            expect(info).toEqual(
                {
                    userID: window.bbpConfig.localmode.ownerID,
                    hasEditRights: true,
                    forceuser: true
                }
            );
        });
        $rootScope.$digest();
        expect(clbUser.get).not.toHaveBeenCalled();
    });

    it('should call clbUser.isGroupMember whith the correct argument', function() {
        nrpUser.isMemberOfClusterReservationGroup();
        expect(clbUser.isGroupMember).toHaveBeenCalledWith('hbp-sp10-cluster-reservation');
    });

    it('should call clbUser.isGroupMember whith the correct argument', function() {
        var sessionStorageKey = 'clusterReservation';
        spyOn(window.sessionStorage, 'getItem').and.returnValue(sessionStorageKey);
        expect(nrpUser.getReservation()).toBe('clusterReservation');
        expect(window.sessionStorage.getItem).toHaveBeenCalledWith(sessionStorageKey);
    });

});
