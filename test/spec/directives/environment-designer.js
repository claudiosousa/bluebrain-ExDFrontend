'use strict';

describe('Directive: environment-designer', function () {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('exdFrontendApp.Constants'));

  var $rootScope, $compile, $scope, element;

  beforeEach(inject(function (_$rootScope_, _$compile_, EDIT_MODE) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $scope = $rootScope.$new();
    $scope.EDIT_MODE = EDIT_MODE;
    element = $compile('<environment-designer />')($scope);
    $scope.$digest();
  }));

  it('should replace the element with the appropriate content', function () {
    expect(element.prop('outerHTML')).toContain('<!-- TEST: Environment Designer loaded correctly -->');
  });

  it('should call correctly setEditMode', function () {
    spyOn($scope, 'setEditMode');

    var btns = element.find('button');
    var viewBtn      = angular.element(btns[0]),
        translateBtn = angular.element(btns[1]),
        rotateBtn    = angular.element(btns[2]);

    viewBtn.triggerHandler('click');
    expect($scope.setEditMode).toHaveBeenCalledWith($scope.EDIT_MODE.VIEW);

    translateBtn.triggerHandler('click');
    expect($scope.setEditMode).toHaveBeenCalledWith($scope.EDIT_MODE.TRANSLATE);

    rotateBtn .triggerHandler('click');
    expect($scope.setEditMode).toHaveBeenCalledWith($scope.EDIT_MODE.ROTATE);
  });

  it('should correctly set the edit mode', function () {
    $rootScope.scene = jasmine.createSpy('scene');
    $rootScope.scene.setManipulationMode = jasmine.createSpy('setManipulationMode');

    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect($rootScope.scene.setManipulationMode).toHaveBeenCalledWith($scope.EDIT_MODE.TRANSLATE);
    expect($scope.mode).toBe($scope.EDIT_MODE.TRANSLATE);
  });

});
