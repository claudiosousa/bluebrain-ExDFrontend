'use strict';

describe('Directive: uibModalWindow', function() {
  beforeEach(module('ui.bootstrap.modal'));
  beforeEach(module('uib/template/modal/window.html'));
  var element;
  beforeEach(inject(function($rootScope, $compile) {
    element = $compile('<section uib-modal-window></section>')($rootScope);
    $rootScope.$digest();
  }));

  it('must be patched to avoid animation racing condition', function() {
    /*
    The combination of our versions of angular-bootstrap and angular
    causes a documented animation racing condition when both 'replace' and 'templateUrl' are used.

    The issue can be observed when reseting the brain, the splash doesn't fade and you have a consoel error in angular animate.

    Issue described here., https://github.com/angular/angular.js/issues/13215

    Unfortunatly, the only way to solve is to manually patch uibModalWindow in angular-bootsrap to set the 'replace:false'
    at ExDFrontend/bower_components/angular-bootstrap/ui-bootstrap-tpls.js, line 3576
    */
    expect(element[0].tagName).toBe('SECTION');
  });
});