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
(function() {
  'use strict';

  angular
    .module('clusterReservation', [])
    .directive('clusterReservationAlert', [
      '$window',
      '$timeout',
      'nrpUser',
      ($window, $timeout, nrpUser) => {
        return {
          restrict: 'E',
          templateUrl:
            'components/alerts/cluster-reservation/cluster-reservation.template.html',
          scope: true,
          link: function(scope, element) {
            // Cluster reservation warning
            nrpUser
              .isMemberOfClusterReservationGroup()
              .then(
                response => (scope.displayClusterReservationForm = response)
              );

            scope.dismissReservationForm =
              $window.sessionStorage.getItem('reservationForm') === 'dismissed';

            scope.setClusterReservation = () =>
              $window.sessionStorage.setItem(
                'clusterReservation',
                scope.clusterReservationName
              );

            scope.dismissClusterReservationForm = () => {
              $timeout(() => {
                $window.sessionStorage.setItem('reservationForm', 'dismissed');
                scope.dismissReservationForm = true;
              });
            };
          }
        };
      }
    ]);
})();
