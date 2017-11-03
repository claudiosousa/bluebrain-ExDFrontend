'use strict';

describe('Services: tempFileService', function() {
  var CONTEXT_ID = 'CONTEXT_ID';
  var DIRTY_TYPE = 'dirtyType';
  var DIRTY_DATA = 'dirtyData';

  var storageServer,
    nrpModalService,
    stateParams,
    previouslySavedFile,
    environmentService;
  var $rootScope, tempFileService, $q;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(
    module(function($provide) {
      storageServer = {
        setFileContent: jasmine.createSpy('setFileContent'),
        getCurrentUser: jasmine
          .createSpy('getCurrentUser')
          .and.callFake(function() {
            return $q.when({ id: 'ownerid' });
          }),
        getUser: jasmine.createSpy('getUser').and.callFake(function() {
          return $q.when({ displayName: 'ownerid' });
        }),
        deleteFile: jasmine.createSpy('deleteFile'),
        getFileContent: jasmine
          .createSpy('getFileContent')
          .and.callFake(function() {
            return previouslySavedFile
              ? $q.when({ uuid: 'uuid', data: previouslySavedFile })
              : $q.when({});
          })
      };

      nrpModalService = {
        createModal: jasmine.createSpy('confirm').and.callFake(function() {
          return $q.when();
        })
      };
      stateParams = { ctx: CONTEXT_ID };

      $provide.value('storageServer', storageServer);
      $provide.value('nrpModalService', nrpModalService);
      $provide.value('$stateParams', stateParams);
    })
  );

  beforeEach(
    inject(function(
      $httpBackend,
      _$rootScope_,
      _$q_,
      _tempFileService_,
      _environmentService_
    ) {
      $rootScope = _$rootScope_;
      $q = _$q_;

      tempFileService = _tempFileService_;
      environmentService = _environmentService_;
      environmentService.setPrivateExperiment(true);

      previouslySavedFile = undefined; //by default, there is now previously auto saved file
    })
  );

  it('should create a file for temporary work when saveDirtyData called', function() {
    tempFileService.saveDirtyData('filename', true, DIRTY_TYPE, DIRTY_DATA);

    $rootScope.$digest();
    expect(storageServer.setFileContent).toHaveBeenCalled();
  });

  it('should replace file if it already exists', function() {
    previouslySavedFile = 'some previously saved data';
    tempFileService.saveDirtyData('filename', true, DIRTY_TYPE, DIRTY_DATA);

    $rootScope.$digest();
    expect(storageServer.setFileContent).toHaveBeenCalled();
  });

  it('should replace data if overwrite flag is set to false', function() {
    //eslint-disable-next-line camelcase
    previouslySavedFile = JSON.stringify({ other_data: 'this' });
    tempFileService.saveDirtyData('filename', false, DIRTY_TYPE, DIRTY_DATA);

    $rootScope.$digest();
    expect(storageServer.getFileContent).toHaveBeenCalled();
    expect(storageServer.setFileContent).toHaveBeenCalled();
  });

  it('should not save temporary work if not a collab experiement', function() {
    environmentService.setPrivateExperiment(false);
    tempFileService.saveDirtyData('filename', true, DIRTY_TYPE, DIRTY_DATA);

    expect(storageServer.setFileContent).not.toHaveBeenCalled();
  });

  it('should remove file when requested', function() {
    tempFileService.removeSavedWork('filename');

    $rootScope.$digest();
    expect(storageServer.deleteFile).toHaveBeenCalled();
  });

  it('should do nothing when removeSavedWork outside of collab experiment', function() {
    environmentService.setPrivateExperiment(false);
    tempFileService.removeSavedWork('filename');
    $rootScope.$digest();
    expect(storageServer.deleteFile).not.toHaveBeenCalled();
  });

  it('should notify registered callbacks when saved data is found', function() {
    var savedData = {};
    savedData[DIRTY_TYPE] = DIRTY_DATA;
    previouslySavedFile = JSON.stringify({
      //eslint-disable-next-line camelcase
      __owner_id: 'owner',
      data: savedData
    });

    var dirtyCallback = jasmine.createSpy('dirtyCallback');
    var callbacks = {};
    callbacks[DIRTY_TYPE] = dirtyCallback;
    tempFileService.checkSavedWork('filename', callbacks);

    $rootScope.$digest();
    expect(dirtyCallback).toHaveBeenCalled();
  });

  it('should not prompt if not file was found', function() {
    tempFileService.checkSavedWork('filename', {});
    $rootScope.$digest();
    expect(storageServer.getFileContent).toHaveBeenCalled();
    expect(storageServer.setFileContent).not.toHaveBeenCalled();
  });

  it('should not notify registered callbacks if no saved data is found', function() {
    previouslySavedFile = false;

    var dirtyCallback = jasmine.createSpy('dirtyCallback');
    var callbacks = {};
    callbacks[DIRTY_TYPE] = dirtyCallback;
    tempFileService.checkSavedWork('filename', callbacks);

    $rootScope.$digest();
    expect(dirtyCallback).not.toHaveBeenCalled();
  });

  it('should not retrieved saved data if not in a collab experiment', function() {
    environmentService.setPrivateExperiment(false);
    tempFileService.checkSavedWork();
    $rootScope.$digest();
  });

  it('should only show dialog if requested', function() {
    previouslySavedFile = {};

    tempFileService.checkSavedWork('filename', {}, false);

    $rootScope.$digest();
    expect(nrpModalService.createModal).not.toHaveBeenCalled();

    tempFileService.checkSavedWork('filename', {}, true);
    $rootScope.$digest();
    expect(nrpModalService.createModal).toHaveBeenCalled();
  });
});
