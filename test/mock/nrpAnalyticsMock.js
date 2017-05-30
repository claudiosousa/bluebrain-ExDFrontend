(function () {
  'use strict';

  angular.module('nrpAnalyticsMock', [])
  .service('nrpAnalytics', function () {
    this.eventTrack = jasmine.createSpy('eventTrack');
  });
}());
