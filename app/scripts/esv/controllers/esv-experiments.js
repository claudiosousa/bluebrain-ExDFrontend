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
      function (
        $scope,
        $location,
        $stateParams,
        STATE,
        experimentsFactory,
        collabConfigService,
        $window
      ) {
        $scope.STATE = STATE;
        $scope.pageState = {};

        $scope.config = {
          loadingMessage: 'Loading list of experiments...',
          canLaunchExperiments: true,
          canCloneExperiments: false,
          canUploadEnvironment: true
        };

        $scope.uploadEnvironmentAndStart = function (experiment) {
          var inputElement = angular.element('<input type="file" />');
          inputElement.bind('change', function () {
            // Uploading the SDF file
            var reader = new FileReader();
            reader.readAsText(inputElement[0].files[0], 'UTF-8');
            reader.onload = function (evt) {
              $scope.startNewExperiment(experiment, evt.target.result);
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
              $scope.pageState.selected = experiment.id;
              $scope.pageState.showJoin = false;
            }
          };

          $scope.startNewExperiment = function (experiment, launchSingleMode, sdfData) {
            $scope.pageState.startingExperiment = experiment.id;
            experimentsService.startExperiment(experiment, launchSingleMode, sdfData)
              .then(function (path) { $location.path(path); },// succeeded
              function () { $scope.pageState.startingExperiment = null; },// failed
              function (msg) { $scope.progressMessage = msg; }); //in progress
          };

          // Stop an already initialized or running experiment
          $scope.stopSimulation = function (simulation, experiment) {
            experimentsService.stopExperiment(simulation, experiment);
          };

          $scope.joinExperiment = function (simul) {
            $location.path('esv-web/gz3d-view/' + simul.server + '/' + simul.runningSimulation.simulationID);
          };

          $scope.$on('$destroy', function () {
            experimentsService.destroy();
          });
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

        if (!$stateParams.ctx) {
          loadExperiments();
        } else {
          loadCollabExperiments();
        }
      }
    ]);
})();
