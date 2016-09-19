'use strict';

describe('Directive: rosReconnecting', function() {

    beforeEach(module('exdFrontendApp'));
    var $rootScope, element, onReconnectingCallback,
        unsubscribeRos = jasmine.createSpy('unsubscribeRos');


    beforeEach(inject(function(_$rootScope_, $httpBackend, $compile) {
        $rootScope = _$rootScope_;
        window.ROSLIB.PhoenixRos.onReconnecting = jasmine.createSpy('onReconnecting')
            .andCallFake(function(fn) {
                onReconnectingCallback = fn;
                return unsubscribeRos;
            });

        $httpBackend.whenGET(new RegExp('.*')).respond(200);
        element = $compile('<div class="ros-reconnecting"></div>')($rootScope);
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

    it('should unsusbscribe on scope destroy', function() {
        $rootScope.$destroy();
        expect(unsubscribeRos).toHaveBeenCalled();
    });
});