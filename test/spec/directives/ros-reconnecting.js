'use strict';

describe('Directive: rosReconnecting', function() {

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));
    var $rootScope, $timeout, $q, element, onReconnectingCallback, RECONNECTING_TIMEOUT_MS,
        unsubscribeRos = jasmine.createSpy('unsubscribeRos');

    var hbpDialogFactorMock = {
        alert: jasmine.createSpy('hbpDialogFactor_alert').and.callFake(function() { return $q.resolve(); })
    };

    beforeEach(module(function($provide) {
        $provide.value('hbpDialogFactory', hbpDialogFactorMock);
    }));

    beforeEach(inject(function(_$rootScope_, $httpBackend, $compile, _$timeout_, _$q_, _RECONNECTING_TIMEOUT_MS_) {
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        $q = _$q_;
        RECONNECTING_TIMEOUT_MS = _RECONNECTING_TIMEOUT_MS_;

        window.ROSLIB.PhoenixRos.onReconnecting = jasmine.createSpy('onReconnecting')
            .and.callFake(function(fn) {
                onReconnectingCallback = fn;
                return unsubscribeRos;
            });


        $rootScope.exit = jasmine.createSpy('exit');
        element = $compile('<div class="ros-reconnecting" on-reconnect-timeout="exit()"></div>')($rootScope);
        $rootScope.$digest();
    }));

    it('should call window.ROSLIB.PhoenixRos.onReconnecting', function() {
        expect(window.ROSLIB.PhoenixRos.onReconnecting).toHaveBeenCalled();
    });

    it('should display if reconnecting', function() {
        expect(element.css('display')).toBe('');
        onReconnectingCallback(true);
        expect(element.css('display')).toBe('block');
    });

    it('should hide if not reconnecting', function() {
        element.css('display', 'block');
        expect(element.css('display')).toBe('block');
        onReconnectingCallback(false);
        expect(element.css('display')).toBe('none');
    });

    it('should trigger alert, unsubscribe and exit on reconnecting timeout', function() {
        onReconnectingCallback(true);
        $timeout.flush(RECONNECTING_TIMEOUT_MS);
        $rootScope.$digest();

        expect(unsubscribeRos).toHaveBeenCalled();
        expect(hbpDialogFactorMock.alert).toHaveBeenCalled();
        expect($rootScope.exit).toHaveBeenCalled();
    });

    it('should unsusbscribe on scope destroy', function() {
        $rootScope.$destroy();
        expect(unsubscribeRos).toHaveBeenCalled();
    });

});
