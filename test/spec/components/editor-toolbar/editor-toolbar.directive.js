(function() {
  'use strict';

  describe('Directive: EditorToolbar', function() {

    var $compile, $rootScope, $scope;
    var editorToolbarService;
    var element;

    beforeEach(module('editorToolbarModule'));
    beforeEach(module('exd.templates')); // import html template
    beforeEach(module('contextMenuStateServiceMock'));

    beforeEach(module('stateServiceMock'));
    beforeEach(module('gz3dMock'));
    beforeEach(module('splashMock'));
    beforeEach(module('hbpDialogFactoryMock'));
    beforeEach(module('backendInterfaceServiceMock'));
    beforeEach(module('objectInspectorServiceMock'));
    beforeEach(module('userNavigationServiceMock'));
    beforeEach(module('userContextServiceMock'));
    beforeEach(module('editorsPanelServiceMock'));
    beforeEach(module('environmentRenderingServiceMock'));
    beforeEach(module('simulationInfoMock'));
    beforeEach(module('videoStreamServiceMock'));
    beforeEach(module('dynamicViewOverlayServiceMock'));

    beforeEach(inject(function(_$rootScope_, _$compile_, _editorToolbarService_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      editorToolbarService = _editorToolbarService_;
    }));

    beforeEach(function() {
      $scope = $rootScope.$new();

      element = $compile('<editor-toolbar></editor-toolbar>')($scope);
      document.createElement('div').appendChild(element[0]);
      $scope.$digest();
    });

    it('should have a controller defined as vm', function() {
      expect($scope.vm).toBeDefined();
    });
  });
}());
