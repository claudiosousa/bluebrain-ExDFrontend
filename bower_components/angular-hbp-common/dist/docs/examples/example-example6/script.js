    angular.module('iconExample', ['hbpCommon'])
        .controller('iconController', function($scope) {
            $scope.entity = { _entityType: 'project' };
            $scope.type = 'folder';
        }
    );