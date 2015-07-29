'use strict';

describe('Directive: environment-designer', function () {
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('exdFrontendApp.Constants'));

  var simulationStateSpy, simulationSDFWorldSpy;
  var updateSpy = jasmine.createSpy('update');
  var stateSpy = jasmine.createSpy('state');

  beforeEach(module('simulationControlServices', function ($provide) {
    $provide.decorator('simulationSDFWorld', function () {
      simulationSDFWorldSpy = jasmine.createSpy('simulationSDFWorld');
      return simulationSDFWorldSpy.andCallThrough();
    });

    $provide.decorator('simulationState', function () {
      simulationStateSpy = jasmine.createSpy('simulationState');
      return simulationStateSpy.andCallThrough();
    });
  }));

  var $rootScope, $compile, $scope, element, initState;
  beforeEach(inject(function (_$rootScope_, _$compile_, EDIT_MODE, STATE) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $scope = $rootScope.$new();
    $scope.EDIT_MODE = EDIT_MODE;
    $scope.STATE = STATE;
    element = $compile('<environment-designer />')($scope);
    $scope.$digest();

    initState = function (s) {
      simulationStateSpy.andCallFake(function () {
        return {
          update: updateSpy.andCallFake(function (simId, newState, clbk) {
            clbk(newState);
          }),
          state: stateSpy.andCallFake(function (simId, clbk) {
            return clbk({state: s});
          })
        };
      });
    };

    $rootScope.scene = jasmine.createSpy('scene');
    $rootScope.scene.setManipulationMode = jasmine.createSpy('setManipulationMode');
    $rootScope.isInEditMode = jasmine.createSpy('isInEditMode');
    $rootScope.toggleScreenChangeMenu = jasmine.createSpy('toggleScreenChangeMenu');
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

    rotateBtn.triggerHandler('click');
    expect($scope.setEditMode).toHaveBeenCalledWith($scope.EDIT_MODE.ROTATE);
  });

  it('should correctly set the edit mode', function () {
    initState($scope.STATE.STARTED);
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(stateSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
    expect($rootScope.scene.setManipulationMode).toHaveBeenCalledWith($scope.EDIT_MODE.TRANSLATE);
    expect($scope.mode).toBe($scope.EDIT_MODE.TRANSLATE);
  });

  it('should be set isInEditMode correctly', function () {
    initState($scope.STATE.STARTED);
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect($rootScope.isInEditMode).toBe(true);
    $scope.setEditMode($scope.EDIT_MODE.ROTATE);
    expect($rootScope.isInEditMode).toBe(true);
    $scope.setEditMode($scope.EDIT_MODE.VIEW);
    expect($rootScope.isInEditMode).toBe(false);
    expect($rootScope.toggleScreenChangeMenu).toHaveBeenCalledWith(false);
  });

  it('should not repeat the whole process if already in the correct mode', function () {
    initState($scope.STATE.STARTED);
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect($rootScope.scene.setManipulationMode.callCount).toBe(1);
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect($rootScope.scene.setManipulationMode.callCount).toBe(1);
  });

  it('should pause the simulation when needed', function () {
    initState($scope.STATE.STARTED);
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(updateSpy.mostRecentCall.args[1].state).toBe($scope.STATE.PAUSED);
    initState($scope.STATE.PAUSED);
    $scope.setEditMode($scope.EDIT_MODE.VIEW);
    expect(updateSpy.mostRecentCall.args[1].state).toBe($scope.STATE.STARTED);
  });

  it('should not update the state if already in the correct state', function () {
    updateSpy.callCount = 0;

    initState($scope.STATE.STARTED);
    $scope.setEditMode($scope.EDIT_MODE.VIEW);
    expect(updateSpy.callCount).toBe(0);
    initState($scope.STATE.PAUSED);
    $scope.setEditMode($scope.EDIT_MODE.TRANSLATE);
    expect(updateSpy.callCount).toBe(0);
    initState($scope.STATE.PAUSED);
    $scope.setEditMode($scope.EDIT_MODE.ROTATE);
    expect(updateSpy.callCount).toBe(0);
  });

  it('should call the right REST API for the SDF export process', function () {
    var exportSpy = jasmine.createSpy('export');
    simulationSDFWorldSpy.andCallFake(function () {
      return {
        export: exportSpy.andCallFake(function () {})
      };
    });

    $scope.exportSDFWorld();
    expect(simulationSDFWorldSpy).toHaveBeenCalled();
    expect(exportSpy).toHaveBeenCalled();
  });

});
