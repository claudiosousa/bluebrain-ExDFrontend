'use strict';

describe('Directive: logConsole', function() {

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates')); // import html template
    beforeEach(module('simulationInfoMock'));

    var $rootScope, $timeout, element, susbscribeCallback, childScope;

    var topicSubscriberMock = {
        subscribe: jasmine.createSpy('subscribe')
            .and.callFake(function(fn) {
                susbscribeCallback = fn;
            }),
        unsubscribe: jasmine.createSpy('unsubscribeTopic')
    };

    var roslibMock = {
        getOrCreateConnectionTo: jasmine.createSpy('getOrCreateConnectionTo'),
        createStringTopic: jasmine.createSpy('getOrCreateConnectionTo').and.returnValue(topicSubscriberMock)
    };

    beforeEach(module(function($provide) {
        $provide.value('roslib', roslibMock);
    }));

    beforeEach(inject(function(_$rootScope_, $httpBackend, _$timeout_, $compile) {
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        element = $compile('<log-console server="server" topic="topic"></log-console>')($rootScope);
        $rootScope.$digest();
        childScope = $rootScope.$$childHead;
    }));

    it('should subscribe a ros topic', function() {
        expect(topicSubscriberMock.subscribe).toHaveBeenCalled();
    });

    it('should add log when new topic messages are received', function() {
        expect(childScope.logs.length).toBe(0);
        susbscribeCallback({});
        $timeout.flush();
        expect(childScope.logs.length).toBe(1);
    });

    it('should add log when RESET occurs', function() {
        expect(childScope.logs.length).toBe(0);
        childScope.$emit('RESET');
        $timeout.flush();
        expect(childScope.logs.length).toBe(1);
    });

    it('should unsusbscribe on scope destroy', function() {
        $rootScope.$destroy();
        expect(topicSubscriberMock.unsubscribe).toHaveBeenCalled();
    });
});
