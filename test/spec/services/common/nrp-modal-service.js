(function () {
    'use strict';

    describe('Services: nrpModalService', function () {

        var nrpModalService, $modal, $scope, $q, fakeModal;

        var mockUrl = {
            templateUrl: 'views/esv/robot-upload-dialog.html',
            closable: true,
            scope: $scope,
            windowClass: 'modal-window',
            size: 'lg'
        };

        beforeEach(module('exdFrontendApp'));
        beforeEach(inject(function(_nrpModalService_, _$modal_, _$q_) {
            nrpModalService = _nrpModalService_;
            $modal = _$modal_;
            $q = _$q_;
        }));

        beforeEach(function() {
            spyOn($modal, 'open').and.callFake(function() {
                fakeModal = {
                    close: function() {
                        return;
                    },
                    result: $q.when()
                };
                return fakeModal;
            });

            spyOn(nrpModalService, 'destroyModal').and.callThrough();
        });

        it('should create a modal', function () {

            nrpModalService.createModal(mockUrl);
            //call again to check what happens if the modal already exists
            nrpModalService.createModal(mockUrl);
            expect($modal.open).toHaveBeenCalledWith({
                templateUrl: mockUrl.templateUrl,
                show: true,
                backdrop: 'static',
                scope: mockUrl.scope,
                keyboard: mockUrl.keyboard || mockUrl.closable,
                windowClass: mockUrl.windowClass,
                size: mockUrl.size
            });
        });

        it('should destroy a modal', function () {

            nrpModalService.createModal(mockUrl);
            nrpModalService.destroyModal();
            expect(nrpModalService.destroyModal).toHaveBeenCalled();
        });
    });
}());