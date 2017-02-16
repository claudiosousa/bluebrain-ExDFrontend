(function () {
    'use strict';

    describe('Services: donwloadFileService', function () {

        var downloadFileService;
        beforeEach(module('exdFrontendApp'));
        beforeEach(inject(function (_downloadFileService_) {
            downloadFileService = _downloadFileService_;
        }));

        it('should create a dummy anchor and click it when downloading a file', function () {

            var dummyAnchorElement = {
                style: {},
                click: jasmine.createSpy('click')
            };
            spyOn(document, 'createElement').and.callFake(function () {
                return dummyAnchorElement;
            });
            spyOn(document.body, 'appendChild');
            spyOn(document.body, 'removeChild');

            downloadFileService.downloadFile('/http://www.neurorobotics-dev/','my_file_name');
            expect(dummyAnchorElement.download).toBe('my_file_name');
            expect(document.body.appendChild).toHaveBeenCalled();
            expect(document.body.removeChild).toHaveBeenCalledWith(dummyAnchorElement);
            expect(dummyAnchorElement.click).toHaveBeenCalled();
        });
    });
} ());