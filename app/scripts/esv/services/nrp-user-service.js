(function () {
  'use strict';

  angular.module('nrpUser', ['bbpConfig']).service('nrpUser', ['$window', '$q', 'hbpIdentityUserDirectory', 'bbpConfig',
    function ($window, $q, hbpIdentityUserDirectory, bbpConfig) {
      var forceuser, ownerID;
      var loadConfig = _.once(function () {
        forceuser = bbpConfig.get('localmode.forceuser', false),
          ownerID = bbpConfig.get('localmode.ownerID', null);
      });

      this.getCurrentUser = function () {
        loadConfig();
        return forceuser ? $q.when({ displayName: ownerID, id: ownerID }) : hbpIdentityUserDirectory.getCurrentUser();
      };

      this.getReservation = function() {
        return $window.sessionStorage.getItem('clusterReservation');
      };

      this.isMemberOfClusterReservationGroup = function() {
        return hbpIdentityUserDirectory.isGroupMember('hbp-sp10-cluster-reservation');
      };

    }]);
} ());
