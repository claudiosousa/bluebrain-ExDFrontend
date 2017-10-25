'use strict';

describe('Services: video-stream-service', function() {
  var refTopic = '/icub_model/right_eye_camera/image_raw';
  var videoDirectoryResponse =
    '<html><head><title>ROS Image Topic List</title></head><body><h1>Available ROS Image Topics:</h1><ul><li>/icub_model/left_eye_camera/<ul><li><a href="/stream_viewer?topic=/icub_model/left_eye_camera/image_raw">image_raw</a> (<a href="/snapshot?topic=/icub_model/left_eye_camera/image_raw">Snapshot</a>)</li></ul></li><li>/icub_model/right_eye_camera/<ul><li><a href="/stream_viewer?topic=/icub_model/right_eye_camera/image_raw">image_raw</a> (<a href="/snapshot?topic=' +
    refTopic +
    '">Snapshot</a>)</li></ul></li></ul></body></html>';

  var expectedParsedTopics = [
    {
      url: '/icub_model/left_eye_camera/image_raw',
      fullUrl:
        'http://video-url/stream?topic=/icub_model/left_eye_camera/image_raw'
    },
    {
      url: '/icub_model/right_eye_camera/image_raw',
      fullUrl:
        'http://video-url/stream?topic=/icub_model/right_eye_camera/image_raw'
    }
  ];

  var videoUrl = 'http://video-url/';

  var $httpBackend, $rootScope, $compile, $log, videoStreamService;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  var simulationInfoMock;
  beforeEach(
    module(function($provide) {
      simulationInfoMock = {
        serverConfig: {
          gzweb: {
            videoStreaming: videoUrl
          }
        }
      };
      $provide.value('simulationInfo', simulationInfoMock);
    })
  );

  beforeEach(
    inject(function(
      _$httpBackend_,
      _$rootScope_,
      _$compile_,
      _$log_,
      _videoStreamService_
    ) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $log = _$log_;
      videoStreamService = _videoStreamService_;

      $httpBackend.whenGET(videoUrl).respond(200, videoDirectoryResponse);
    })
  );

  it("should throw an exception if server config misses 'videoStreaming'", function(
    done
  ) {
    simulationInfoMock.serverConfig.gzweb.videoStreaming = null;
    spyOn($log, 'error');
    videoStreamService
      .getStreamUrls()
      .then(function() {
        //must not get here
        expect(true).toBeUndefined();
      })
      .catch(function() {
        expect($log.error).toHaveBeenCalled();
        done();
      });
    $rootScope.$digest();
  });

  it('should parse html correctly', function(done) {
    videoStreamService.getStreamUrls().then(function(topics) {
      expect(topics).toEqual(expectedParsedTopics);
      done();
    });
    $httpBackend.flush();
    $rootScope.$digest();
  });

  it(' - getStreamingUrlForTopic()', function(done) {
    videoStreamService.getStreamingUrlForTopic(refTopic).then(function(result) {
      expect(result).toBe(expectedParsedTopics[1].fullUrl);
      done();
    });

    $httpBackend.flush();
    $rootScope.$digest();
  });
});
