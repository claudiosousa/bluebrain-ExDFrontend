'use strict';

describe('Controller: environmentSettingsPanelCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('gz3dServices'));

  var experimentCtrl,
      scope,
      rootScope,
      bbpConfig,
      controller,
      gz3d;

  var simulationInfo;

  var baseEventHandlerMock = {
    suppressAnyKeyPress: jasmine.createSpy('suppressAnyKeyPress')
  };

  beforeEach(module(function ($provide) {
    $provide.value('baseEventHandler', baseEventHandlerMock);
  }));

  beforeEach(module(function ($provide) {
    $provide.value('simulationInfo', simulationInfo);
  }));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _bbpConfig_,
                              _gz3d_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    bbpConfig = _bbpConfig_;
    gz3d = _gz3d_;

    // Mock the scene controls object
    gz3d.scene = {};
    gz3d.scene.controls = {};
    gz3d.scene.controls.keyboardBindingsEnabled = true;

    simulationInfo = {
      mode : undefined,
      serverID : 'bbpce016',
      simulationID : 'mocked_simulation_id',
      serverConfig: {
        gzweb: {},
        rosbridge: {
          topics: {
            cleError: {}
          }
        }
      }
    };

    experimentCtrl = $controller('environmentSettingsPanelCtrl', {
      $rootScope: rootScope,
      $scope: scope,
      simulationInfo: simulationInfo
    });

    // create mock for console
    spyOn(console, 'error');
    spyOn(console, 'log');
  }));

  it('should set the panelIsOpen on the open and close callbacks', function () {
    expect(scope.panelIsOpen).toBeFalsy();
    expect(scope.openCallback).toEqual(jasmine.any(Function));
    expect(scope.closeCallback).toEqual(jasmine.any(Function));
    scope.openCallback();
    expect(scope.panelIsOpen).toBeTruthy();
    scope.closeCallback();
    expect(scope.panelIsOpen).toBeFalsy();
  });

  it('should set the variable showEnvironmentSettingsPanel to be false', function () {
    scope.showEnvironmentSettingsPanel = true;
    scope.$destroy();
    expect(scope.showEnvironmentSettingsPanel).toBeFalsy();
  });


  it('should watch showEnvironmentSettingsPanel', function () {
    spyOn(scope, 'openCallback');
    spyOn(scope, 'closeCallback');

    scope.showEnvironmentSettingsPanel = false;
    scope.$digest();
    expect(scope.closeCallback).toHaveBeenCalled();

    scope.showEnvironmentSettingsPanel = true;
    scope.$digest();
    expect(scope.openCallback).toHaveBeenCalled();
  });

  it('should call suppressAnyKeyPress from baseEventHandler service', function () {
    scope.suppressKeyPress(event);
    expect(baseEventHandlerMock.suppressAnyKeyPress).toHaveBeenCalled();
  });
});
