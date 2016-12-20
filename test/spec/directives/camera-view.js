'use strict';

describe('Directive: camera-view', function () {

  var $compile, $rootScope, $q, $log, STREAM_URL;
  var refTopic = '/icub_model/right_eye_camera/image_raw';
  var videoDirectoryResponse = { data: '<html><head><title>ROS Image Topic List</title></head><body><h1>Available ROS Image Topics:</h1><ul><li>/icub_model/left_eye_camera/<ul><li><a href="/stream_viewer?topic=/icub_model/left_eye_camera/image_raw">image_raw</a> (<a href="/snapshot?topic=/icub_model/left_eye_camera/image_raw">Snapshot</a>)</li></ul></li><li>/icub_model/right_eye_camera/<ul><li><a href="/stream_viewer?topic=/icub_model/right_eye_camera/image_raw">image_raw</a> (<a href="/snapshot?topic=' + refTopic + '">Snapshot</a>)</li></ul></li></ul></body></html>' };

  var gz3dMock, viewMock, simulationInfoMock, httpMock;
  var cameraName = 'test_camera';
  var videoUrl = 'http://video-url/';

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

    simulationInfoMock = {
      serverConfig: {
        gzweb: {
          videoStreaming: videoUrl
        }
      }
    };

    httpMock = {
      get: function () { return $q.when(videoDirectoryResponse); }
    };

    $provide.value('$http', httpMock);
    $provide.value('simulationInfo', simulationInfoMock);
    $provide.value('gz3d', gz3dMock);
  }));

  beforeEach(inject(function (_$rootScope_, _$compile_, _$q_, _$log_, _STREAM_URL_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;
    $log = _$log_;
    STREAM_URL = _STREAM_URL_;
  }));

  it('should throw an exception if server config misses \'videoStreaming\'', function () {
    simulationInfoMock.serverConfig.gzweb.videoStreaming = null;
    spyOn($log, 'error');
    $compile('<camera-view></camera-view>')($rootScope.$new());
    $rootScope.$digest();
    expect($log.error).toHaveBeenCalled();
  });

  describe('Directive: camera-view', function () {
    var element, elementScope;

    beforeEach(inject(function (_$log_, $httpBackend) {
      $httpBackend.whenGET(videoUrl).respond(200, videoDirectoryResponse);

      var $scope = $rootScope.$new();
      element = $compile('<camera-view camera-name=' + cameraName + '></camera-view>')($scope);
      $scope.$digest();
      elementScope = element.isolateScope();
    }));

    it('should correctly initialize scope variables', function () {
      expect(elementScope.cameraName).toEqual(cameraName);
      expect(elementScope.showFrustum).toEqual(false);
    });

    it('should correctly map topic to url', function () {
      element = $compile('<camera-view topic="' + refTopic + '"></camera-view>')($rootScope.$new());
      $rootScope.$digest();
      expect(element.isolateScope().videoUrl).toEqual(videoUrl + STREAM_URL + refTopic);
    });

    it(' - onShowFrustumChanged()', function () {
      elementScope.showFrustum = false;
      expect(viewMock.camera.cameraHelper.visible).toEqual(false);
      elementScope.onShowFrustumChanged();
      expect(viewMock.camera.cameraHelper.visible).toEqual(true);
    });
  });
});

