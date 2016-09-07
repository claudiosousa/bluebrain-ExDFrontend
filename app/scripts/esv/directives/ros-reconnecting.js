(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('rosReconnecting', [
      function () {
        return {
          restrict: 'C',
          template: '<div class="ros-reconnecting-badge">' +
          '<div class="ros-reconnecting-message">Reconnecting to ROS sockets...</div>' +
          '<i class="fa fa-spinner fa-spin"></i></div>',
          link: function (scope, element, attrs) {

            function reconnecting(establishing) {
              if (establishing) {
                element.show();
              } else {
                element.hide();
              }
            }
            var unsubscribe = window.ROSLIB.PhoenixRos.onReconnecting(reconnecting);

            scope.$on('$destroy', function () {
              unsubscribe();
            });
          }
        };
      }
    ]);
} ());
