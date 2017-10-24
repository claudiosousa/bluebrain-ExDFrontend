'use strict';

describe('Services: saveErrorsService', function() {
  var CONTEXT_ID = 'CONTEXT_ID';
  var DIRTY_TYPE = 'dirtyType';
  var DIRTY_DATA = 'dirtyData';

  var storageServer, tempFileService, stateParams, previouslySavedFile;
  var $rootScope, saveErrorsService, SAVE_FILE, environmentService;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(
    module(function($provide) {
      /*globals $q */
      tempFileService = {
        saveDirtyData: jasmine
          .createSpy('saveDirtyData')
          .and.returnValue($q.when()),
        checkSavedWork: jasmine
          .createSpy('checkSavedWork')
          .and.callFake(function() {
            return $q.when();
          }),
        removeSavedWork: jasmine.createSpy('removeSavedWork')
      };
      storageServer = {
        getFolderFile: jasmine
          .createSpy('getFolderFile')
          .and.callFake(function() {
            return $q.when(
              /* eslint-disable camelcase */
              previouslySavedFile !== undefined
                ? { created_by: 'userid', uuid: 'uuid' }
                : null
            );
          }),
        setFileContent: jasmine
          .createSpy('setFileContent')
          .and.callFake(function() {
            return { uuid: 'uuid' };
          }),
        getFileContent: jasmine
          .createSpy('getFileContent')
          .and.callFake(function() {
            return $q.when({ uuid: 'uuid', data: previouslySavedFile });
          })
      };
      stateParams = { ctx: CONTEXT_ID };

      $provide.value('tempFileService', tempFileService);
      $provide.value('storageServer', storageServer);
      $provide.value('$stateParams', stateParams);
    })
  );

  beforeEach(
    inject(function(
      $httpBackend,
      _$rootScope_,
      _$q_,
      _saveErrorsService_,
      _SAVE_FILE_,
      _environmentService_
    ) {
      $rootScope = _$rootScope_;
      saveErrorsService = _saveErrorsService_;
      SAVE_FILE = _SAVE_FILE_;
      environmentService = _environmentService_;
      environmentService.setPrivateExperiment(true);
    })
  );

  beforeEach(function() {
    //default behavior
    previouslySavedFile = undefined; //by default, there is now previously auto saved file
  });

  it('should call save correctly file', function() {
    saveErrorsService.saveDirtyData(DIRTY_TYPE, DIRTY_DATA);
    var obj = {};
    obj[DIRTY_TYPE] = DIRTY_DATA;
    expect(tempFileService.saveDirtyData).toHaveBeenCalledWith(
      SAVE_FILE,
      false,
      obj,
      DIRTY_TYPE
    );
  });

  it('should update error file when removing some data', function() {
    previouslySavedFile = { other: 'otherdata' };
    previouslySavedFile[DIRTY_TYPE] = 'some data';
    saveErrorsService.clearDirty(DIRTY_TYPE);

    $rootScope.$digest();
    expect(storageServer.getFileContent).toHaveBeenCalled();
    expect(storageServer.setFileContent).toHaveBeenCalled();
    expect(tempFileService.removeSavedWork).not.toHaveBeenCalled();
  });

  it('should remove error file when removing some data and file is empty', function() {
    previouslySavedFile = {};
    previouslySavedFile[DIRTY_TYPE] = 'some data';
    saveErrorsService.clearDirty(DIRTY_TYPE);

    $rootScope.$digest();
    expect(storageServer.getFileContent).toHaveBeenCalled();
    expect(storageServer.setFileContent).not.toHaveBeenCalled();
    expect(tempFileService.removeSavedWork).toHaveBeenCalled();
  });

  it('should call checkSavedWork only once', function() {
    saveErrorsService.getErrorSavedWork();
    var dirtyCallback = jasmine.createSpy('dirtyCallback');

    saveErrorsService.registerCallback(DIRTY_TYPE, dirtyCallback);
    var obj = {};
    obj[DIRTY_TYPE] = dirtyCallback;
    expect(tempFileService.checkSavedWork).toHaveBeenCalledWith(SAVE_FILE, obj);
    $rootScope.$digest();

    tempFileService.checkSavedWork.calls.reset();
    saveErrorsService.getErrorSavedWork();
    expect(tempFileService.checkSavedWork).not.toHaveBeenCalled();
    $rootScope.$digest();
  });
});
