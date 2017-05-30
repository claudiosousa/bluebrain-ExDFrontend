'use strict';

describe('Directive: logConsole', function() {

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates')); // import html template

    var $rootScope,
        $timeout,
        element,
        childScope,
        clientLoggerServiceMock,
        editorToolbarService;

    var LOG_TYPE = {
        INFO: 1,
        ADVERTS: 2
    };

    beforeEach(module('editorToolbarServiceMock'));

    beforeEach(module(function($provide) {
        clientLoggerServiceMock = {
            logs: new Rx.Subject()
        };
        $provide.value('clientLoggerService', clientLoggerServiceMock);
    }));

    beforeEach(inject(function(_$rootScope_, _$timeout_, $compile, _editorToolbarService_) {
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        element = $compile('<log-console></log-console>')($rootScope);
        $rootScope.$digest();
        childScope = $rootScope.$$childHead;
        editorToolbarService = _editorToolbarService_;
    }));

    it('should listen to INFO logs', function() {
        expect(childScope.logs.length).toBe(0);
        clientLoggerServiceMock.logs.next({ level: LOG_TYPE.INFO, message: 'test' });
        $timeout.flush();
        expect(childScope.logs.length).toBe(1);
    });

    it('should ignore ADVERTISEMENT logs', function() {
        clientLoggerServiceMock.logs.next({ level: LOG_TYPE.ADVERTS, message: 'test' });
        $timeout.flush();
        expect(childScope.logs.length).toBe(0);
    });

    it('should add log when RESET occurs', function() {
        expect(childScope.logs.length).toBe(0);
        childScope.$emit('RESET');
        $timeout.flush();
        expect(childScope.logs.length).toBe(1);
    });

    it('should unsusbscribe on scope destroy', function() {
        expect(clientLoggerServiceMock.logs.observers.length).toBe(1);
        $rootScope.$destroy();
        expect(clientLoggerServiceMock.logs.observers.length).toBe(0);
    });

    it('should close the panel', function() {
      editorToolbarService.showLogConsole = true;
      childScope.closePanel();
      expect(editorToolbarService.showLogConsole).toBe(false);
    });
});
