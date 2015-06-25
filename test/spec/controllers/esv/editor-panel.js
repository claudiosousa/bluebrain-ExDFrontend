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

  it('should register a open callback function', function () {
    expect(scope.openCallback).toEqual(jasmine.any(Function));
    scope.openCallback();
    expect(console.log.callCount).toEqual(1);
  });
});
