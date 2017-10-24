(function() {
  'use strict';

  describe('nrpAnalytics', function() {
    var analyticsMock;
    var promiseMock;
    var userMock;
    var originalMoment;
    var nrpUserMock = {
      getCurrentUser: function() {
        return {
          then: promiseMock
        };
      }
    };

    beforeEach(module('angulartics'));
    beforeEach(module('nrpAngulartics'));
    beforeEach(
      module(function($provide) {
        analyticsMock = {
          eventTrack: jasmine.createSpy('eventTrack'),
          settings: { pageTracking: function() {} }
        };
        promiseMock = jasmine.createSpy('then');
        userMock = { displayName: 'elvis-presse-les' };

        $provide.value('$analytics', analyticsMock);
        $provide.value('nrpUser', nrpUserMock);
      })
    );

    var nrpAnalytics;
    beforeEach(
      inject(function(_nrpAnalytics_) {
        nrpAnalytics = _nrpAnalytics_;
      })
    );
    beforeEach(function() {
      originalMoment = moment;
    });
    afterEach(function() {
      window.moment = originalMoment;
    });

    it('Should send event to $analitics with user as label', function() {
      nrpAnalytics.eventTrack('open-tab', {
        category: 'widget'
      });
      expect(promiseMock).toHaveBeenCalled();
      expect(promiseMock.calls.count()).toBe(1);

      var callback = promiseMock.calls.mostRecent().args[0];
      callback(userMock);
      expect(analyticsMock.eventTrack).toHaveBeenCalled();
      expect(analyticsMock.eventTrack.calls.count()).toBe(1);
      var eventTrackArgs = analyticsMock.eventTrack.calls.argsFor(0);
      expect(eventTrackArgs[0]).toBe('open-tab');
      expect(eventTrackArgs[1].category).toBe('widget');
      expect(eventTrackArgs[1].label).toBe('elvis-presse-les');
    });

    it('Should convert bool false value to int 0', function() {
      nrpAnalytics.eventTrack('open-tab', {
        category: 'widget',
        value: false
      });
      var callback = promiseMock.calls.mostRecent().args[0];
      callback(userMock);
      var eventTrackArgs = analyticsMock.eventTrack.calls.argsFor(0);
      expect(eventTrackArgs[1].value).toBe(0);
    });

    it('Should convert bool true value to int 1', function() {
      nrpAnalytics.eventTrack('open-tab', {
        category: 'widget',
        value: true
      });
      var callback = promiseMock.calls.mostRecent().args[0];
      callback(userMock);
      var eventTrackArgs = analyticsMock.eventTrack.calls.argsFor(0);
      expect(eventTrackArgs[1].value).toBe(1);
    });

    it('Should track duration of an event', function() {
      window.moment = jasmine.createSpy('moment').and.returnValue(10 * 1000);
      nrpAnalytics.tickDurationEvent('widget-is-loading');
      expect(moment).toHaveBeenCalled();
      expect(moment.calls.count()).toBe(1);

      window.moment = jasmine.createSpy('moment').and.returnValue(52 * 1000);
      nrpAnalytics.durationEventTrack('widget-is-loading', {
        category: 'UI'
      });
      expect(moment).toHaveBeenCalled();
      expect(moment.calls.count()).toBe(1);

      var callback = promiseMock.calls.mostRecent().args[0];
      callback(userMock);
      var eventTrackArgs = analyticsMock.eventTrack.calls.argsFor(0);

      expect(eventTrackArgs[0]).toBe('widget-is-loading');
      expect(eventTrackArgs[1].category).toBe('UI');
      expect(eventTrackArgs[1].value).toBe(42);
    });

    it('Should not call eventTrack when the duration can not be found', function() {
      window.moment = jasmine.createSpy('moment');
      nrpAnalytics.durationEventTrack('widget-is-loading', {
        category: 'UI'
      });
      expect(moment).not.toHaveBeenCalled();
      expect(promiseMock).not.toHaveBeenCalled();
    });
  });
})();
