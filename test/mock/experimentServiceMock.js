(function () {
  'use strict';

  angular.module('experimentServiceMock', ['simulationInfoMock'])
  .service('experimentService', function () {

        this.experimentConfiguration = 'ExperimentConfiguration';
        this.environmentConfiguration = 'EnvironmentConfiguration';
        this.creationDate = '19.02.1970';

        this.experimentDescription = 'Description';
        this.experimentName = 'Name';

        this.rosTopics = 'ROS Topics';
        this.rosbridgeWebsocketUrl = 'ROS Bridge URL';

        this.owner = 'Steve McQueen';
        this.versionString = 'V10.11';
  });
}());
