(function() {
    'use strict';

    describe('Directive: cluster-reservation-alert', function() {

        beforeEach(module('clusterReservation'));
        beforeEach(module('exd.templates'));
        beforeEach(module('nrpUserMock'));

        var scope, nrpUser,
            $window, $timeout;

        beforeEach(inject(function($rootScope, $compile, _nrpUser_, _$window_, _$timeout_) {
            nrpUser = _nrpUser_;
            $window = _$window_;
            $timeout = _$timeout_;
            spyOn($window.sessionStorage, 'getItem').and.returnValue(null);
            spyOn($window.sessionStorage, 'setItem');

            var element = $compile('<cluster-reservation-alert></cluster-reservation-alert>')($rootScope);
            $rootScope.$digest();
            scope = element.scope();
        }));

        it('should call nrpUser.getCurrentUserInfo() once', function() {
            expect(nrpUser.isMemberOfClusterReservationGroup.calls.count()).toBe(1);
        });


        it('should call window.sessionStorage.getItem to check if the warning about the reservation form was dismissed', function() {
            expect($window.sessionStorage.getItem).toHaveBeenCalledWith('reservationForm');
            expect($window.sessionStorage.getItem.calls.count()).toBe(1);
            expect(scope.dismissReservationForm).toBe(false);
        });


        it('should call window.sessionStorage.setItem to store the information about the dismissed reservation form', function() {
            scope.dismissClusterReservationForm();
            $timeout.flush();
            expect($window.sessionStorage.setItem).toHaveBeenCalledWith('reservationForm', 'dismissed');
            expect($window.sessionStorage.setItem.calls.count()).toBe(1);
            expect(scope.dismissReservationForm).toBe(true);
        });

        it('should call window.sessionStorage.setItem to store the reservation name', function() {
            scope.clusterReservationName = 'sp10-user-workshop';
            scope.setClusterReservation();
            expect($window.sessionStorage.setItem).toHaveBeenCalledWith('clusterReservation', scope.clusterReservationName);
        });
    });
}());

