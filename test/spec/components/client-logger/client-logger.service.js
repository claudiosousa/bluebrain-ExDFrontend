'use strict';

describe('Directive: client-logger', function() {

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('simulationInfoMock'));

    var susbscribeCallback, clientLoggerService;

    var topicSubscriberMock = {
        subscribe: jasmine.createSpy('subscribe')
            .and.callFake(function(fn) {
                susbscribeCallback = fn;
            }),
        unsubscribe: jasmine.createSpy('unsubscribeTopic')
    };

    var roslibMock = {
        getOrCreateConnectionTo: jasmine.createSpy('getOrCreateConnectionTo'),
        createTopic: jasmine.createSpy('getOrCreateConnectionTo').and.returnValue(topicSubscriberMock)
    };

    beforeEach(module(function($provide) {
        $provide.value('roslib', roslibMock);
        topicSubscriberMock.subscribe.calls.reset();
    }));

    beforeEach(inject(function(_clientLoggerService_) {
        clientLoggerService = _clientLoggerService_;
    }));

    it('should subscribe a ros topic once if there are subscribers', function() {
        expect(topicSubscriberMock.subscribe).not.toHaveBeenCalled();
        clientLoggerService.logs.subscribe();
        expect(topicSubscriberMock.subscribe).toHaveBeenCalled();
        expect(topicSubscriberMock.subscribe.calls.count()).toEqual(1);
        clientLoggerService.logs.subscribe();
        expect(topicSubscriberMock.subscribe.calls.count()).toEqual(1);
    });

    it('should subscribe a ros topic once if there are subscribers', function() {
        var subscription1 = clientLoggerService.logs.subscribe();
        var subscription2 = clientLoggerService.logs.subscribe();
        subscription1.unsubscribe();
        expect(topicSubscriberMock.unsubscribe).not.toHaveBeenCalled();
        subscription2.unsubscribe();
        expect(topicSubscriberMock.unsubscribe).toHaveBeenCalled();
    });

});
