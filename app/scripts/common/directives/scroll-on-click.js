(function () {
  'use strict';
  angular.module('exdFrontendApp').directive('scrollOnClick', function() {
    return {
      link: function (scope, element, attrs) {
        var scrollTargetId = attrs.href;
        element.on('click', function() {
          /* global $: false */
          var target = angular.isDefined(scrollTargetId) ? $(scrollTargetId) : element;
          // Unlike Chrome, Firefox places the overflow at the html, 
          // see http://stackoverflow.com/questions/8149155/animate-scrolltop-not-working-in-firefox
          $('body,html').animate({scrollTop: target.offset().top}, 'fast');
        });
      }
    };
  });
}());

