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
      'hbpDialogFactory',
      'collabFolderAPIService',
      'collabExperimentLockService',
      'nrpUser',
      '$timeout',
      'environmentService',
      'experimentProxyService',
      'nrpBackendVersions',
      'nrpFrontendVersion',
      function (
        $scope,
        $location,
        $stateParams,
        STATE,
        experimentsFactory,
        collabConfigService,
        $window,
        CLUSTER_THRESHOLDS,
        hbpDialogFactory,
        collabFolderAPIService,
        collabExperimentLockService,
        nrpUser,
        $timeout,
        environmentService,
        experimentProxyService,
        nrpBackendVersions,
        nrpFrontendVersion
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
        if (environmentService.isPrivateExperiment()){
          var lockService = collabExperimentLockService.createLockServiceForContext($stateParams.ctx);
        }
        $scope.config = {
          loadingMessage: 'Loading list of experiments...',
          canLaunchExperiments: true,
          canCloneExperiments: false,
          canUploadEnvironment: true
        };

        $scope.uploadEnvironmentAndStart = function (experiment, launchSingleMode) {
          var inputElement = angular.element('<input type="file" />');
          inputElement.bind('change', function () {
            // Uploading the SDF file
            var reader = new FileReader();
            reader.readAsText(inputElement[0].files[0], 'UTF-8');
            reader.onload = function (evt) {
              $scope.startNewExperiment(experiment, launchSingleMode, evt.target.result);
            };
          });
          inputElement[0].click();
        };

        $scope.cloneExperiment = function (experimentID) {
          $scope.isCloneRequested = true;
          collabConfigService.clone({ contextID: $stateParams.ctx }, { experimentID: experimentID }, function () {
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
          experimentsFactory.getCurrentUserInfo().then(function (userinfo) { $scope.userinfo = userinfo; });

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
            if (environmentService.isPrivateExperiment()) {
              $scope.loadingEdit = true;
              lockService.tryAddLock()
                .then(function(result) {
                  if (!result.success && result.lock && result.lock.lockInfo.user.id !== $scope.userinfo.userID) {
                    hbpDialogFactory.alert({
                      title: "Error",
                      template: "Sorry you cannot edit at this time. Only one user can edit at a time and " + result.lock.lockInfo.user.displayName + " started editing " + moment(new Date(result.lock.lockInfo.date)).fromNow() + ". Please try again later."
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
                  hbpDialogFactory.alert({
                    title: "Error",
                    template: "There was an error in opening the edit feature, please try again later."
                  });
                })
                .finally(function(){
                  $scope.loadingEdit = false;
                });
            }
          };

          $scope.stopEditingExperimentDetails = function(editingKey){
            lockService.releaseLock()
              .catch(function () {
                hbpDialogFactory.alert({
                  title: "Error",
                  template: "The edit lock could not be released. Please remove it manually from the Storage area."
                });
              });
            $scope.formInfo.name = $scope.experiments[0].configuration.name;
            $scope.formInfo.desc = $scope.experiments[0].configuration.description;
            $scope.editing[editingKey] = false;
          };
          var shouldSave = function(input, originalValue, editingKey){
            if (!input || input.trim().length === 0){
              hbpDialogFactory.alert({
                title: "Error",
                template: "Name/Description of an experiment cannot be empty."
              });
              return false;
            }
            if ($scope.containsTags(input)){
              hbpDialogFactory.alert({
                title: "Error",
                template: "Name/Description of an experiment cannot contain an HTML tag."
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
            var xml = experimentsService.getCollabExperimentXML();
            if (!xml){
              hbpDialogFactory.alert({
                title: "Error",
                template: "Something went wrong when retrieving the experiment_configuration.xml file from the collab storage. Please check the file exists and is not empty."
              });
              $scope.isSavingToCollab = false;
              return;
            }
            xml = xml.replace(originalValue, newDetails);
            collabFolderAPIService.deleteFile(experimentFolderUUID, "experiment_configuration.xml").then(function(){
             collabFolderAPIService.createFolderFile(experimentFolderUUID, "experiment_configuration.xml", xml, {type: 'application/hbp-neurorobotics+xml'}).then(function(){
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
                hbpDialogFactory.alert({
                  title: "Error.",
                  template: "Error while saving updated experiment details to Collab storage."
                });
              });
            });
          };
          $scope.containsTags = function(input){
            var div = document.createElement("div");
            div.innerHTML = input;
            return div.innerText !== input;
          };

          $scope.startNewExperiment = function (experiment, launchSingleMode, sdfData) {
            $scope.pageState.startingExperiment = experiment.id;
            experimentsService.startExperiment(experiment, launchSingleMode, sdfData, nrpUser.getReservation())
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
            experimentProxyService.getServerConfig(server)
            .then(function (serverConfig) {
              nrpBackendVersions(serverConfig.gzweb['nrp-services']).get(function (result) {
                $scope.softwareVersions += result.toString;
              });
            });
          }
        };
        function loadCollabExperiments() {
          var ctx = $stateParams.ctx;
          collabConfigService.get({ contextID: ctx },
            function (response) {
              $scope.config.canUploadEnvironment = false;

              if (response.experimentID) { //there is a cloned experiement
                $scope.config.loadingMessage = 'Loading experiment description...';
                $scope.config.canUploadEnvironment = false;
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
