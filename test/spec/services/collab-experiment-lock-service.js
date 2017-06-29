'use strict';

describe('Services: collab-experiment-lock-service', function () {

    var FAKE_CONTEXT_ID = 'FAKE_CONTEXT_ID';
    var FAKE_EXPERIMENT_FOLDER_ID = 'FAKE_EXPERIMENT_FOLDER_ID';
    var FAKE_USER_ID = 'FAKE_USER_ID';
    var FAKE_LOCK_FILE_ID = 'FAKE_LOCK_FILE_ID';
    var FAKE_USER_NAME = 'FAKE_USER_NAME';
    var POLLING_TIME = 10 * 1000;//10s

    var httpBackend, bbpConfig, collabExperimentLockService, $rootScope, $q, collabConfigResponse, $interval,
        createdLockService, userBaseUrl, LOCK_FILE_VALIDITY_MAX_AGE_HOURS, clbStorage;

    // loads the service to test and mock the necessary service
    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));
    beforeEach(inject(function (
        _$httpBackend_,
        _bbpConfig_,
        _collabExperimentLockService_,
        _$rootScope_,
        _$interval_,
        _$q_,
        _LOCK_FILE_VALIDITY_MAX_AGE_HOURS_, _clbStorage_) {
        httpBackend = _$httpBackend_;
        bbpConfig = _bbpConfig_;
        collabExperimentLockService = _collabExperimentLockService_;
        $rootScope = _$rootScope_;
        $interval = _$interval_;
        $q = _$q_;
        LOCK_FILE_VALIDITY_MAX_AGE_HOURS = _LOCK_FILE_VALIDITY_MAX_AGE_HOURS_;
        clbStorage = _clbStorage_;

        userBaseUrl = bbpConfig.get('api.user.v0');


        httpBackend.whenGET(userBaseUrl + '/user/me').respond({});
        httpBackend.whenGET(userBaseUrl + '/user/me/groups').respond({});

        collabConfigResponse = httpBackend.whenGET(bbpConfig.get('api.collabContextManagement.url') + '/collab/configuration/' + FAKE_CONTEXT_ID)
            .respond(200, { experimentFolderUUID: FAKE_EXPERIMENT_FOLDER_ID });
    }));

    // afterEach(function () {
    //     httpBackend.verifyNoOutstandingExpectation();
    //     httpBackend.verifyNoOutstandingRequest();
    // });

    it('should create a serviceby means of createLockServiceForContext', function () {
        createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
        expect(createdLockService).toBeDefined();
        httpBackend.flush();
    });

    it('should throw an exception if in case of Collab internal error', function () {
        collabConfigResponse.respond(500, '');


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

        var lockFileRequest, documentBaseUrl, collabFolderAPIService;

        beforeEach(inject(function(_collabFolderAPIService_) {
            collabFolderAPIService = _collabFolderAPIService_;
        }));

        beforeEach(function () {
            documentBaseUrl = bbpConfig.get('api.document.v1');
            lockFileRequest = httpBackend.whenGET(documentBaseUrl + '/folder/' + FAKE_EXPERIMENT_FOLDER_ID + '/children/?name=edit.lock');

            httpBackend.whenGET(userBaseUrl + '/user/search?pageSize=300&id=' + FAKE_USER_ID)
                .respond({
                    _embedded: {
                        users: [{
                            id: FAKE_USER_ID,
                            displayName: FAKE_USER_NAME
                        }]
                    }
                });
        });
        /*jshint camelcase: false */
        var fileResponse = {
            created_by: FAKE_USER_ID,
            uuid: FAKE_LOCK_FILE_ID,
            entity_type: 'file',
            created_on: new Date()
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


        it('releaseLock should fail', function (done) {

            lockFileRequest.respond('');

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            createdLockService.releaseLock().catch(done);

            httpBackend.flush();
        });

        it('tryAddLock should create a lock', function () {


            httpBackend.whenPOST(documentBaseUrl + '/file/')
                .respond(fileResponse);

            httpBackend.whenPOST(documentBaseUrl + '/file/' + FAKE_LOCK_FILE_ID + '/content/upload/')
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
            lockFileRequest.respond({ results: [fileResponse] });

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

        it('lock too old shoud be removed and ignored', function() {
            /*jshint camelcase: false */
            lockFileRequest.respond({
                results: [
                    _.assignIn({}, fileResponse, {
                        created_on: moment().subtract(LOCK_FILE_VALIDITY_MAX_AGE_HOURS, 'hours')
                    })
                ]
            });

            collabFolderAPIService.deleteFile = jasmine.createSpy('deleteFile').and.returnValue($q.when());

            var lockObj;
            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            createdLockService.isLocked().then(
                function(lockObj_) {
                    lockObj = lockObj_;
                });

            httpBackend.flush();
            $rootScope.$digest();
            expect(lockObj.locked).toBe(false);

            expect(collabFolderAPIService.deleteFile.calls.count()).toBe(1);
            expect(collabFolderAPIService.deleteFile).toHaveBeenCalledWith(FAKE_EXPERIMENT_FOLDER_ID, 'edit.lock');
        });

        it('polling should find a lock', function () {

            lockFileRequest.respond({ results: [fileResponse] });

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

            lockFileRequest.respond({ results: [fileResponse] });

            createdLockService = collabExperimentLockService.createLockServiceForContext(FAKE_CONTEXT_ID);
            var lockInfo;
            collabFolderAPIService.createFolderFile = jasmine.createSpy('createFolderFile').and.returnValue($q.reject());
            createdLockService.tryAddLock().then(
                function (lockInfo_) {
                    lockInfo = lockInfo_;
                });

            httpBackend.flush();
            $rootScope.$digest();
            expect(lockInfo.success).toBe(false);
        });


        it('releaseLock should succeed', function () {

            lockFileRequest.respond({ results: [fileResponse] });

            httpBackend.when('DELETE', documentBaseUrl + '/file/' + FAKE_LOCK_FILE_ID + '/')
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
