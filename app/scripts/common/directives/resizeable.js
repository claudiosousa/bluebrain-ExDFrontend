(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('resizeable', ['$window', function ($window) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var HORIZONTAL_STEP = 50;
        var VERTICAL_STEP = 25;
        var MIN_WIDTH = 100;
        var MIN_HEIGHT = 60;

        element.css({
          'display': 'flex',
          'flex-direction': 'row'
        });

        var buttons = angular.element('<div/>');
        buttons.addClass('resize-buttons');
        var btn_width_larger = angular.element('<div/>');
        var btn_width_smaller = angular.element('<div/>');
        var btn_height_larger = angular.element('<div/>');
        var btn_height_smaller = angular.element('<div/>');

        var icn_width_larger = angular.element('<i/>');
        var icn_width_smaller = angular.element('<i/>');
        var icn_height_larger = angular.element('<i/>');
        var icn_height_smaller = angular.element('<i/>');

        btn_height_larger.addClass('resize-button first-element');
        btn_height_smaller.addClass('resize-button');
        btn_width_larger.addClass('resize-button');
        btn_width_smaller.addClass('resize-button');

        var resizeHeightLarger = function() {
          if (element.outerHeight() + VERTICAL_STEP < $window.innerHeight) {
            element.css('height', element.outerHeight() + VERTICAL_STEP + 'px');
            scope.onScreenSizeChanged();
          }
        };
        var resizeHeightSmaller = function() {
          if (element.outerHeight() - VERTICAL_STEP > MIN_HEIGHT) {
            element.css('height', element.outerHeight() - VERTICAL_STEP + 'px');
            scope.onScreenSizeChanged();
          }
        };
        var resizeWidthLarger = function() {
          if (element.outerWidth() + HORIZONTAL_STEP < $window.innerWidth) {
            element.css('width', element.outerWidth() + HORIZONTAL_STEP + 'px');
            scope.onScreenSizeChanged();
          }
        };
        var resizeWidthSmaller = function() {
          if (element.outerWidth() - HORIZONTAL_STEP > MIN_WIDTH) {
            element.css('width', element.outerWidth() - HORIZONTAL_STEP + 'px');
            scope.onScreenSizeChanged();
          }
        };

        btn_height_larger.bind('click', resizeHeightLarger);
        btn_height_smaller.bind('click', resizeHeightSmaller);
        btn_width_larger.bind('click', resizeWidthLarger);
        btn_width_smaller.bind('click', resizeWidthSmaller);

        icn_height_larger.addClass('fa fa-expand rotate-45-counterclockwise');
        icn_height_smaller.addClass('fa fa-compress rotate-45-counterclockwise');
        icn_width_larger.addClass('fa fa-expand rotate-45-clockwise');
        icn_width_smaller.addClass('fa fa-compress rotate-45-clockwise');

        btn_height_larger.append(icn_height_larger);
        btn_height_smaller.append(icn_height_smaller);
        btn_width_larger.append(icn_width_larger);
        btn_width_smaller.append(icn_width_smaller);

        buttons.append(btn_height_larger);
        buttons.append(btn_height_smaller);
        buttons.append(btn_width_larger);
        buttons.append(btn_width_smaller);

        element.append(buttons);
      }
    };
  }]);
}());
