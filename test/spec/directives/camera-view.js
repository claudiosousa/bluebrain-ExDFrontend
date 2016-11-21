'use strict';

describe('Directive: camera-view', function () {

  var $scope;
  var $document;

  var element, elementScope;

  var gz3dMock, viewMock;
  var cameraName = 'test_camera';

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(module(function ($provide) {
    viewMock = {
      camera: {
        cameraHelper: {
          visible: false
        }
      }
    };

    gz3dMock = {
      scene: {
        viewManager: {
          getViewByName: jasmine.createSpy('getViewByName').andReturn(viewMock)
        }
      }
    };
    $provide.value('gz3d', gz3dMock);
  }));

  beforeEach(inject(function ($rootScope, $compile, _$log_, _$document_) {
    $scope = $rootScope.$new();
    element = $compile('<camera-view camera-name=' + cameraName + '></camera-view>')($scope);
    $document = _$document_;
    $scope.$digest();
    elementScope = element.scope();
  }));

  it('should correctly initialize scope variables', function () {
    expect(elementScope.cameraName).toEqual(cameraName);
    expect(elementScope.showFrustum).toEqual(false);
  });

  it(' - onShowFrustumChanged()', function () {
    elementScope.showFrustum = true;
    elementScope.onShowFrustumChanged();
    expect(viewMock.camera.cameraHelper.visible).toEqual(true);
  });
});
