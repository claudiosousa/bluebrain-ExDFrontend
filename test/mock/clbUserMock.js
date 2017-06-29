'use strict';
(function() {
  angular.module('clbUserMock', [])
    .service('clbUser', ['$q', function($q) {

      var currentUser = this.currentUser = {
        id: 'theUserID',
        displayName: 'theOwnerName'
      };

      this.getCurrentUser = jasmine.createSpy('clbUser')
        .and.callFake(function() {
          return $q.when(currentUser);
        });

      this.isGroupMember = jasmine.createSpy('isGroupMember');

      this.get = jasmine.createSpy('clbUser').and.callFake(function() {
        return $q.when({ userid: {} });
      });

      this.reset = function() {
        this.getCurrentUser.calls.reset();
        this.get.calls.reset();
      };
    }]);
}());
