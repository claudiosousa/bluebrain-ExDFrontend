'use strict';

describe('Controller: editorPanelCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('gz3dServices'));

  var experimentCtrl,
      scope,
      rootScope,
      bbpConfig,
      controller,
      gz3d;

  var stateParams;

  beforeEach(module(function ($provide) {
    $provide.value('$stateParams', stateParams);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _$stateParams_,
                              _bbpConfig_,
                              _gz3d_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    stateParams = _$stateParams_;
    bbpConfig = _bbpConfig_;
    gz3d = _gz3d_;

    // Mock the scene controls object
    gz3d.scene = {};
    gz3d.scene.controls = {};
    gz3d.scene.controls.keyBindingsEnabled = true;

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

    scope.controls.transferfunction.refresh = jasmine.createSpy('refresh');
    scope.controls.statemachine.refresh = jasmine.createSpy('refresh');
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

  it('should refresh the panel on the open callbacks', function() {
    scope.activeTab.transferfunction = true;
    expect(scope.controls.transferfunction.refresh).not.toHaveBeenCalled();
    scope.openCallback();
    expect(scope.controls.transferfunction.refresh).toHaveBeenCalled();
    expect(scope.controls.statemachine.refresh).not.toHaveBeenCalled();
    scope.activeTab.transferfunction = false;
    scope.activeTab.statemachine = true;
    scope.closeCallback();
    scope.openCallback();
    expect(scope.controls.statemachine.refresh).toHaveBeenCalled();
  });

  it('should disable the key bindings when an code editor tab is active and the panel is opened', function () {
    expect(scope.panelIsOpen).toBeFalsy();
    expect(gz3d.scene.controls.keyBindingsEnabled).toBeTruthy();

    //Test the transferfunction tab
    scope.activeTab.transferfunction = true;
    scope.openCallback();
    expect(gz3d.scene.controls.keyBindingsEnabled).toBeFalsy();

    scope.closeCallback();
    expect(gz3d.scene.controls.keyBindingsEnabled).toBeTruthy();

    //Test the statemachine tab
    scope.activeTab.statemachine = true;
    scope.openCallback();
    expect(gz3d.scene.controls.keyBindingsEnabled).toBeFalsy();
  });

  it('should disable the key bindings when the panel is open and the disableKeyBindings function is called', function () {
    scope.panelIsOpen = true;
    gz3d.scene.controls.keyBindingsEnabled = true;
    scope.disableKeyBindings();

    expect(gz3d.scene.controls.keyBindingsEnabled).toBeFalsy();
  });

  it('should NOT disable the key bindings when the panel is CLOSED and the disableKeyBindings function is called', function () {
    scope.panelIsOpen = false;
    gz3d.scene.controls.keyBindingsEnabled = true;
    scope.disableKeyBindings();

    expect(gz3d.scene.controls.keyBindingsEnabled).toBeTruthy();
  });

  it('should re-enable the key bindings', function () {
    gz3d.scene.controls.keyBindingsEnabled = false;
    scope.reenableKeyBindings();

    expect(gz3d.scene.controls.keyBindingsEnabled).toBeTruthy();
  });
});
