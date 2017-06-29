/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/
(function () {
  'use strict';

  angular.module('nrpUser', ['bbpConfig']).service('nrpUser', ['$window', '$q', 'clbUser', 'bbpConfig',
    function ($window, $q, clbUser, bbpConfig) {
      var forceuser, ownerID;
      var loadConfig = () => {
        forceuser = bbpConfig.get('localmode.forceuser', false),
          ownerID = bbpConfig.get('localmode.ownerID', null);
      };

      var getCurrentUser = function () {
        loadConfig();
        return forceuser ? $q.when({ displayName: ownerID, id: ownerID }) : clbUser.getCurrentUser();
      };

      var getReservation = function() {
        return $window.sessionStorage.getItem('clusterReservation');
      };

      var isMemberOfClusterReservationGroup = function() {
        return clbUser.isGroupMember('hbp-sp10-cluster-reservation');
      };

      var getOwnerName = function(owner) {
        loadConfig();
        if (forceuser) {
          return $q.when(ownerID);
        }
        return clbUser.get([owner]).then(function (profile) {
          return (profile[owner] && profile[owner].displayName) || 'Unkwown';
        });
      };

      var getCurrentUserInfo = function() {
        loadConfig();
        if (forceuser) {
          return $q.when({
            userID: ownerID,
            hasEditRights: true,
            forceuser: true
          });
        }
        return $q.all([
          clbUser.getCurrentUser(),
          clbUser.isGroupMember('hbp-sp10-user-edit-rights')
        ]).then(function (userInfo) {
          return {
            userID: userInfo[0].id,
            hasEditRights: userInfo[1],
            forceuser: false
          };
        });
      };
      return {
        getCurrentUser: _.memoize(getCurrentUser),
        getReservation: getReservation,
        isMemberOfClusterReservationGroup: _.memoize(isMemberOfClusterReservationGroup),
        getOwnerDisplayName: _.memoize(getOwnerName),
        getCurrentUserInfo: _.memoize(getCurrentUserInfo)
      };

    }]);
} ());
