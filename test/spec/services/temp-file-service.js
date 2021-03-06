'use strict';

describe('Services: tempFileService', function () {
  var CONTEXT_ID = 'CONTEXT_ID';
  var DIRTY_TYPE = 'dirtyType';
  var DIRTY_DATA = 'dirtyData';

  var collabFolderAPIService, hbpIdentityUserDirectory, hbpDialogFactory, stateParams,
    previouslySavedFile,
    createFileResponse,
    confirmRestoreTempWorkUserReponse;
  var $rootScope, $q, tempFileService;

  beforeEach(module('exdFrontendApp'));

  beforeEach(module(function ($provide) {
    collabFolderAPIService = {
      getExperimentFolderId: jasmine.createSpy('getExperimentFolderId').and.callFake(function () { return $q.when(CONTEXT_ID); }),
      getFolderFile: jasmine.createSpy('getFolderFile').and.callFake(function () {
        return $q.when(previouslySavedFile !== undefined ? { _createdBy: 'userid' } : null);
      }),
      createFolderFile: jasmine.createSpy('createFolderFile').and.callFake(function () { return createFileResponse; }),
      uploadEntity: jasmine.createSpy('uploadEntity'),
      deleteFile: jasmine.createSpy('deleteFile'),
      downloadFile: jasmine.createSpy('downloadFile').and.callFake(function () { return $q.when(previouslySavedFile); })
    };
    hbpIdentityUserDirectory = { get: jasmine.createSpy('get').and.callFake(function () { return $q.when({ userid: {} }); }) };
    hbpDialogFactory = {
      confirm: jasmine.createSpy('confirm').and.callFake(function () { return confirmRestoreTempWorkUserReponse; })
    };
    stateParams = { ctx: CONTEXT_ID };

    $provide.value('collabFolderAPIService', collabFolderAPIService);
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectory);
    $provide.value('hbpDialogFactory', hbpDialogFactory);
    $provide.value('$stateParams', stateParams);
  }));

  beforeEach(inject(function ($httpBackend, _$rootScope_, _$q_, _tempFileService_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    tempFileService = _tempFileService_;

    $httpBackend.whenGET(new RegExp('.*')).respond(200);
  }));

  beforeEach(function () { //default behavior
    previouslySavedFile = undefined; //by default, there is now previously auto saved file
    createFileResponse = $q.when();//succeeds by default
    confirmRestoreTempWorkUserReponse = $q.when();//user says 'yes' by default
  });

  it('should create a file for temporary work when saveDirtyData called', function () {
    tempFileService.saveDirtyData('filename', true, DIRTY_TYPE, DIRTY_DATA);
    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();

    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.createFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.uploadEntity).not.toHaveBeenCalled();
  });

  it('should replace file if it already exists', function () {
    previouslySavedFile = 'some previously saved data';
    tempFileService.saveDirtyData('filename', true, DIRTY_TYPE, DIRTY_DATA);

    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();

    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.createFolderFile).not.toHaveBeenCalled();
    expect(collabFolderAPIService.uploadEntity).toHaveBeenCalled();
  });

  it('should replace data if overwrite flag is set to false', function () {
    previouslySavedFile = {'other_data': 'this'};
    tempFileService.saveDirtyData('filename', false, DIRTY_TYPE, DIRTY_DATA);

    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();

    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.downloadFile).toHaveBeenCalled();
    expect(collabFolderAPIService.createFolderFile).not.toHaveBeenCalled();
    expect(collabFolderAPIService.uploadEntity).toHaveBeenCalled();
  });

  it('should not save temporary work if not a collab experiement', function () {
    stateParams.ctx = null;
    tempFileService.saveDirtyData('filename', true, DIRTY_TYPE, DIRTY_DATA);

    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
  });

  it('should remove file when requested', function () {
    tempFileService.removeSavedWork('filename');

    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();
    $rootScope.$digest();
    expect(collabFolderAPIService.deleteFile).toHaveBeenCalled();
  });

  it('should do nothing when removeSavedWork outside of collab experiment', function () {
    stateParams.ctx = null;
    tempFileService.removeSavedWork('filename');
    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
    $rootScope.$digest();
    expect(collabFolderAPIService.deleteFile).not.toHaveBeenCalled();
  });

  it('should notify registered callbacks when saved data is found', function () {
    previouslySavedFile = {};
    previouslySavedFile[DIRTY_TYPE] = DIRTY_DATA;

    var dirtyCallback = jasmine.createSpy('dirtyCallback');
    var callbacks ={};
    callbacks[DIRTY_TYPE] = dirtyCallback;
    tempFileService.checkSavedWork('filename', callbacks);

    $rootScope.$digest();
    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();
    expect(dirtyCallback).toHaveBeenCalled();
  });

  it('should not prompt if not file was found', function () {
    tempFileService.checkSavedWork('filename', {});
    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.downloadFile).not.toHaveBeenCalled();

  });

  it('should not notify registered callbacks if no saved data is found', function () {
    previouslySavedFile = false;

    var dirtyCallback = jasmine.createSpy('dirtyCallback');
    var callbacks ={};
    callbacks[DIRTY_TYPE] = dirtyCallback;
    tempFileService.checkSavedWork('filename', callbacks);

    $rootScope.$digest();
    expect(dirtyCallback).not.toHaveBeenCalled();
  });

  it('should not retrived saved data if not in a collab experiment', function () {
    stateParams.ctx = null;
    tempFileService.checkSavedWork();
    $rootScope.$digest();
    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
  });

  it('should only show dialog if requested', function () {
    previouslySavedFile = {};

    tempFileService.checkSavedWork('filename', {}, false);

    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).not.toHaveBeenCalled();

    tempFileService.checkSavedWork('filename', {}, true);
    $rootScope.$digest();
    expect(hbpDialogFactory.confirm).toHaveBeenCalled();
  });
});
