'use strict';

describe('Directive: video-stream', function() {
  var $compile, $rootScope, $q, $scope, $timeout, STATE;
  var refTopic = '/icub_model/right_eye_camera/image_raw';
  var expectedTopics;

  beforeEach(function() {
    expectedTopics = [{ url: refTopic, fullUrl: refTopic }];
  });

  var videoStreamServiceMock = {
    getStreamUrls: function() {
      return $q.resolve(angular.copy(expectedTopics));
    }
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(
    module(function($provide) {
      $provide.value('videoStreamService', videoStreamServiceMock);
    })
  );

  var elementScope;

  beforeEach(
    inject(function(_$rootScope_, _$compile_, _$q_, _$timeout_, _STATE_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $q = _$q_;
      $timeout = _$timeout_;
      STATE = _STATE_;
    })
  );

  beforeEach(function() {
    $scope = $rootScope.$new();
    $scope.visible = false;
    var element = $compile('<video-stream ng-show="visible"></video-stream>')(
      $scope
    );
    document.createElement('div').appendChild(element[0]);
    $scope.$digest();
    elementScope = element.isolateScope();
  });

  it('should correctly re-retrieve videoStreams when playing experiment', function() {
    $scope.$digest();

    expect(elementScope.videoStreams.length).toBe(1);

    expectedTopics.push({ url: refTopic + '2', fullUrl: refTopic + '2' });
    elementScope.stateService.currentState = STATE.STARTED;
    $scope.$digest();
    $timeout.flush();
    expect(elementScope.videoStreams.length).toEqual(2);
  });

  it('should set video stream on showVideoStream', function() {
    expect(elementScope.videoUrl).toBeUndefined();
    elementScope.showVideoStream(refTopic);
    expect(elementScope.videoUrl).toBe(refTopic + '&t=0');
  });
});
