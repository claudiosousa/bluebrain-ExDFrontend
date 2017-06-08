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

    angular.module('clientLoggerModule')
        .directive('logAdverts', ['$timeout', 'clientLoggerService', ($timeout, clientLoggerService) => {

            const LOG_LEVEL_ADVERTS = 2;

            return {
                templateUrl: 'components/client-logger/log-adverts/log-adverts.template.html',
                restrict: 'E',
                replace: true,
                scope: true,
                link: scope => {

                    //message to be shown
                    scope.currentAdvert = null;
                    //if advert should be visible
                    scope.showAdvert = null;

                    let advertLogs$ = clientLoggerService.logs
                        .filter(log => log.level === LOG_LEVEL_ADVERTS);

                    let showLogSubscription = advertLogs$
                        .map(({ message }) => message)
                        .subscribe(message => {
                            scope.currentAdvert = message; //message to be shown
                            scope.showAdvert = true; //show it
                        });

                    let hideLogSubscription = advertLogs$
                        .debounce(log => Rx.Observable.timer(log.duration))
                        .subscribe(message => scope.showAdvert = false); //hide it

                    scope.$on('$destroy', () => {
                        showLogSubscription.unsubscribe();
                        hideLogSubscription.unsubscribe();
                    });
                }
            };
        }]);
}());
