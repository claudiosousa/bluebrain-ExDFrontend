'use strict';

describe('Directive: logAdverts', function() {

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates')); // import html template

    var $rootScope,
        $timeout,
        element,
        childScope,
        clientLoggerServiceMock;

    var LOG_TYPE = {
        INFO: 1,
        ADVERTS: 2
    };

    beforeEach(module(function($provide) {
        clientLoggerServiceMock = {
            logs:  new Rx.Subject()
        };
        $provide.value('clientLoggerService', clientLoggerServiceMock);
    }));

    beforeEach(inject(function(_$rootScope_, _$timeout_, $compile) {
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        element = $compile('<log-adverts></log-adverts>')($rootScope);
        $rootScope.$digest();
        childScope = $rootScope.$$childHead;
    }));

    it('should listen to ADVERTISEMENT logs', function() {
        expect(childScope.currentAdvert).toBeNull();
        clientLoggerServiceMock.logs.next({ level: LOG_TYPE.ADVERTS, message: 'test' });
        expect(childScope.currentAdvert).toBe('test');
    });

    it('should ignore INFO logs', function() {
        clientLoggerServiceMock.logs.next({ level: LOG_TYPE.INFO, message: 'test' });
        expect(childScope.currentAdvert).toBeNull();
    });

    it('should unsusbscribe on scope destroy', function() {
        expect(clientLoggerServiceMock.logs.observers.length).toBe(2);
        $rootScope.$destroy();
        expect(clientLoggerServiceMock.logs.observers.length).toBe(0);

    });
});
