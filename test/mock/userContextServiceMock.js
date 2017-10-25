(function() {
  'use strict';

  angular
    .module('userContextServiceMock', [])
    .service('userContextService', function() {
      this.isInitialized = false;
      this.isJoiningStoppedSimulation = false;
      this.userEditingID = '';
      this.userEditing = '';
      this.timeEditStarted = '';
      this.editIsDisabled = false;
      this.ownerID = 'Some owner id';
      this.init = jasmine.createSpy('init');
      this.deinit = jasmine.createSpy('deinit');
      this.isOwner = jasmine.createSpy('isOwner').and.returnValue(true);
      this.removeEditLock = jasmine.createSpy('removeEditLock');
      this.hasEditRights = jasmine.createSpy('hasEditRights');
      this.setEditDisabled = jasmine.createSpy('setEditDisabled');
      this.setLockDateAndUser = jasmine
        .createSpy('setLockDateAndUser')
        .and.callFake(function(lockInfo) {
          this.userEditing = lockInfo.user.displayName;
          this.userEditingID = lockInfo.user.id;
          this.timeEditStarted = moment(new Date(lockInfo.date)).fromNow();
        });
    });
})();
