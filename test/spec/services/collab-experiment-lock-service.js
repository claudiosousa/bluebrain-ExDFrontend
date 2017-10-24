'use strict';

describe('Services: collab-experiment-lock-service', function() {
  var FAKE_CONTEXT_ID = 'FAKE_CONTEXT_ID';
  var FAKE_EXPERIMENT_FOLDER_ID = 'FAKE_EXPERIMENT_FOLDER_ID';
  var FAKE_USER_ID = 'FAKE_USER_ID';
  var FAKE_LOCK_FILE_ID = 'FAKE_LOCK_FILE_ID';
  var FAKE_USER_NAME = 'FAKE_USER_NAME';
  var POLLING_TIME = 10 * 1000; //10s

  var httpBackend,
    bbpConfig,
    collabExperimentLockService,
    $rootScope,
    $q,
    collabConfigResponse,
    $interval,
    nrpUser,
    createdLockService,
    userBaseUrl,
    LOCK_FILE_VALIDITY_MAX_AGE_HOURS,
    clbStorage,
    lockFileRequest;

  // loads the service to test and mock the necessary service
  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(
    inject(function(
      _$httpBackend_,
      _bbpConfig_,
      _collabExperimentLockService_,
      _$rootScope_,
      _$interval_,
      _$q_,
      _LOCK_FILE_VALIDITY_MAX_AGE_HOURS_,
      _clbStorage_,
      _nrpUser_
    ) {
      httpBackend = _$httpBackend_;
      bbpConfig = _bbpConfig_;
      collabExperimentLockService = _collabExperimentLockService_;
      $rootScope = _$rootScope_;
      $interval = _$interval_;
      $q = _$q_;
      LOCK_FILE_VALIDITY_MAX_AGE_HOURS = _LOCK_FILE_VALIDITY_MAX_AGE_HOURS_;
      clbStorage = _clbStorage_;
      nrpUser = _nrpUser_;

      userBaseUrl = bbpConfig.get('api.user.v0');

      spyOn(nrpUser, 'getCurrentUser').and.callFake(function() {
        return window.$q.when('id');
      });
      httpBackend.whenGET(userBaseUrl + '/user/me').respond({});
      httpBackend.whenGET(userBaseUrl + '/user/me/groups').respond({});

      collabConfigResponse = httpBackend
        .whenGET(
          bbpConfig.get('api.collabContextManagement.url') +
            '/collab/configuration/' +
            FAKE_CONTEXT_ID
        )
        .respond(200, { experimentFolderUUID: FAKE_EXPERIMENT_FOLDER_ID });
      lockFileRequest = httpBackend
        .whenGET('http://proxy/storage/FAKE_CONTEXT_ID/edit.lock?byname=true')
        .respond(200);
    })
  );

  // afterEach(function () {
  //     httpBackend.verifyNoOutstandingExpectation();
  //     httpBackend.verifyNoOutstandingRequest();
  // });

  it('should create a serviceby means of createLockServiceForExperimentId', function() {
    createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
      FAKE_CONTEXT_ID
    );
    expect(createdLockService).toBeDefined();
  });

  it('should throw an exception if in case of Collab internal error', function() {
    lockFileRequest.respond(500, '');

    createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
      FAKE_CONTEXT_ID
    );
    var err;
    createdLockService.isLocked().catch(function(err_) {
      err = err_;
    });
    httpBackend.flush();
    $rootScope.$digest();
    expect(err).toBeDefined();
  });

  describe('createdLockServiceForContext :', function() {
    var documentBaseUrl, storageServer;

    beforeEach(
      inject(function(_storageServer_) {
        storageServer = _storageServer_;
      })
    );

    beforeEach(function() {
      documentBaseUrl = bbpConfig.get('api.document.v1');
      lockFileRequest = httpBackend.whenGET(
        documentBaseUrl +
          '/folder/' +
          FAKE_EXPERIMENT_FOLDER_ID +
          '/children/?name=edit.lock'
      );
    });
    /* eslint-disable camelcase */
    var fileResponse = {
      created_by: FAKE_USER_ID,
      uuid: FAKE_LOCK_FILE_ID,
      entity_type: 'file',
      created_on: new Date()
    };
    /* eslint-enable camelcase */

    it('isLocked should not find a lock', function() {
      lockFileRequest.respond('');

      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_CONTEXT_ID
      );
      var lockInfo;
      createdLockService.isLocked().then(function(lockInfo_) {
        lockInfo = lockInfo_;
      });

      httpBackend.flush();
      $rootScope.$digest();
      expect(lockInfo.locked).toBe(false);
    });

    it('polling should not find a lock', function() {
      var lockInfo;
      lockFileRequest.respond('');

      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_CONTEXT_ID
      );
      var onLockChangedUnsubscribe = createdLockService.onLockChanged(function(
        lockInfo_
      ) {
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

    it('releaseLock should fail', function(done) {
      httpBackend
        .when(
          'DELETE',
          'http://proxy/storage/FAKE_CONTEXT_ID/edit.lock?byname=true&type=file'
        )
        .respond(500);

      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_CONTEXT_ID
      );
      createdLockService.releaseLock().catch(done);

      httpBackend.flush();
    });

    it('tryAddLock should create a lock', function() {
      spyOn(storageServer, 'setFileContent').and.returnValue(
        window.$q.when({ uuid: 'fakeuuid' })
      );

      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_CONTEXT_ID
      );
      var lockInfo;
      createdLockService.tryAddLock().then(function(lockInfo_) {
        lockInfo = lockInfo_;
      });

      $rootScope.$digest();
      expect(lockInfo.success).toBe(true);
    });

    it('isLocked shoud find a lock', function() {
      spyOn(storageServer, 'getFileContent').and.returnValue(
        window.$q.when({
          uuid: FAKE_USER_ID,
          data: JSON.stringify({ userId: FAKE_USER_ID, date: Date.now() })
        })
      );
      spyOn(nrpUser, 'getOwnerDisplayName').and.returnValue(
        window.$q.when(FAKE_USER_NAME)
      );

      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_CONTEXT_ID
      );

      var lockObj;
      createdLockService.isLocked().then(function(lockObj_) {
        lockObj = lockObj_;
      });

      $rootScope.$digest();
      expect(lockObj.locked).toBe(true);
      expect(lockObj.lockInfo.user.id).toBe(FAKE_USER_ID);
      expect(lockObj.lockInfo.user.displayName).toBe(FAKE_USER_NAME);
    });

    it('lock too old shoud be removed and ignored', function() {
      spyOn(storageServer, 'getFileContent').and.returnValue(
        window.$q.when({
          uuid: FAKE_USER_ID,
          data: JSON.stringify({
            userId: FAKE_USER_ID,
            date: moment().subtract(LOCK_FILE_VALIDITY_MAX_AGE_HOURS, 'hours')
          })
        })
      );

      storageServer.deleteFile = jasmine
        .createSpy('deleteFile')
        .and.returnValue($q.when());

      var lockObj;
      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_EXPERIMENT_FOLDER_ID
      );
      createdLockService.isLocked().then(function(lockObj_) {
        lockObj = lockObj_;
      });

      httpBackend.flush();
      $rootScope.$digest();
      expect(lockObj.locked).toBe(false);

      expect(storageServer.deleteFile.calls.count()).toBe(1);
      expect(storageServer.deleteFile).toHaveBeenCalledWith(
        FAKE_EXPERIMENT_FOLDER_ID,
        'edit.lock',
        true
      );
    });

    it('polling should find a lock', function() {
      spyOn(storageServer, 'getFileContent').and.returnValue(
        window.$q.when({
          uuid: FAKE_USER_ID,
          data: JSON.stringify({ userId: FAKE_USER_ID, date: Date.now() })
        })
      );
      spyOn(nrpUser, 'getOwnerDisplayName').and.returnValue(
        window.$q.when(FAKE_USER_NAME)
      );

      var lockObj;
      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_CONTEXT_ID
      );
      var onLockChangedUnsubscribe = createdLockService.onLockChanged(function(
        lockObj_
      ) {
        lockObj = lockObj_;
      });
      $interval.flush(POLLING_TIME);
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

    it('tryAddLock should fail', function() {
      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_CONTEXT_ID
      );
      spyOn(storageServer, 'getFileContent').and.returnValue(
        window.$q.when({})
      );
      spyOn(storageServer, 'setFileContent').and.returnValue($q.reject());
      var lockinfo;
      createdLockService.tryAddLock().then(function(_lockinfo) {
        lockinfo = _lockinfo;
      });

      $rootScope.$digest();
      $rootScope.$digest();
      expect(lockinfo.success).toBe(true);
    });

    it('releaseLock should succeed', function() {
      lockFileRequest.respond({ results: [fileResponse] });

      httpBackend
        .when(
          'DELETE',
          'http://proxy/storage/FAKE_CONTEXT_ID/edit.lock?byname=true&type=file'
        )
        .respond(200);

      createdLockService = collabExperimentLockService.createLockServiceForExperimentId(
        FAKE_CONTEXT_ID
      );
      var succeedLock = jasmine.createSpy('succeedLock');
      createdLockService.releaseLock().then(succeedLock);

      httpBackend.flush();
      $rootScope.$digest();
      expect(succeedLock).toHaveBeenCalled();
    });
  });
});
