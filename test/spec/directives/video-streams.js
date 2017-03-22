'use strict';

describe('Directive: video-stream', function() {

  var $compile, $rootScope, $q, $scope, $timeout, stateService, STATE;
  var refTopic = '/icub_model/right_eye_camera/image_raw';
  var expectedTopics = [{ url: refTopic, fullUrl: refTopic }];

  var videoStreamServiceMock = {
    getStreamUrls: function() {
      return $q.resolve(expectedTopics);
    }
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(module(function($provide) {
    $provide.value('videoStreamService', videoStreamServiceMock);
  }));

  var elementScope;

  beforeEach(inject(function(_$rootScope_, _$compile_, _$q_, _$timeout_, _stateService_, _STATE_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;
    $timeout = _$timeout_;
    stateService = _stateService_;
    STATE = _STATE_;
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
    $scope.visible = false;
    var element = $compile('<video-streams ng-show="visible"></video-streams>')($scope);
    $scope.$digest();
    elementScope = element.isolateScope();
  });

  it('should correctly retrieve videoStreams when becoming visible', function() {
    $scope.$digest();
    expect(elementScope.videoStreams).toBeUndefined();
    $scope.visible = true;
    $scope.$digest();
    expect(elementScope.videoStreams).toEqual(expectedTopics);
  });

  it('should set video stream on showVideoStream', function() {
    expect(elementScope.videoUrl).toBeUndefined();
    elementScope.showVideoStream(refTopic);
    expect(elementScope.videoUrl).toBe(refTopic + '&t=1');
  });
});

