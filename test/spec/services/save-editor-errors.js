'use strict';

describe('Services: saveErrorsService', function () {
  var CONTEXT_ID = 'CONTEXT_ID';
  var DIRTY_TYPE = 'dirtyType';
  var DIRTY_DATA = 'dirtyData';

  var collabFolderAPIService, tempFileService, stateParams,
    previouslySavedFile;
  var $rootScope, $q, saveErrorsService, SAVE_FILE, environmentService;

  beforeEach(module('exdFrontendApp'));

  beforeEach(module(function ($provide) {

    tempFileService = {
      saveDirtyData: jasmine.createSpy('saveDirtyData').and.callFake(function () { return $q.when(); }),
      checkSavedWork: jasmine.createSpy('checkSavedWork').and.callFake(function(){return $q.when(); }),
      removeSavedWork: jasmine.createSpy('removeSavedWork'),
    };

    collabFolderAPIService = {
      getExperimentFolderId: jasmine.createSpy('getExperimentFolderId').and.callFake(function () { return $q.when(CONTEXT_ID); }),
      getFolderFile: jasmine.createSpy('getFolderFile').and.callFake(function () {
        return $q.when(previouslySavedFile !== undefined ? { _createdBy: 'userid' , _uuid: 'uuid'} : null);
      }),
      uploadEntity: jasmine.createSpy('uploadEntity'),
      downloadFile: jasmine.createSpy('downloadFile').and.callFake(function () { return $q.when(previouslySavedFile); })
    };
    stateParams = { ctx: CONTEXT_ID };

    $provide.value('tempFileService', tempFileService);
    $provide.value('collabFolderAPIService', collabFolderAPIService);
    $provide.value('$stateParams', stateParams);
  }));

  beforeEach(inject(function ($httpBackend, _$rootScope_, _$q_, _saveErrorsService_, _SAVE_FILE_, _environmentService_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    saveErrorsService = _saveErrorsService_;
    SAVE_FILE = _SAVE_FILE_;
    environmentService = _environmentService_;
    environmentService.setPrivateExperiment(true);

    $httpBackend.whenGET(new RegExp('.*')).respond(200);
  }));

  beforeEach(function () { //default behavior
    previouslySavedFile = undefined; //by default, there is now previously auto saved file
  });

  it('should call save correctly file', function () {
    saveErrorsService.saveDirtyData(DIRTY_TYPE, DIRTY_DATA);
    var obj = {};
    obj[DIRTY_TYPE] = DIRTY_DATA;
    expect(tempFileService.saveDirtyData).toHaveBeenCalledWith(SAVE_FILE, false, obj, DIRTY_TYPE);
  });

  it('should update error file when removing some data', function () {
    previouslySavedFile = {'other': 'otherdata'};
    previouslySavedFile[DIRTY_TYPE] = 'some data';
    saveErrorsService.clearDirty(DIRTY_TYPE);

    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();

    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.downloadFile).toHaveBeenCalled();
    expect(collabFolderAPIService.uploadEntity).toHaveBeenCalled();
    expect(tempFileService.removeSavedWork).not.toHaveBeenCalled();
  });

  it('should remove error file when removing some data and file is empty', function () {
    previouslySavedFile = {};
    previouslySavedFile[DIRTY_TYPE] = 'some data';
    saveErrorsService.clearDirty(DIRTY_TYPE);

    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();

    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.downloadFile).toHaveBeenCalled();
    expect(collabFolderAPIService.uploadEntity).not.toHaveBeenCalled();
    expect(tempFileService.removeSavedWork).toHaveBeenCalled();
  });

  it('should call checkSavedWork only once', function () {
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

  it('should not delete work if not a collab experiement', function () {
    environmentService.setPrivateExperiment(false);
    saveErrorsService.clearDirty(DIRTY_TYPE);

    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
  });

});
