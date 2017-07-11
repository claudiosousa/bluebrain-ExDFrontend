'use strict';

describe('Controller: brainvisualizerPanelCtrl', function () {

  // load the controller's module
  beforeEach(module('editorToolbarModule'));
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module('gz3dMock'));
  beforeEach(module('simulationInfoMock'));

  var experimentCtrl,
      scope,
      rootScope,
      controller,
      editorToolbarService;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller,
                              $rootScope,
                              _editorToolbarService_) {
    controller = $controller;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    editorToolbarService = _editorToolbarService_;

    experimentCtrl = $controller('brainvisualizerPanelCtrl', {
      $rootScope: rootScope,
      $scope: scope,
    });
  }));

  it('initialized correctly', function() {
    expect(scope.simulationID).toBeDefined();
    expect(scope.serverBaseUrl).toBeDefined();
  });

  it('Notify editor toolbar service if view is closed', function() {
    editorToolbarService.showBrainvisualizerPanel = true;
    rootScope.$broadcast('$destroy');
    rootScope.$digest();

    expect(editorToolbarService.isBrainVisualizerActive).toBeFalsy();
  });
});
