(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('bindHtmlAndCompile', ['$compile', function ($compile) {
      return {
        restrict: 'A',
        scope: {
          bindHtmlAndCompile: '@'
        },
        link: function (scope, element) {
          scope.$watch('bindHtmlAndCompile', function (templateAttr) {
            var template = scope.$parent.$eval(templateAttr);
            var compiledHtml = $compile(template)(scope.$parent);
            element.empty();
            element.append(compiledHtml);
          });
        }
      };
    }]);
} ());