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
  angular.module('exdFrontendApp')
    .controller('esvExperimentsCtrl', [
      '$scope',
      '$location',
      '$stateParams',
      'STATE',
      'experimentsFactory',
      'collabConfigService',
      '$window',
      'CLUSTER_THRESHOLDS',
      'clbErrorDialog',
      'collabFolderAPIService',
      'collabExperimentLockService',
      'nrpUser',
      '$timeout',
      'environmentService',
      'experimentProxyService',
      'nrpBackendVersions',
      'nrpFrontendVersion',
      'userContextService',
      function (
        $scope,
        $location,
        $stateParams,
        STATE,
        experimentsFactory,
        collabConfigService,
        $window,
        CLUSTER_THRESHOLDS,
        clbErrorDialog,
        collabFolderAPIService,
        collabExperimentLockService,
        nrpUser,
        $timeout,
        environmentService,
        experimentProxyService,
        nrpBackendVersions,
        nrpFrontendVersion,
        userContextService
      ) {
        $scope.isCollapsed = true;
        $scope.versionString = "Show versions";
        $scope.softwareVersions = "";
        $scope.STATE = STATE;
        $scope.CLUSTER_THRESHOLDS = CLUSTER_THRESHOLDS;
        $scope.pageState = {};
        $scope.isCollabExperiment = environmentService.isPrivateExperiment();
        $scope.isSavingToCollab = false;
        $scope.formInfo ={};
        $scope.descID = "descID";
        $scope.nameID = "nameID";
        $scope.editing = {};
        $scope.editing[$scope.descID]= false;
        $scope.editing[$scope.nameID]= false;
        var editLockEntity;
        let lockService;
        if (environmentService.isPrivateExperiment() && userContextService.isOwner()){
          lockService = collabExperimentLockService.createLockServiceForContext($stateParams.ctx);
        }
        $scope.config = {
          loadingMessage: 'Loading list of experiments...',
          canLaunchExperiments: true,
          canCloneExperiments: false
        };

       $scope.cloneExperiment = function (experimentID) {
          $scope.isCloneRequested = true;
          collabConfigService.clone({ contextID: $stateParams.ctx }, { experimentID: experimentID }, function () {
           try {
             $window.document.getElementById('clb-iframe-workspace').contentWindow.parent.postMessage({eventName: 'location', data: {url: window.location.href.split("?")[0]}}, '*');
          } catch(err){
            //not in using collab website, do nothing
          }
            $window.location.reload();
          });
        };

        $scope.canStopSimulation = function (simul) {
          return $scope.userinfo && $scope.userinfo.hasEditRights &&
            ($scope.userinfo.userID === simul.runningSimulation.owner || $scope.userinfo.forceuser);
        };

        var loadExperiments = function (ctx, experimentId, experimentFolderUUID) {
          var experimentsService = experimentsFactory.createExperimentsService(ctx, experimentId, experimentFolderUUID);
          experimentsService.initialize();
          experimentsService.experiments.then(function (experiments) {
            $scope.experiments = experiments;
            if (experiments.length === 1) {
              $scope.formInfo.name = experiments[0].configuration.name;
              $scope.formInfo.desc = experiments[0].configuration.description;
              $scope.pageState.selected = experiments[0].id;
            }
          });
          experimentsService.clusterAvailability.then(function (clusterAvailability) {
            $scope.clusterAvailability = clusterAvailability; });
          nrpUser.getCurrentUserInfo().then(function (userinfo) { $scope.userinfo = userinfo; });

          $scope.selectExperiment = function (experiment) {
            if ($scope.pageState.startingExperiment) {
              return;
            }
            if (experiment.id !== $scope.pageState.selected) {
              $scope.setCollapsed(true);
              $scope.pageState.selected = experiment.id;
              $scope.pageState.showJoin = false;
            }
          };

          $scope.editExperiment = function(elementID) {
            if (lockService) {
              $scope.loadingEdit = true;
              lockService.tryAddLock()
                .then(function(result) {
                  if (!result.success && result.lock && result.lock.lockInfo.user.id !== $scope.userinfo.userID) {
                    // save uuid
                    editLockEntity = result.lock.lockInfo.entity;
                    clbErrorDialog.open({
                      type: "AlreadyEditingError",
                      message: "Sorry you cannot edit at this time. Only one user can edit at a time and " + result.lock.lockInfo.user.displayName + " started editing " + moment(new Date(result.lock.lockInfo.date)).fromNow() + ". Please try again later."
                    });
                  }
                  else {
                    $scope.loadingEdit = false;
                    $scope.editing[elementID] = true;
                    $timeout(function(){
                      $window.document.getElementById(elementID).focus();
                    },0);
                  }
                })
                .catch(function(){
                  clbErrorDialog.open({
                    type: "CollabError",
                    message: "There was an error in opening the edit feature, please try again later."
                  });
                })
                .finally(function(){
                  $scope.loadingEdit = false;
                });
            }
          };

          $scope.stopEditingExperimentDetails = function(editingKey){
            lockService && lockService.releaseLock(editLockEntity)
              .catch(function () {
                clbErrorDialog.open({
                  type: "CollabError",
                  message: "The edit lock could not be released. Please remove it manually from the Storage area."
                });
              });
            $scope.formInfo.name = $scope.experiments[0].configuration.name;
            $scope.formInfo.desc = $scope.experiments[0].configuration.description;
            $scope.editing[editingKey] = false;
          };
          var shouldSave = function(input, originalValue, editingKey){
            if (!input || input.trim().length === 0){
              clbErrorDialog.open({
                type: "InputError",
                message: "Name/Description of an experiment cannot be empty."
              });
              return false;
            }
            if ($scope.containsTags(input)){
              clbErrorDialog.open({
                type: "InputError",
                message: "Name/Description of an experiment cannot contain an HTML tag."
              });
              return false;
            }
            if (input === originalValue){
              $scope.isSavingToCollab = false;
              $scope.stopEditingExperimentDetails(editingKey);
              return false;
            }
            return true;
          };

          $scope.saveExperimentDetails = function(newDetails, editingKey){
            var experiment = $scope.experiments[0];
            var originalValue = editingKey === $scope.nameID ? experiment.configuration.name: experiment.configuration.description;
            if (!shouldSave(newDetails, originalValue, editingKey)){
              return;
            }
            $scope.isSavingToCollab = true;
            var experimentFile = experimentsService.getCollabExperimentFile();

            if (!experimentFile || !experimentFile[0]){
              clbErrorDialog.open({
                type: "Error",
                message: "Something went wrong when retrieving the experiment_configuration.exc file from the collab storage. Please check the file exists and is not empty."
              });
              $scope.isSavingToCollab = false;
              return;
            }
            var xml = experimentFile[0];
            xml = xml.replace(originalValue, newDetails);
            collabFolderAPIService.uploadEntity(xml, experimentFile[1]).then(function(response){
              $scope.isSavingToCollab = false;

              if (editingKey === $scope.nameID){
                experiment.configuration.name = newDetails;
               }
               else {
                 experiment.configuration.description = newDetails;
               }
               $scope.stopEditingExperimentDetails(editingKey);
            }, function(){
              $scope.isSavingToCollab = false;
              clbErrorDialog.open({
                type: "CollabSaveError",
                message: "Error while saving updated experiment details to Collab storage."
              });
            });
          };
          $scope.containsTags = function(input){
            var div = document.createElement("div");
            div.innerHTML = input;
            return div.innerText !== input;
          };

          $scope.startNewExperiment = function (experiment, launchSingleMode) {
            $scope.pageState.startingExperiment = experiment.id;
            experimentsService.startExperiment(experiment, launchSingleMode, nrpUser.getReservation())
              .then(function (path) { $location.path(path); },// succeeded
              function () { $scope.pageState.startingExperiment = null; },// failed
              function (msg) { $scope.progressMessage = msg; }); //in progress
          };

          // Stop an already initialized or running experiment
          $scope.stopSimulation = function (simulation, experiment) {
            experimentsService.stopExperiment(simulation, experiment);
          };

          $scope.joinExperiment = function (simul, exp) {
            var path = 'esv-web/experiment-view/' + simul.server + '/' + exp.id + '/' + environmentService.isPrivateExperiment() + "/" + simul.runningSimulation.simulationID;
            $location.path(path);
          };

          $scope.$on('$destroy', function () {
            experimentsService.destroy();
          });
        };
        $scope.setCollapsed = function(newState){
          $scope.isCollapsed = newState;
          $scope.versionString = newState ? "Show versions" : "Hide versions";
        };

        $scope.getSoftwareVersions = function(server){
          if(!$scope.isCollapsed) {
             $scope.softwareVersions = "";
             nrpFrontendVersion.get(function (data) {
               $scope.softwareVersions += data.toString;
             });
             if (server)
               experimentProxyService.getServerConfig(server)
                 .then(function(serverConfig) {
                   nrpBackendVersions(serverConfig.gzweb['nrp-services']).get(function(result) {
                     $scope.softwareVersions += result.toString;
                   });
                 });
          }
        };
        function loadCollabExperiments() {
          var ctx = $stateParams.ctx;
          collabConfigService.get({ contextID: ctx },
            function (response) {
              if (response.experimentID) { //there is a cloned experiement
                $scope.config.loadingMessage = 'Loading experiment description...';
              } else {
                $scope.config.canCloneExperiments = true;
                $scope.config.canLaunchExperiments = false;
              }
              loadExperiments(ctx, response.experimentID, response.experimentFolderUUID);
            },
            function (data) {
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
