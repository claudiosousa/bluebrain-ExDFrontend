(function () {
  'use strict';

  angular.module('nrpUser', ['bbpConfig']).service('nrpUser', ['$q', 'hbpIdentityUserDirectory', 'bbpConfig',
    function ($q, hbpIdentityUserDirectory, bbpConfig) {
      var forceuser, ownerID;
      var loadConfig = _.once(function () {
        forceuser = bbpConfig.get('localmode.forceuser', false),
          ownerID = bbpConfig.get('localmode.ownerID', null);
      });

      this.getCurrentUser = function () {
        loadConfig();
        return forceuser ? $q.when({ displayName: ownerID, id: ownerID }) : hbpIdentityUserDirectory.getCurrentUser();
      };

    }]);
} ());
