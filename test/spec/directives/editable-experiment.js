'use strict';

describe('Directive: editable-experiment', function() {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  var scope,
    $timeout,
    $rootScope,
    $window,
    $httpBackend,
    collabContextUrl,
    environmentService,
    storageServer,
    clbErrorDialog,
    experimentsFactory,
    ctx = 'some_context',
    collabExperimentResponse = { contextID: ctx, experimentID: 'experimentID', experimentFolderUUID: 'experimentFolderUUID' };

  var lockMock = jasmine.createSpyObj('lockMock', ['tryAddLock', 'onLockChanged', 'releaseLock']);
  var user = { id: 'testUser' },
    lockResponse = { success: true, lock: { lockInfo: { user: user } } };

  beforeEach(inject(function(_$httpBackend_,
    _$rootScope_,
    $stateParams,
    _$timeout_,
    _$window_,
    bbpConfig,
    collabExperimentLockService,
    _environmentService_,
    _storageServer_,
    _clbErrorDialog_,
    _experimentsFactory_) {

    $window = _$window_;
    $timeout = _$timeout_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    storageServer = _storageServer_;
    environmentService = _environmentService_;
    clbErrorDialog = _clbErrorDialog_;
    experimentsFactory = _experimentsFactory_;

    spyOn(collabExperimentLockService, 'createLockServiceForExperimentId').and.returnValue(lockMock);

    var collabContextlessUrl = bbpConfig.get('api.collabContextManagement.url') + '/collab/configuration';
    collabContextUrl = collabContextlessUrl + '/' + ctx;
    $stateParams.ctx = ctx;

    $rootScope.userinfo = { userID: user.id };

    $rootScope.exp = {
      configuration: {
        name: 'name',
        description: 'description',
        experimentFile: 'some file'
      }
    };
  }));

  describe(', public experiement,', function() {
    beforeEach(inject(function($compile) {
      environmentService.setPrivateExperiment(false);

      var element = $compile('<editable-experiment/>')($rootScope);
      $rootScope.$digest();
      scope = element.scope();
    }));

    it('test editExperiment when it is not a collab experiment', function() {

      scope.editing.nameID = false;

      scope.editExperiment('nameID');
      expect(scope.editing.nameID).toBe(false);
      expect(lockMock.tryAddLock).not.toHaveBeenCalled();
    });
  });

  describe(', private experiement,', function() {

    var collabExperimentFile;
    var lockPromiseResponse;

    beforeEach(inject(function($compile) {
      collabExperimentFile = '';
      environmentService.setPrivateExperiment(true);
      lockPromiseResponse = window.$q.when(lockResponse);
      $httpBackend.whenGET(collabContextUrl).respond(200, collabExperimentResponse);
      lockMock.tryAddLock.and.callFake(function() { return lockPromiseResponse; });

      var element = $compile('<editable-experiment/>')($rootScope);
      $rootScope.$digest();
      scope = element.scope();
    }));


    it('test editExperiment when everything goes normally', function() {
      spyOn(clbErrorDialog, 'open');
      scope.editing.nameID = false;

      scope.editExperiment('nameID');
      scope.$digest();
      spyOn($window.document, 'getElementById').and.returnValue({ focus: angular.noop });
      $timeout.flush();
      expect($window.document.getElementById).toHaveBeenCalled();
      expect(scope.editing.nameID).toBe(true);
      expect(lockMock.tryAddLock).toHaveBeenCalled();
      expect(clbErrorDialog.open).not.toHaveBeenCalled();
    });

    it('test editExperiment when someone else is the owner of the edit lock', function() {
      spyOn(clbErrorDialog, 'open');
      scope.editing.nameID = false;
      lockResponse.success = false;
      user.id = 'some_other_user';
      scope.editExperiment('nameID');
      scope.$digest();
      expect(scope.editing.nameID).toBe(false);
      expect(clbErrorDialog.open).toHaveBeenCalled();
    });

    it('test editExperiment when an error came from the lock service', function() {
      scope.editing.nameID = false;
      spyOn(clbErrorDialog, 'open');
      scope.userinfo.userID = 'a different user';

      lockPromiseResponse = window.$q.reject();

      scope.editExperiment('nameID');
      scope.$digest();
      expect(scope.editing.nameID).toBe(false);
      expect(clbErrorDialog.open).toHaveBeenCalled();
    });

    it('test stopEditingExperimentDetails', function() {
      scope.editing.nameID = true;
      spyOn(clbErrorDialog, 'open');

      lockMock.releaseLock.and.callFake(function() { return window.$q.reject(new Error()); });
      scope.stopEditingExperimentDetails('nameID');
      expect(scope.editing.nameID).toBe(false);
      expect(lockMock.releaseLock).toHaveBeenCalled();
      expect(clbErrorDialog.open).not.toHaveBeenCalled();
    });

    it('test stopEditingExperimentDetails deal with lock exceptions', function() {
      scope.editing.nameID = true;
      spyOn(clbErrorDialog, 'open');

      lockMock.releaseLock.and.callFake(function() { return window.$q.reject(new Error()); });
      scope.stopEditingExperimentDetails('nameID');
      scope.$digest();
      expect(clbErrorDialog.open).toHaveBeenCalled();
      expect(scope.editing.nameID).toBe(false);
    });

    it('test saveExperimentDetails when description is empty', function() {
      spyOn(storageServer, 'setFileContent');
      spyOn(clbErrorDialog, 'open');

      scope.originalConfiguration = { name: 'oldName', description: 'oldDesc' };
      scope.saveExperimentDetails('    ');
      expect(clbErrorDialog.open).toHaveBeenCalled();
      expect(storageServer.setFileContent).not.toHaveBeenCalled();
    });

    it('test saveExperimentDetails gives error when tags are in the user input', function() {
      spyOn(clbErrorDialog, 'open');
      spyOn(storageServer, 'setFileContent');

      scope.originalConfiguration = { name: 'oldName', description: 'oldDesc' };
      scope.saveExperimentDetails('<tag>dkhfdf</tag>');
      expect(clbErrorDialog.open).toHaveBeenCalled();
      expect(storageServer.setFileContent).not.toHaveBeenCalled();
    });

    it('test saveExperimentDetails gives error when no xml is retrieved from collab', function() {
      spyOn(clbErrorDialog, 'open');
      scope.originalConfiguration = { name: 'oldName', description: 'oldDesc' };

      spyOn(storageServer, 'setFileContent').and.returnValue(window.$q.reject());
      scope.saveExperimentDetails('newName', 'nameID');
      $rootScope.$digest();
      expect(clbErrorDialog.open).toHaveBeenCalled();
    });

    it('test saveExperimentDetails doesnt bother to save if name hasnt changed', function() {

      scope.exp = { 'configuration': { 'name': 'newName' } };
      collabExperimentFile = ['xml', { 'entity_type': 'file' }];
      spyOn(storageServer, 'setFileContent').and.returnValue(window.$q.when(''));
      spyOn(scope, 'stopEditingExperimentDetails');
      spyOn(clbErrorDialog, 'open');
      scope.originalConfiguration = { name: 'oldName', description: 'oldDesc' };

      scope.saveExperimentDetails('oldName', 'nameID');
      expect(clbErrorDialog.open).not.toHaveBeenCalled();
      expect(storageServer.setFileContent).not.toHaveBeenCalled();
      expect(scope.stopEditingExperimentDetails).toHaveBeenCalled();
      expect(scope.isSavingToCollab).toBe(false);
    });

    it('test saveExperimentDetails doesnt bother to save if description hasnt changed', function() {
      scope.exp = { 'configuration': { 'description': 'newDesc' } };
      collabExperimentFile = ['xml', { 'entity_type': 'file' }];
      spyOn(storageServer, 'setFileContent').and.returnValue(window.$q.when(''));
      spyOn(scope, 'stopEditingExperimentDetails');
      spyOn(clbErrorDialog, 'open');
      scope.originalConfiguration = { name: 'oldName', description: 'oldDesc' };

      scope.saveExperimentDetails('oldDesc', 'descID');
      expect(clbErrorDialog.open).not.toHaveBeenCalled();
      expect(storageServer.setFileContent).not.toHaveBeenCalled();
      expect(scope.stopEditingExperimentDetails).toHaveBeenCalled();
      expect(scope.isSavingToCollab).toBe(false);
    });

    it('test saveExperimentDetails when everything goes well saving name', function() {
      collabExperimentFile = ['xml', { 'entity_type': 'file' }];
      spyOn(storageServer, 'setFileContent').and.returnValue(window.$q.when(''));
      spyOn(scope, 'stopEditingExperimentDetails');
      scope.editing.nameID = true;
      spyOn(clbErrorDialog, 'open');
      scope.originalConfiguration = { name: 'oldName', description: 'oldDesc'};

      scope.saveExperimentDetails('newName', 'nameID');
      scope.$digest();
      expect(clbErrorDialog.open).not.toHaveBeenCalled();
      expect(scope.stopEditingExperimentDetails).toHaveBeenCalled();
      expect(scope.isSavingToCollab).toBe(false);
    });

    it('test saveExperimentDetails when everything goes well saving description', function() {
      collabExperimentFile = ['xml', { 'entity_type': 'file' }];
      spyOn(storageServer, 'setFileContent').and.returnValue(window.$q.when(''));
      spyOn(scope, 'stopEditingExperimentDetails');
      spyOn(clbErrorDialog, 'open');
      scope.originalConfiguration = { name: 'oldName', description: 'oldDesc' };

      scope.saveExperimentDetails('newDesc', 'descID');
      scope.$digest();
      expect(clbErrorDialog.open).not.toHaveBeenCalled();
      expect(scope.stopEditingExperimentDetails).toHaveBeenCalled();
      expect(scope.isSavingToCollab).toBe(false);
    });
    it('test saveExperimentDetails when there is an error saving the new details to the collab', function() {
      collabExperimentFile = ['xml', { 'entity_type': 'file' }];
      spyOn(storageServer, 'setFileContent').and.returnValue(window.$q.reject(''));
      spyOn(scope, 'stopEditingExperimentDetails');
      scope.editing.nameID = true;
      spyOn(clbErrorDialog, 'open');
      scope.originalConfiguration = { name: 'oldName', description: 'oldDesc' };

      scope.saveExperimentDetails('newName', 'nameID');
      scope.saveExperimentDetails('newName', 'descID');
      scope.$digest();
      expect(clbErrorDialog.open).toHaveBeenCalled();
      expect(scope.stopEditingExperimentDetails).not.toHaveBeenCalled();
      expect(scope.isSavingToCollab).toBe(false);
    });

    it('test containsTags', function() {
      expect(scope.containsTags('some text')).toBe(false);
      expect(scope.containsTags(' 2 < 3')).toBe(false);
      expect(scope.containsTags('<hello')).toBe(true);
      expect(scope.containsTags('<hello>')).toBe(true);
    });

  });

});