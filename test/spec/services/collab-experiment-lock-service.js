'use strict';

describe('Services: collab-experiment-lock-service', function () {

    var FAKE_CONTEXT_ID = 'FAKE_CONTEXT_ID';
    var FAKE_EXPERIMENT_FOLDER_ID = 'FAKE_EXPERIMENT_FOLDER_ID';
    var FAKE_USER_ID = 'FAKE_USER_ID';
    var FAKE_LOCK_FILE_ID = 'FAKE_LOCK_FILE_ID';
    var FAKE_USER_NAME = 'FAKE_USER_NAME';
    var POLLING_TIME = 10 * 1000;//10s

    var httpBackend, bbpConfig, collabExperimentLockService, $rootScope, collabConfigResponse, $interval,
        createdLockService, userBaseUrl;

    // loads the service to test and mock the necessary service
    beforeEach(module('exdFrontendApp'));

    beforeEach(inject(function (
        _$httpBackend_,
        _bbpConfig_,
        _collabExperimentLockService_,
        _$rootScope_,
        _$interval_) {
        httpBackend = _$httpBackend_;
        bbpConfig = _bbpConfig_;
        collabExperimentLockService = _collabExperimentLockService_;
        $rootScope = _$rootScope_;
        $interval = _$interval_;

        userBaseUrl = bbpConfig.get('api.user.v0');

        collabConfigResponse = httpBackend.whenGET(bbpConfig.get('api.collabContextManagement.url') + '/collab/configuration/' + FAKE_CONTEXT_ID)
            .respond(200, { experimentFolderUUID: FAKE_EXPERIMENT_FOLDER_ID });
        httpBackend.whenGET('views/common/home.html').respond(200);
    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should create a serviceby means of createLockServiceForContext', function () {
        createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
        expect(createdLockService).toBeDefined();
        httpBackend.flush();
    });

    it('should throw an exception if in case of Collab internal error', function () {
        collabConfigResponse.respond(500, '');

        httpBackend.whenGET(userBaseUrl + '/user/me').respond({});
        httpBackend.whenGET(userBaseUrl + '/user/me/groups').respond({});

        createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
        var err;
        createdLockService.isLocked()
            .catch(function (err_) {
                err = err_;
            });
        httpBackend.flush();
        $rootScope.$digest();
        expect(err).toBeDefined();
    });


    describe('createdLockServiceForContext :', function () {

        var lockFileRequest, documentBaseUrl;

        beforeEach(function () {
            documentBaseUrl = bbpConfig.get('api.document.v0');
            lockFileRequest = httpBackend.whenGET(documentBaseUrl + '/folder/' + FAKE_EXPERIMENT_FOLDER_ID + '/children?filter=_name=edit.lock');
        });

        var fileResponse = {
            _createdBy: FAKE_USER_ID,
            _uuid: FAKE_LOCK_FILE_ID,
            _entityType: 'file',
            _createdOn: '2016-05-13T10:58:56.955130'
        };

        it('isLocked should not find a lock', function () {

            lockFileRequest.respond('');

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var lockInfo;
            createdLockService.isLocked().then(
                function (lockInfo_) {
                    lockInfo = lockInfo_;
                });

            httpBackend.flush();
            $rootScope.$digest();
            expect(lockInfo.locked).toBe(false);
        });

        it('polling should not find a lock', function () {

            var lockInfo;
            lockFileRequest.respond('');

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var onLockChangedUnsubscribe = createdLockService.onLockChanged(
                function (lockInfo_) {
                    lockInfo = lockInfo_;
                });
            $interval.flush(POLLING_TIME);
            httpBackend.flush();
            $rootScope.$digest();
            expect(lockInfo.locked).toBe(false);

            lockInfo = undefined;
            onLockChangedUnsubscribe();
            $interval.flush(POLLING_TIME);
            $rootScope.$digest();
            expect(lockInfo).not.toBeDefined();
        });


        it('releaseLock should fail', function () {

            lockFileRequest.respond('');

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var lockInfo;
            createdLockService.releaseLock().then(
                function (lockInfo_) {
                    lockInfo = lockInfo_;
                });

            httpBackend.flush();
            $rootScope.$digest();
            expect(lockInfo).toBe(false);
        });

        it('tryAddLock should create a lock', function () {


            httpBackend.whenPOST(documentBaseUrl + '/file')
                .respond(fileResponse);

            httpBackend.whenPOST(documentBaseUrl + '/file/' + FAKE_LOCK_FILE_ID + '/content/upload')
                .respond(fileResponse);

            lockFileRequest.respond(200, '');

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var lockInfo;
            createdLockService.tryAddLock().then(
                function (lockInfo_) {
                    lockInfo = lockInfo_;
                });

            httpBackend.flush();
            $rootScope.$digest();
            expect(lockInfo.success).toBe(true);
        });

        it('isLocked shoud find a lock', function () {

            httpBackend.whenGET(userBaseUrl + '/user?filter=id=' + FAKE_USER_ID)
                .respond({
                    _embedded: {
                        users: [{
                            id: FAKE_USER_ID,
                            displayName: FAKE_USER_NAME
                        }]
                    }
                });

            lockFileRequest.respond({ result: [fileResponse] });

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var lockObj;
            createdLockService.isLocked().then(
                function (lockObj_) {
                    lockObj = lockObj_;
                });

            httpBackend.flush();
            $rootScope.$digest();
            expect(lockObj.locked).toBe(true);
            expect(lockObj.lockInfo.user.id).toBe(FAKE_USER_ID);
            expect(lockObj.lockInfo.user.displayName).toBe(FAKE_USER_NAME);
        });

        it('polling should find a lock', function () {

            httpBackend.whenGET(userBaseUrl + '/user?filter=id=' + FAKE_USER_ID)
                .respond({
                    _embedded: {
                        users: [{
                            id: FAKE_USER_ID,
                            displayName: FAKE_USER_NAME
                        }]
                    }
                });

            lockFileRequest.respond({ result: [fileResponse] });

            var lockObj;
            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var onLockChangedUnsubscribe = createdLockService.onLockChanged(
                function (lockObj_) {
                    lockObj = lockObj_;
                });
            $interval.flush(POLLING_TIME);
            httpBackend.flush();
            $rootScope.$digest();
            expect(lockObj.locked).toBe(true);
            expect(lockObj.lockInfo.user.id).toBe(FAKE_USER_ID);
            expect(lockObj.lockInfo.user.displayName).toBe(FAKE_USER_NAME);

            lockObj = undefined;
            onLockChangedUnsubscribe();
            $interval.flush(POLLING_TIME);
            $rootScope.$digest();
            expect(lockObj).not.toBeDefined();
        });


        it('tryAddLock should fail', function () {

            httpBackend.whenGET(userBaseUrl + '/user?filter=id=' + FAKE_USER_ID)
                .respond({
                    _embedded: {
                        users: [{
                            id: FAKE_USER_ID,
                            displayName: FAKE_USER_NAME
                        }]
                    }
                });

            lockFileRequest.respond({ result: [fileResponse] });

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var lockInfo;
            createdLockService.tryAddLock().then(
                function (lockInfo_) {
                    lockInfo = lockInfo_;
                });

            httpBackend.flush();
            $rootScope.$digest();
            expect(lockInfo.success).toBe(false);
        });


        it('releaseLock should succeed', function () {

            lockFileRequest.respond({ result: [fileResponse] });

            httpBackend.when('DELETE', documentBaseUrl + '/file/' + FAKE_LOCK_FILE_ID)
                .respond('');

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var lockInfo;
            createdLockService.releaseLock().then(
                function (lockInfo_) {
                    lockInfo = lockInfo_;
                });

            httpBackend.flush();
            $rootScope.$digest();
            expect(lockInfo).toBe(true);
        });


    });
});
