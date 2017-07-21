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
  angular.module('exdFrontendApp')
    .controller('esvExperimentsCtrl', [
      '$scope',
      '$location',
      '$stateParams',
      'experimentsFactory',
      'collabConfigService',
      '$window',
      'nrpUser',
      'environmentService',
      function(
        $scope,
        $location,
        $stateParams,
        experimentsFactory,
        collabConfigService,
        $window,
        nrpUser,
        environmentService) {

        $scope.pageState = {};
        $scope.isCollabExperiment = environmentService.isPrivateExperiment();

        $scope.config = {
          loadingMessage: 'Loading list of experiments...',
          canLaunchExperiments: true,
          canCloneExperiments: false
        };

        $scope.cloneExperiment = function(experimentID) {
          $scope.isCloneRequested = true;
          collabConfigService.clone({ contextID: $stateParams.ctx }, { experimentID: experimentID }, function() {
            try {
              $window.document.getElementById('clb-iframe-workspace').contentWindow.parent.postMessage({ eventName: 'location', data: { url: window.location.href.split("?")[0] } }, '*');
            } catch (err) {
              //not in using collab website, do nothing
            }
            $window.location.reload();
          });
        };

        $scope.canStopSimulation = function(simul) {
          return $scope.userinfo && $scope.userinfo.hasEditRights &&
            ($scope.userinfo.userID === simul.runningSimulation.owner || $scope.userinfo.forceuser);
        };

        var loadExperiments = function(ctx, experimentId, experimentFolderUUID) {
          var experimentsService = $scope.experimentsService = experimentsFactory.createExperimentsService(ctx, experimentId, experimentFolderUUID);
          experimentsService.initialize();
          experimentsService.experiments.then(function(experiments) {
            $scope.experiments = experiments;
            if (experiments.length === 1) {
              $scope.pageState.selected = experiments[0].id;
            }
          });
          experimentsService.clusterAvailability.then(function(clusterAvailability) {
            $scope.clusterAvailability = clusterAvailability;
          });
          nrpUser.getCurrentUserInfo().then(function(userinfo) { $scope.userinfo = userinfo; });

          $scope.selectExperiment = function(experiment) {
            if ($scope.pageState.startingExperiment) {
              return;
            }
            if (experiment.id !== $scope.pageState.selected) {
              $scope.pageState.selected = experiment.id;
              $scope.pageState.showJoin = false;
            }
          };

          $scope.startNewExperiment = function(experiment, launchSingleMode) {
            $scope.pageState.startingExperiment = experiment.id;
            experimentsService.startExperiment(experiment, launchSingleMode, nrpUser.getReservation())
              .then(function(path) { $location.path(path); },// succeeded
              function() { $scope.pageState.startingExperiment = null; },// failed
              function(msg) { $scope.progressMessage = msg; }); //in progress
          };

          // Stop an already initialized or running experiment
          $scope.stopSimulation = function(simulation, experiment) {
            experimentsService.stopExperiment(simulation, experiment);
          };

          $scope.joinExperiment = function(simul, exp) {
            var path = 'esv-web/experiment-view/' + simul.server + '/' + exp.id + '/' + environmentService.isPrivateExperiment() + "/" + simul.runningSimulation.simulationID;
            $location.path(path);
          };

          $scope.$on('$destroy', function() {
            experimentsService.destroy();
          });
        };

        function loadCollabExperiments() {
          var ctx = $stateParams.ctx;
          collabConfigService.get({ contextID: ctx },
            function(response) {
              if (response.experimentID) { //there is a cloned experiment
                $scope.config.loadingMessage = 'Loading experiment description...';
              } else {
                $scope.config.canCloneExperiments = true;
                $scope.config.canLaunchExperiments = false;
              }
              loadExperiments(ctx, response.experimentID, response.experimentFolderUUID);
            },
            function(data) {
              $scope.experiments = [{
                error: {
                  name: 'Internal Error',
                  description: 'Database unavailable'
                }
              }];
            });
        }

        if (!environmentService.isPrivateExperiment()) {
          loadExperiments();
        } else {
          loadCollabExperiments();
        }
      }
    ]);
})();
