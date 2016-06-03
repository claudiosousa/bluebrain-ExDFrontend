(function () {
  'use strict';
  angular.module('exdFrontendApp')
    .constant('COLORING_MATERIALS', [
      { name: 'Gazebo/Red', color: 'red' },
      { name: 'Gazebo/Blue', color: 'blue' },
      { name: 'Gazebo/Grey', color: 'lightgrey' },
      { name: 'Gazebo/Green', color: 'lightgreen' },
      { name: 'Gazebo/Black', color: 'black' }
    ])
    .directive('materialsChooser', [
      'COLORING_MATERIALS',
      function (COLORING_MATERIALS) {
        return {
          templateUrl: 'views/esv/materials-chooser.html',
          restrict: 'E',
          scope: {
            select: '&onSelect'
          },
          link: function (scope) {
            scope.materials = COLORING_MATERIALS;
          }
        };
      }]);
} ());
