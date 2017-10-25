'use strict';

describe('Directive: scrollOnClick', function() {
  beforeEach(module('exdFrontendApp'));
  var $scope, element;

  beforeEach(
    inject(function($rootScope, $compile) {
      $scope = $rootScope.$new();
      element = $compile(
        '<a scroll-on-click href="#target">Scroll down</a><div id="target">Target</div>'
      )($scope);
      $scope.$digest();
    })
  );

  it('check if scrolling is actually triggered by a click event', function() {
    //element.triggerHandler('click');
  });
});
