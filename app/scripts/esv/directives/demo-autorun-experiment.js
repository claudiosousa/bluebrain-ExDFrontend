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

(function ()
{
    'use strict';
    angular.module('exdFrontendApp')
        .directive('demoAutorunExperiment', ['backendInterfaceService',
            'bbpConfig', '$timeout', '$window',
            'userContextService', '$location',
            'experimentsFactory', 'environmentService', 'STATE', 'stateService','simulationInfo',

            function (backendInterfaceService, bbpConfig, $timeout, $window, userContextService, $location, experimentsFactory, environmentService,
                STATE, stateService,simulationInfo)
            {
                return {
                    restrict: 'E',
                    templateUrl: 'views/esv/demo-waiting-message.html',
                    scope: true,
                    link: function (scope, element, attrs)
                    {
                        if (bbpConfig.get('demomode.demoCarousel', false) && !userContextService.demoModeLoadingNextPage)
                        {
                            scope.terminateProcessing = false;
                            scope.simulationIsDone = false;
                            scope.userContextService = userContextService;
                            scope.environmentService = environmentService;
                            scope.simulationInfo = simulationInfo;
                            scope.experimentsFactory = experimentsFactory;
                            scope.waitingForState = false;

                            scope.$on('$destroy', () =>
                            {
                                scope.terminateProcessing = true;

                                if (scope.experimentsService)
                                {
                                    scope.experimentsService.destroy();
                                    scope.experimentsService = undefined;
                                }
                            });

                            scope.process = () =>
                            {
                                var nextTimeToCheck = 500;

                                if (simulationInfo.simTimeoutText)
                                {
                                    nextTimeToCheck = 1000;
                                }

                                if (!scope.waitingForState)
                                {
                                    scope.waitingForState = true;
                                    stateService.getCurrentState().then(() =>
                                    {
                                        scope.simulationIsDone = stateService.currentState === STATE.STOPPED || stateService.currentState === STATE.FAILLED;
                                        scope.waitingForState = false;
                                    },
                                    () => { scope.waitingForState = false; });
                                }

                                if (scope.userContextService.isJoiningStoppedSimulation || scope.simulationIsDone)
                                {
                                    scope.userContextService.demoWaitingForNextSimulation = true;

                                    if (!scope.experimentsService)
                                    {
                                        scope.experimentsService = scope.experimentsFactory.createExperimentsService();
                                        scope.experimentsService.initialize();
                                        scope.experimentsService.experiments.then((experiments) =>
                                        {
                                            scope.experiments = experiments;
                                        });
                                    }

                                    if (scope.experiments)
                                    {
                                        for (let i = 0; i < scope.experiments.length; i++)
                                        {
                                            let exp = scope.experiments[i];
                                            if (exp.joinableServers.length > 0)
                                            {
                                                // One experiment is joinable

                                                let simul = exp.joinableServers[0];
                                                if (simul.runningSimulation.state === STATE.STARTED ||
                                                simul.runningSimulation.state === STATE.PAUSED)
                                                {
                                                    let path = 'esv-web/experiment-view/' + simul.server + '/' + exp.id + '/' + scope.environmentService.isPrivateExperiment() + "/" + simul.runningSimulation.simulationID;

                                                    if (scope.experimentsService)
                                                    {
                                                        scope.experimentsService.destroy();
                                                        scope.experimentsService = undefined;
                                                    }

                                                    scope.userContextService.demoModeLoadingNextPage = true;
                                                    $location.path(path);
                                                    $window.location.reload();
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }


                                if (!scope.terminateProcessing)
                                {
                                    $timeout(scope.process, nextTimeToCheck);
                                }
                            };

                            scope.process();

                        }
                    }
                };
            }
        ]);
} ());
