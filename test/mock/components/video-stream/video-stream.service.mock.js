(function () {
  'use strict';

  angular.module('videoStreamServiceMock', [])
  .service('videoStreamService', function () {
    this.getStreamUrls = jasmine.createSpy('getStreamUrls').and.returnValue({
      then: jasmine.createSpy('then')
    });
    this.getStreamingUrlForTopic = jasmine.createSpy('getStreamingUrlForTopic')
  });
}());
