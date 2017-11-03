/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
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
 * ---LICENSE-END**/

(function() {
  'use strict';

  angular.module('clientLoggerModule').directive('logAdverts', [
    '$timeout',
    'clientLoggerService',
    'LOG_TYPE',
    ($timeout, clientLoggerService, LOG_TYPE) => {
      return {
        templateUrl:
          'components/client-logger/log-adverts/log-adverts.template.html',
        restrict: 'E',
        replace: true,
        scope: true,
        link: scope => {
          //message to be shown
          scope.currentAdvert = null;
          //if advert should be visible
          scope.showAdvert = null;

          let advertLogs$ = clientLoggerService.logs.filter(
            log => log.level === LOG_TYPE.ADVERTS
          );

          let showLogSubscription = advertLogs$
            .map(({ message }) => message)
            .subscribe(message => {
              scope.currentAdvert = message; //message to be shown
              scope.showAdvert = true; //show it
            });

          let hideLogSubscription = advertLogs$
            .debounce(log => Rx.Observable.timer(log.duration))
            .subscribe(() => (scope.showAdvert = false)); //hide it

          scope.$on('$destroy', () => {
            showLogSubscription.unsubscribe();
            hideLogSubscription.unsubscribe();
          });
        }
      };
    }
  ]);
})();
