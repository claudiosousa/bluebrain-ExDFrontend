(function() {
  'use strict';

  angular.module('hbpIdentityUserDirectoryMock', [])
    .service('hbpIdentityUserDirectory', ['$q', function($q) {
      this.getCurrentUser = jasmine.createSpy('getCurrentUser').and
        .returnValue($q.when({ id: 'theUserID', displayName: 'theOwnerName' }));
      this.get = jasmine.createSpy('get').and.returnValue($q.when({ theOwnerName: 'theReturnedOwnerName', userid: 'theUserID' }));

      this.isGroupMember = jasmine.createSpy('isGroupMember').and
        .returnValue($q.when(true));

      var that = this;
      this.reset = function() {
        that.getCurrentUser.calls.reset();
        that.get.calls.reset();
        that.isGroupMember.calls.reset();
      };

    }]);
}());
