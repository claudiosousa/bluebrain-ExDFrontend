(function() {
    'use strict';

    /**
     * @ngdoc function
     * @name exDfrontendApp.controller:NewCtrl
     * @description
     * # NewCtrl
     * Controller of the exDfrontendApp
     */
    angular.module('exDfrontendApp')
        .controller('NewCtrl', ['$scope', function($scope) {
            $scope.environmentInput = {
                type: 'nrp/environment',
                title: 'Environment',
                description: 'The robot will evolves in the selected environment. An environment consists in a SDF file.',
                selectedEntity: undefined
            };
            $scope.neurobotInput = {
                type: 'nrp/robot',
                title: 'Robot',
                description: 'The robot model to use along with the brain. A robot consists in a SDF file.',
                selectedEntity: undefined
            };

            $scope.brainInput = {
                type: 'nrp/brain',
                title: 'Brain description',
                description: 'The brain model to link the robot to a neural simulation. A brain description consists in an XML file.',
                selectedEntity: undefined
            };
            $scope.brainInput.selectableExtended = function(entity) {
                if (entity && entity.nrpBinding && $scope.neurobotInput.selectedEntity && $scope.neurobotInput.selectedEntity.nrpName) {
                    return $scope.neurobotInput.selectedEntity.nrpName === entity.nrpBinding;
                } else {
                    return false;
                }
            };

        }]);
}());