'use strict';

describe('Services: AutoSaveService', function () {
  var CONTEXT_ID = 'CONTEXT_ID';
  var DIRTY_TYPE = 'dirtyType';
  var DIRTY_DATA = 'dirtyData';

  var tempFileService, stateParams,
    saveResponse,
    checkResponse;
  var $rootScope, $q, autoSaveService, AUTO_SAVE_INTERVAL, environmentService;

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
  beforeEach(module('exd.templates'));

  beforeEach(module(function ($provide) {
    tempFileService = {
      saveDirtyData: jasmine.createSpy('saveDirtyData').and.callFake(function () { return saveResponse; }),
      checkSavedWork: jasmine.createSpy('checkSavedWork').and.callFake(function(){return checkResponse; }),
      removeSavedWork: jasmine.createSpy('removeSavedWork'),
    };
    stateParams = { ctx: CONTEXT_ID };

    $provide.value('tempFileService', tempFileService);
    $provide.value('$stateParams', stateParams);
  }));

  beforeEach(inject(function ($httpBackend, _$rootScope_, _$q_, _autoSaveService_, _AUTO_SAVE_INTERVAL_, _environmentService_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    autoSaveService = _autoSaveService_;
    AUTO_SAVE_INTERVAL = _AUTO_SAVE_INTERVAL_;
    environmentService = _environmentService_;
    environmentService.setPrivateExperiment(true);
  }));

  beforeEach(function () { //default behavior
    lodashWindowMock.now = Date.now(); //ref time for lodash
    saveResponse = $q.when();//succeeds by default
    checkResponse = $q.when();//user says 'yes' by default
  });

  function moveLodashTimeForward(timetoMoveForward) {
    lodashWindowMock.now += timetoMoveForward;
    lodashWindowMock.setTimeoutFn();
  }

  it('should wait before saving the temporary work', function () {
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);

    expect(tempFileService.saveDirtyData).not.toHaveBeenCalled();
    moveLodashTimeForward(AUTO_SAVE_INTERVAL - 1);
    expect(tempFileService.saveDirtyData).not.toHaveBeenCalled();
  });

  it('should create a autosaved file for temporary work when dirty', function () {
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);
    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(tempFileService.saveDirtyData).toHaveBeenCalled();
  });

  it('should retrigger saving work if previous saving attempt failed', function () {
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);
    saveResponse = $q.reject();

    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(tempFileService.saveDirtyData).toHaveBeenCalled();
    $rootScope.$digest();

    tempFileService.saveDirtyData.calls.reset();
    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    $rootScope.$digest();
    expect(tempFileService.saveDirtyData).toHaveBeenCalled();
  });

  it('should not save temporary work if not a collab experiment', function () {
    environmentService.setPrivateExperiment(false);

    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);

    expect(tempFileService.saveDirtyData).not.toHaveBeenCalled();
    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(tempFileService.saveDirtyData).not.toHaveBeenCalled();
  });

  it('should delete saved temporary work if the dirty data was cleared', function () {
    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);
    autoSaveService.clearDirty(DIRTY_TYPE);

    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    $rootScope.$digest();
    expect(tempFileService.saveDirtyData).not.toHaveBeenCalled();
    expect(tempFileService.removeSavedWork).toHaveBeenCalled();
  });

  it('should do nothing when clearDirty outside of collab experiment', function () {
    environmentService.setPrivateExperiment(false);

    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);
    autoSaveService.clearDirty(DIRTY_TYPE);

    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    $rootScope.$digest();
    expect(tempFileService.removeSavedWork).not.toHaveBeenCalled();
  });

  it('should save temporary work if NOT ALL the dirty data was cleared', function () {

    autoSaveService.setDirty(DIRTY_TYPE, DIRTY_DATA);
    autoSaveService.setDirty(DIRTY_TYPE + '2', DIRTY_DATA);
    autoSaveService.clearDirty(DIRTY_TYPE);

    expect(tempFileService.saveDirtyData).not.toHaveBeenCalled();
    moveLodashTimeForward(AUTO_SAVE_INTERVAL);
    expect(tempFileService.saveDirtyData).toHaveBeenCalled();
  });

  it('should not remove previously saved work if user wants to restore it', function () {

    autoSaveService.checkAutoSavedWork();

    $rootScope.$digest();
    expect(tempFileService.removeSavedWork).not.toHaveBeenCalled();
  });

  it('should removed previously saved work if user does not want to restore it', function () {
    checkResponse = $q.reject();

    autoSaveService.checkAutoSavedWork();

    $rootScope.$digest();
    expect(tempFileService.removeSavedWork).toHaveBeenCalled();
  });
});
