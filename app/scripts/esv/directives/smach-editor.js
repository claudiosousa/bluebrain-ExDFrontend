(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('smachEditor', ['$log', '$http', function ($log, $http) {
    return {
      templateUrl: 'views/esv/smach-editor.html',
      restrict: 'E',
      link: function (scope, element, attrs) {
        if(!attrs.server) {
          $log.error('The server URL was not specified!');
        }

        if(!attrs.simulation) {
          $log.error('The simulationID was not specified!');
        }

        var serverBaseUrl = attrs.server;
        var simulationID = attrs.simulation;

        scope.smachEditorOptions = {
          lineWrapping : true,
          lineNumbers: true,
          readOnly: false,
          mode: 'text/x-python'
        };

        scope.smachCode = '';

        scope.smachEditorRefresh = function() {
          $http.get('views/esv/smach-example-code.py').success(function (data) {
            // get the sourcecode and save it to the smachCode variable
            scope.smachCode = data;
          });
        };
      }
    };
  }]);
}());
