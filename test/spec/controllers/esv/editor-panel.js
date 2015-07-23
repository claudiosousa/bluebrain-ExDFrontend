'use strict';

describe('Controller: editorPanelCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var experimentCtrl,
      scope,
      rootScope,
      bbpConfig,
      controller;

  var stateParams;

  beforeEach(module(function ($provide) {
    $provide.value('$stateParams', stateParams);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$stateParams_,
                              _bbpConfig_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    stateParams = _$stateParams_;
    bbpConfig = _bbpConfig_;

    // Mock the scene controls object
    rootScope.scene = {};
    rootScope.scene.controls = {};
    rootScope.scene.controls.keyBindingsEnabled = true;

    stateParams = {
      mode : undefined,
      serverID : 'bbpce016',
      simulationID : 'mocked_simulation_id'
    };

    experimentCtrl = $controller('editorPanelCtrl', {
      $rootScope: rootScope,
      $scope: scope,
      $stateParams: stateParams
    });

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  it('should throw an error when no serverID or simulationID was provided', function () {
    stateParams.serverID = undefined;
    stateParams.simulationID = undefined;
    expect(function(){
      controller('editorPanelCtrl', {
        $rootScope: rootScope,
        $scope: scope,
        $stateParams: stateParams
      });
    }).toThrow('No serverID or simulationID given.');
  });

  it('should set the panelIsOpen on the open and close callbacks', function () {
    expect(scope.panelIsOpen).toBeFalsy();
    expect(scope.openCallback).toEqual(jasmine.any(Function));
    expect(scope.closeCallback).toEqual(jasmine.any(Function));
    scope.openCallback();
    expect(scope.panelIsOpen).toBeTruthy();
    scope.closeCallback();
    expect(scope.panelIsOpen).toBeFalsy();
  });

  it('should disable the key bindings when an code editor tab is active and the panel is opened', function () {
    expect(scope.panelIsOpen).toBeFalsy();
    expect(rootScope.scene.controls.keyBindingsEnabled).toBeTruthy();

    //Test the transferfunction tab
    scope.activeTab.transferfunction = true;
    scope.openCallback();
    expect(rootScope.scene.controls.keyBindingsEnabled).toBeFalsy();

    scope.closeCallback();
    expect(rootScope.scene.controls.keyBindingsEnabled).toBeTruthy();

    //Test the statemachine tab
    scope.activeTab.statemachine = true;
    scope.openCallback();
    expect(rootScope.scene.controls.keyBindingsEnabled).toBeFalsy();
  });

  it('should disable the key bindings when the panel is open and the disableKeyBindings function is called', function () {
    scope.panelIsOpen = true;
    rootScope.scene.controls.keyBindingsEnabled = true;
    scope.disableKeyBindings();

    expect(rootScope.scene.controls.keyBindingsEnabled).toBeFalsy();
  });

  it('should NOT disable the key bindings when the panel is CLOSED and the disableKeyBindings function is called', function () {
    scope.panelIsOpen = false;
    rootScope.scene.controls.keyBindingsEnabled = true;
    scope.disableKeyBindings();

    expect(rootScope.scene.controls.keyBindingsEnabled).toBeTruthy();
  });

  it('should re-enable the key bindings', function () {
    rootScope.scene.controls.keyBindingsEnabled = false;
    scope.reenableKeyBindings();

    expect(rootScope.scene.controls.keyBindingsEnabled).toBeTruthy();
  });
});
