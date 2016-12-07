'use strict';

describe('Services: AutoSaveService', function () {
  var CONTEXT_ID = 'CONTEXT_ID';
  var DIRTY_TYPE = 'dirtyType';
  var DIRTY_DATA = 'dirtyData';

  var collabFolderAPIService, hbpIdentityUserDirectory, hbpDialogFactory, stateParams,
    previouslySavedFile,
    createFileResponse,
    confirmRestoreTempWorkUserReponse;
  var $rootScope, $q, autoSaveService, AUTO_SAVE_INTERVAL;

  var lodash, lodashWindowMock;


  beforeEach(function () {
    lodash = window._;
    lodashWindowMock = {
      setTimeoutFn: angular.noop,
      setTimeout: function (fn) {
        lodashWindowMock.setTimeoutFn = fn;
      },
      Date: {
        now: function () {
          return lodashWindowMock.now;
        }
      }
    };
    window._ = _.runInContext(lodashWindowMock);
  });

  afterEach(function () {
    window._ = lodash;
  });

  beforeEach(module('exdFrontendApp'));

  beforeEach(module(function ($provide) {
    collabFolderAPIService = {
      getExperimentFolderId: jasmine.createSpy('getExperimentFolderId').andCallFake(function () { return $q.when(CONTEXT_ID); }),
      getFolderFile: jasmine.createSpy('getFolderFile').andCallFake(function () {
        return $q.when(previouslySavedFile !== undefined ? { _createdBy: 'userid' } : null);
      }),
      createFolderFile: jasmine.createSpy('createFolderFile').andCallFake(function () { return createFileResponse; }),
      uploadEntity: jasmine.createSpy('uploadEntity'),
      deleteFile: jasmine.createSpy('deleteFile'),
      downloadFile: jasmine.createSpy('downloadFile').andCallFake(function () { return $q.when(previouslySavedFile); })
    };
    hbpIdentityUserDirectory = { get: jasmine.createSpy('get').andCallFake(function () { return $q.when({ userid: {} }); }) };
    hbpDialogFactory = {
      confirm: jasmine.createSpy('confirm').andCallFake(function () { return confirmRestoreTempWorkUserReponse; })
    };
    stateParams = { ctx: CONTEXT_ID };

    $provide.value('collabFolderAPIService', collabFolderAPIService);
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectory);
    $provide.value('hbpDialogFactory', hbpDialogFactory);
    $provide.value('$stateParams', stateParams);
  }));

  beforeEach(inject(function ($httpBackend, _$rootScope_, _$q_, _autoSaveService_, _AUTO_SAVE_INTERVAL_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    autoSaveService = _autoSaveService_;
    AUTO_SAVE_INTERVAL = _AUTO_SAVE_INTERVAL_;

    $httpBackend.whenGET(new RegExp('.*')).respond(200);
  }));

  beforeEach(function () { //default behavior
    lodashWindowMock.now = Date.now(); //ref time for lodash
    previouslySavedFile = undefined; //by default, there is now previously auto saved file
    createFileResponse = $q.when();//succeeds by default
    confirmRestoreTempWorkUserReponse = $q.when();//user says 'yes' by default
  });

  function moveLodashTimeForward(timetoMoveForward) {
    lodashWindowMock.now += timetoMoveForward;
    lodashWindowMock.setTimeoutFn();
  }

  it('should wait before saving the temporary work', function () {
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);

    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
    moveLodashTimeForward(AUTO_SAVE_INTERVAL - 1);
    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
  });

  it('should create a autosaved file for temporary work when dirty', function () {
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);

    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();

    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.createFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.uploadEntity).not.toHaveBeenCalled();
  });

  it('should update autosaved file when auto save file exists', function () {
    previouslySavedFile = 'some previously saved data';
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);

    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();

    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.createFolderFile).not.toHaveBeenCalled();
    expect(collabFolderAPIService.uploadEntity).toHaveBeenCalled();
  });

  it('should retrigger saving work if previous saving attempt failed', function () {
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);

    createFileResponse = $q.reject();
    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();
    $rootScope.$digest();

    expect(collabFolderAPIService.createFolderFile).toHaveBeenCalled();

    collabFolderAPIService.getFolderFile.reset();
    expect(collabFolderAPIService.getFolderFile).not.toHaveBeenCalled();

    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
  });

  it('should not save temporary work if not a collab experiement', function () {
    stateParams.ctx = null;
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);

    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
  });

  it('should delete saved temporary work if the dirty data was cleared', function () {
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);
    autoSaveService.clearDirty(DIRTY_TYPE);

    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    $rootScope.$digest();
    expect(collabFolderAPIService.createFolderFile).not.toHaveBeenCalled();
    expect(collabFolderAPIService.deleteFile).toHaveBeenCalled();
  });

  it('should do nothing when clearDirty outside of collab experiment', function () {
    stateParams.ctx = null;
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);
    autoSaveService.clearDirty(DIRTY_TYPE);

    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    $rootScope.$digest();
    expect(collabFolderAPIService.deleteFile).not.toHaveBeenCalled();
  });

  it('should save temporary work if NOT ALL the dirty data was cleared', function () {

    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);
    autoSaveService.setDirty(DIRTY_TYPE + '2', DIRTY_DATA);
    autoSaveService.clearDirty(DIRTY_TYPE);

    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();
  });

  it('should notify registered callbacks when saved data is found', function () {
    previouslySavedFile = {};
    previouslySavedFile[DIRTY_TYPE] = DIRTY_DATA;

    var dirtyCallback = jasmine.createSpy('dirtyCallback');

    autoSaveService.registerFoundAutoSavedCallback(DIRTY_TYPE, dirtyCallback);
    autoSaveService.checkAutoSavedWork();

    $rootScope.$digest();
    expect(collabFolderAPIService.getExperimentFolderId).toHaveBeenCalled();
    expect(dirtyCallback).toHaveBeenCalled();
  });

  it('should not prompt if not file was found', function () {
    autoSaveService.checkAutoSavedWork();
    $rootScope.$digest();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalled();
    expect(collabFolderAPIService.downloadFile).not.toHaveBeenCalled();

  });

  it('should not notify registered callbacks if no saved data is found', function () {
    previouslySavedFile = false;

    var dirtyCallback = jasmine.createSpy('dirtyCallback');

    autoSaveService.registerFoundAutoSavedCallback(DIRTY_TYPE, dirtyCallback);
    autoSaveService.checkAutoSavedWork();

    $rootScope.$digest();
    expect(dirtyCallback).not.toHaveBeenCalled();
  });

  it('should not retrived saved data if not in a collab experiment', function () {
    stateParams.ctx = null;
    autoSaveService.checkAutoSavedWork();
    $rootScope.$digest();
    expect(collabFolderAPIService.getExperimentFolderId).not.toHaveBeenCalled();
  });

  it('should removed previously saved work if user does not want to restore it', function () {
    previouslySavedFile = {};
    confirmRestoreTempWorkUserReponse = $q.reject();

    autoSaveService.checkAutoSavedWork();

    $rootScope.$digest();
    expect(collabFolderAPIService.deleteFile).toHaveBeenCalled();
  });
});
