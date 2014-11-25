'use strict';

describe('Directive: exdModelSelector', function () {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  var $scope, $compile, $q, hbpEntityStore, hbpProjectStore;
  beforeEach(inject(function($rootScope, _$compile_, _$q_, _hbpEntityStore_, _hbpProjectStore_) {
    $scope = $rootScope.$new();
    $compile = _$compile_;
    $q = _$q_;
    hbpEntityStore = _hbpEntityStore_;
    hbpProjectStore = _hbpProjectStore_;

    spyOn(hbpEntityStore,'get').andReturn($q.when({
      '_uuid': '3',
      '_name': 'testFolder',
      '_entityType': 'folder'
    }));

    spyOn(hbpEntityStore,'getChildren').andReturn($q.when({
      result: [{
        _uuid: '4',
        _name: 'first_child'
      }, {
        _uuid: '5',
        _name: 'second_child'
      }],
      hasMore: false
    }));

    spyOn(hbpEntityStore,'getUserAccess').andReturn($q.when({
      canRead: true,
      canWrite: true,
      canManage: false
    }));

    spyOn(hbpProjectStore,'getAll').andReturn($q.when({
      result: []
    }));
  }));

  it('replaces the element with the appropriate content', function() {
    // Compile a piece of HTML containing the directive
    $scope.testInput = {
        type: 'nrp/brain',
        title: 'Brain description',
        description: 'The brain model to link the robot to a neural simulation. A brain description consists in an XML file.',
        selectedEntity: undefined
    };

    var element = $compile('<exd-model-selector exd-input="testInput" exd-image-default-thumbnail="/img/brain.png"/></exd-model-selector>')($scope);
    // fire all the watches, so the scope expression {{1 + 1}} will be evaluated
    $scope.$digest();
    // Check that the title is replaced properly
    expect(element.html()).toContain('<div class="hbp-sidebar-title ng-binding">Brain description:');
    // Check that the description is replaced properly
    expect(element.html()).toContain('<p class="ng-binding">The brain model to link the robot to a neural simulation. A brain description consists in an XML file.</p>');
  });

  it('should open and close dialog properly', function() {
    // Compile a piece of HTML containing the directive
    $scope.testInput = {
        type: 'nrp/brain',
        title: 'Brain description',
        description: 'The brain model to link the robot to a neural simulation. A brain description consists in an XML file.',
        selectedEntity: undefined
    };
    var element = angular.element('<exd-model-selector exd-input="testInput" exd-image-default-thumbnail="/img/brain.png"/></exd-model-selector>');
    $compile(element)($scope);
    $scope.$digest();

    expect(element.isolateScope().dialogOpen).toBe(false);
    element.isolateScope().toggleDialog();
    expect(element.isolateScope().dialogOpen).toBe(true);
  });


  it('should mark only the valid element as selectable', function() {
    // Compile a piece of HTML containing the directive
    $scope.testInput = {
        type: 'nrp/brain',
        title: 'Brain description',
        description: 'The brain model to link the robot to a neural simulation. A brain description consists in an XML file.',
        selectedEntity: undefined
    };
    
    var testValidEntity = {
        metadataLoaded: true,
        _contentType: 'nrp/brain',
    };

    var testInvalidEntity = {
        metadataLoaded: true,
        _contentType: 'nrp/other',
    };

    var element = angular.element('<exd-model-selector exd-input="testInput" exd-image-default-thumbnail="/img/brain.png"/></exd-model-selector>');
    $compile(element)($scope);
    $scope.$digest();

    expect(element.isolateScope().selectable(testValidEntity)).toBe(true);
    expect(element.isolateScope().selectable(testInvalidEntity)).toBe(false);
  });

  it('should mark only the valid element as selectable (with custom selectable function)', function() {
    // Compile a piece of HTML containing the directive
    $scope.testInput = {
        type: 'nrp/brain',
        title: 'Brain description',
        description: 'The brain model to link the robot to a neural simulation. A brain description consists in an XML file.',
        selectedEntity: undefined
    };
    $scope.testInput.selectableExtended = function() {
        return false;
    };

    var testValidEntity = {
        metadataLoaded: true,
        _contentType: 'nrp/brain',
    };

    var testInvalidEntity = {
        metadataLoaded: true,
        _contentType: 'nrp/other',
    };

    var element = angular.element('<exd-model-selector exd-input="testInput" exd-image-default-thumbnail="/img/brain.png"/></exd-model-selector>');
    $compile(element)($scope);
    $scope.$digest();

    expect(element.isolateScope().selectable(testValidEntity)).toBe(false);
    expect(element.isolateScope().selectable(testInvalidEntity)).toBe(false);
  });

  it('should allow mouse over and thumbnail display only on valid elements', function() {
    // Compile a piece of HTML containing the directive
    $scope.testInput = {
        type: 'nrp/brain',
        title: 'Brain description',
        description: 'The brain model to link the robot to a neural simulation. A brain description consists in an XML file.',
        selectedEntity: undefined
    };
    
    var testValidEntity = {
        metadataLoaded: true,
        _contentType: 'nrp/brain',
    };

    var testInvalidEntity = {
        metadataLoaded: true,
        _contentType: 'nrp/other',
    };

    var element = angular.element('<exd-model-selector exd-input="testInput" exd-image-default-thumbnail="/img/brain.png"/></exd-model-selector>');
    $compile(element)($scope);
    $scope.$digest();

    element.isolateScope().selectable(testValidEntity);
    element.isolateScope().hovered(testValidEntity);
    expect(element.isolateScope().hoveredEntity).toBe(testValidEntity);
    element.isolateScope().selectable(testInvalidEntity);
    element.isolateScope().hovered(testInvalidEntity);
    expect(element.isolateScope().hoveredEntity).toBe(undefined);
  });

  it('should allow the user to select a valid element and to unselect it', function() {
    // Compile a piece of HTML containing the directive
    $scope.testInput = {
        type: 'nrp/brain',
        title: 'Brain description',
        description: 'The brain model to link the robot to a neural simulation. A brain description consists in an XML file.',
        selectedEntity: undefined
    };
    
    var testValidEntity = {
        metadataLoaded: true,
        _contentType: 'nrp/brain',
    };

    var element = angular.element('<exd-model-selector exd-input="testInput" exd-image-default-thumbnail="/img/brain.png"/></exd-model-selector>');
    $compile(element)($scope);
    $scope.$digest();

    element.isolateScope().toggleDialog();
    expect(element.isolateScope().dialogOpen).toBe(true);
    element.isolateScope().selectable(testValidEntity);
    element.isolateScope().hovered(testValidEntity);
    expect($scope.testInput.selectedEntity).toBe(undefined);
    element.isolateScope().selectEntity();
    expect(element.isolateScope().dialogOpen).toBe(false);
    expect($scope.testInput.selectedEntity).toBe(testValidEntity);
    element.isolateScope().unselectEntity();
    expect($scope.testInput.selectedEntity).toBe(undefined);
  });


});
