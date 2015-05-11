(function () {
  'use strict';
  angular.module('exdFrontendApp').directive('scrollOnClick', function() {
    return {
      link: function (scope, element, attrs) {
        var scrollTargetId = attrs.href;
        element.on('click', function() {
          /* global $: false */
          var target = angular.isDefined(scrollTargetId) ? $(scrollTargetId) : element;
          $('body').animate({scrollTop: target.offset().top}, 'slow');
        });
      }
    };
  });
}());

