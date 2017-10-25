'use strict';

describe('Directive: camera-view', function() {
  var $compile, $rootScope, $q;
  var refTopic = '/icub_model/right_eye_camera/image_raw';

  var gz3dMock, viewMock;

  var videoStreamServiceMock = {
    getStreamUrls: function() {
      return $q.resolve([{ url: refTopic, fullUrl: refTopic }]);
    }
  };

  var cameraName = 'test_camera';

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(
    module(function($provide) {
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
            getViewByName: jasmine
              .createSpy('getViewByName')
              .and.returnValue(viewMock)
          }
        }
      };

      $provide.value('videoStreamService', videoStreamServiceMock);
      $provide.value('gz3d', gz3dMock);
    })
  );

  var elementScope;

  beforeEach(
    inject(function(_$rootScope_, _$compile_, _$q_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $q = _$q_;
    })
  );

  beforeEach(function() {
    var $scope = $rootScope.$new();
    var element = $compile(
      '<camera-view  topic="' +
        refTopic +
        '" camera-name=' +
        cameraName +
        '></camera-view>'
    )($scope);
    $scope.$digest();
    elementScope = element.isolateScope();
  });

  it('should correctly initialize scope variables', function() {
    expect(elementScope.cameraName).toEqual(cameraName);
    expect(elementScope.showFrustum).toEqual(false);
  });

  it('should correctly map topic to url', function() {
    expect(elementScope.videoUrl).toEqual(refTopic);
  });

  it('should have videoUrl updated on toggleServerStream()', function() {
    expect(elementScope.getVideoUrlSource()).toEqual('');
    elementScope.toggleServerStream();
    expect(elementScope.getVideoUrlSource()).toEqual(
      '/icub_model/right_eye_camera/image_raw&t=paused1'
    );
  });

  it(' - onShowFrustumChanged()', function() {
    elementScope.showFrustum = false;
    expect(viewMock.camera.cameraHelper.visible).toEqual(false);
    elementScope.onShowFrustumChanged();
    expect(viewMock.camera.cameraHelper.visible).toEqual(true);
  });
});
