(function () {
  'use strict';

  describe('Directive: newExperimentWizard', function () {
    var $httpBackend, $rootScope, $compile, nrpModalService, collabFolderAPIService, $q, scope, hbpDialogFactory, newExperimentProxyService;

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));
    beforeEach(module('hbpCollaboratoryCore'));

    beforeEach(inject(function (
      _$rootScope_, _$httpBackend_, _$compile_, _nrpModalService_,
      _collabFolderAPIService_, _$q_, _hbpDialogFactory_, _newExperimentProxyService_
    ) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      nrpModalService = _nrpModalService_;
      collabFolderAPIService = _collabFolderAPIService_;
      $q = _$q_;
      hbpDialogFactory = _hbpDialogFactory_;
      newExperimentProxyService = _newExperimentProxyService_;

      $compile('<new-experiment-wizard></new-experiment-wizard>')($rootScope);
      $rootScope.$digest();
      scope = $rootScope.$$childHead;
      spyOn(nrpModalService, 'createModal')
        .and.callFake(function () {
          return;
        });
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      scope.destroyDialog();
    });

    it('should check successful upload from private collab for the robot', function () {

      spyOn(collabFolderAPIService, 'getFilesFromNavEntityFolder')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve({
            empty: 'empty'
          });
          return deferred.promise;
        });
      spyOn(scope, 'createEntitiesListFromEntityFiles')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve({
            result: [
              {
                name: 'fakeICub',
                description: 'fakeICubDescription',
                imageData: ''
              },
              {
                name: 'fakeHusky',
                description: 'fakeHuskyDescription',
                imageData: ''
              }]
          });
          return deferred.promise;
        });

      scope.uploadRobotDialog();
      scope.uploadEntity('PrivateCollab');
      scope.$digest();
      expect(scope.entities.result[0]).toEqual({
        name: 'fakeICub',
        description: 'fakeICubDescription',
        imageData: ''
      });
      expect(scope.entities.result[1].name).toBe('fakeHusky');
    });

    it('should check successful upload from private collab for the environment', function () {

      spyOn(collabFolderAPIService, 'getFilesFromNavEntityFolder')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve({
            empty: 'empty'
          });
          return deferred.promise;
        });
      spyOn(scope, 'createEntitiesListFromEntityFiles')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve({
            result: [
              {
                name: 'fake3DSpace',
                description: 'fakeSpaceBotGroundDescription',
                imageData: ''
              },
              {
                name: 'fakeFZIGround',
                description: 'fakeFZIGroundDescription',
                imageData: ''
              }]
          });
          return deferred.promise;
        });

      scope.uploadEnvironmentDialog();
      scope.uploadEntity('PrivateCollab');
      scope.$digest();
      expect(scope.entities.result[0]).toEqual({
        name: 'fake3DSpace',
        description: 'fakeSpaceBotGroundDescription',
        imageData: ''
      });
      expect(scope.entities.result[1].name).toBe('fakeFZIGround');
    });

    it('should check successful upload from private collab for the brain', function () {

      spyOn(collabFolderAPIService, 'getFilesFromNavEntityFolder')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve({
            empty: 'empty'
          });
          return deferred.promise;
        });
      spyOn(scope, 'createEntitiesListFromBrainFiles')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve({
            result: [
              {
                name: 'fakeBrain1',
                description: 'fakeBrain1Description',
                imageData: ''
              },
              {
                name: 'fakeBrain2',
                description: 'fakeBrain2Description',
                imageData: ''
              }]
          });
          return deferred.promise;
        });

      scope.uploadBrainDialog();
      scope.uploadEntity('PrivateCollab');
      scope.$digest();
      expect(scope.entities.result[0]).toEqual({
        name: 'fakeBrain1',
        description: 'fakeBrain1Description',
        imageData: ''
      });
      expect(scope.entities.result[1].name).toBe('fakeBrain2');
      expect(scope.brain).toBe(true);
    });

    it('should check unsuccessful upload from private collab for the robot', function () {
      spyOn(scope, 'createErrorPopup')
        .and.callFake(function () {
          return;
        });
      spyOn(collabFolderAPIService, 'getFilesFromNavEntityFolder')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.reject({
            empty: 'empty'
          });
          return deferred.promise;
        });
      scope.uploadRobotDialog();
      scope.uploadEntity('PrivateCollab');
      scope.$digest();
      expect(scope.entities).toBe(undefined);
      expect(scope.createErrorPopup).toHaveBeenCalled();
    });

    it('should check unsuccessful upload from private collab for the environment', function () {
      spyOn(scope, 'createErrorPopup')
        .and.callFake(function () {
          return;
        });
      spyOn(collabFolderAPIService, 'getFilesFromNavEntityFolder')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.reject({
            empty: 'empty'
          });
          return deferred.promise;
        });
      scope.uploadEnvironmentDialog();
      scope.uploadEntity('PrivateCollab');
      scope.$digest();
      expect(scope.entities).toBe(undefined);
      expect(scope.createErrorPopup).toHaveBeenCalled();
    });

    it('should check unsuccessful upload from private collab for the brain', function () {
      spyOn(scope, 'createErrorPopup')
        .and.callFake(function () {
          return;
        });
      spyOn(collabFolderAPIService, 'getFilesFromNavEntityFolder')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.reject({
            empty: 'empty'
          });
          return deferred.promise;
        });
      scope.uploadBrainDialog();
      scope.uploadEntity('PrivateCollab');
      scope.$digest();
      expect(scope.entities).toBe(undefined);
      expect(scope.createErrorPopup).toHaveBeenCalled();
    });

    it('should call the create upload from private collab function', function () {
      var mockBrainUploader = {
        name: 'FakeRobot',
        fakeFunction: function () { }
      };
      scope.uploadEntityDialog(mockBrainUploader);
      expect(nrpModalService.createModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('FakeRobot');
    });

    it('should call the upload from collab libraries for the robot', function () {
      spyOn(scope, 'uploadEntityDialog').and.callThrough();
      scope.uploadRobotDialog();
      scope.uploadEntity('CollabLibraries');
      scope.$digest();
      expect(scope.uploadEntityDialog).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Robot');
      scope.completeUploadEntity();
      expect(scope.robotUploaded).toBe(true);
    });

    it('should call the upload from collab libraries for the brain', function () {
      spyOn(scope, 'uploadEntityDialog').and.callThrough();
      scope.uploadBrainDialog();
      scope.uploadEntity('CollabLibraries');
      scope.$digest();
      expect(scope.uploadEntityDialog).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Brain');
      scope.completeUploadEntity();
      expect(scope.brainUploaded).toBe(true);
    });

    it('should call the upload from collab libraries for the  environment', function () {
      spyOn(scope, 'uploadEntityDialog').and.callThrough();
      scope.uploadEnvironmentDialog();
      scope.uploadEntity('CollabLibraries');
      scope.$digest();
      expect(scope.uploadEntityDialog).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Environment');
      scope.completeUploadEntity();
      expect(scope.environmentUploaded).toBe(true);
    });

    it('should call the upload from public env for the robot', function () {
      var mockProxyResponse = {
        data: [
          {
            name: 'Arm robot force based version',
            description: 'Modified Hollie arm model for force based index finger movements.\n      In contrast to the first Hollie arm model it was required to remove the\n      PID control of the index finger joints to allow force control for this\n      particular finger.',
            thumbnail: null
          },
          {
            name: 'Arm robot',
            description: 'First Hollie arm model.',
            thumbnail: null
          },
          {
            name: 'HBP Clearpath Robotics Husky A200',
            description: 'Clearpath Robotics Husky A200 - Extended HBP Model',
            thumbnail: null
          },
          {
            name: 'iCub HBP ros',
            description: 'Model for the iCub humanoid robot. For more information check icub.org .',
            thumbnail: null
          }]
      };
      spyOn(newExperimentProxyService, 'getEntity').and.callFake(function () {
        var deferred = $q.defer();
        deferred.resolve(mockProxyResponse);
        return deferred.promise;
      });
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadRobotDialog();
      scope.uploadEntity('PublicEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Robot');

      expect(scope.entities[0].name).toEqual('Arm robot force based version');
      expect(scope.entities[1].description).toEqual('First Hollie arm model.');
      expect(scope.entities[2].thumbnail).toBe(null || undefined);
      expect(scope.entities.length).toBe(4);
      scope.completeUploadEntity();
      expect(scope.robotUploaded).toBe(true);
    });

    it('should call the upload from public env for the environments', function () {
      var mockProxyResponse = {
        data: [
          {
            name: 'Fake environment1',
            description: 'Fake Description1',
            thumbnail: null
          },
          {
            name: 'Fake environment2',
            description: 'Fake Description2',
            thumbnail: null
          },
          {
            name: 'Fake environment3',
            description: 'Fake Description3',
            thumbnail: null
          },
          {
            name: 'Fake environment4',
            description: 'Fake Description5',//ha
            thumbnail: null
          }]
      };
      spyOn(newExperimentProxyService, 'getEntity').and.callFake(function () {
        var deferred = $q.defer();
        deferred.resolve(mockProxyResponse);
        return deferred.promise;
      });
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadEnvironmentDialog();
      scope.uploadEntity('PublicEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Environment');
      expect(scope.entities[0].name).toEqual('Fake environment1');
      expect(scope.entities[1].description).toEqual('Fake Description2');
      expect(scope.entities[2].thumbnail).toBe(null || undefined);
      expect(scope.entities.length).toBe(4);
      scope.completeUploadEntity();
      expect(scope.environmentUploaded).toBe(true);
    });

    it('should call the upload from public env for the robot', function () {
      var mockProxyResponse = {
        data: [
          {
            name: 'FakeBrain1',
            description: 'This brain is fake, which means that a zombie can get confused while trying to eat it',
            thumbnail: null
          },
          {
            name: 'FakeBrain2',
            description: 'FakeBrain2Description',
            thumbnail: null
          },
          {
            name: 'FakeBrain3',
            description: 'FakeBrain3Description',
            thumbnail: null
          },
          {
            name: 'FakeBrain4',
            description: 'FakeBrain4Description',
            thumbnail: null
          }]
      };
      spyOn(newExperimentProxyService, 'getEntity').and.callFake(function () {
        var deferred = $q.defer();
        deferred.resolve(mockProxyResponse);
        return deferred.promise;
      });
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadBrainDialog();
      scope.uploadEntity('PublicEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Brain');
      expect(scope.entities[0].description).toEqual('This brain is fake, which means that a zombie can get confused while trying to eat it');
      expect(scope.entities[1].name).toEqual('FakeBrain2');
      expect(scope.entities[1].thumbnail).toBe(null || undefined);
      expect(scope.entities.length).toBe(4);
      scope.completeUploadEntity();
      expect(scope.brainUploaded).toBe(true);
    });

    it('should call the upload from local env for the robot', function () {
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadRobotDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Robot');
      scope.completeUploadEntity();
      expect(scope.robotUploaded).toBe(true);
    });

    it('should call the upload from local env for the environment', function () {
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadEnvironmentDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Environment');
      scope.completeUploadEntity();
      expect(scope.environmentUploaded).toBe(true);
    });

    it('should call the upload from local env for the brain', function () {
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadBrainDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Brain');
      scope.completeUploadEntity();
      expect(scope.brainUploaded).toBe(true);
    });

    it('should test the createErrorPopup function', function () {
      spyOn(hbpDialogFactory, 'alert')
        .and.callFake(function () {
          return;
        });
      scope.createErrorPopup();
      expect(hbpDialogFactory.alert).toHaveBeenCalled();
    });

    it('should test the createEntitiesListFromEntityFiles function', function () {
      var mockCollabStorageResponse =
        {
          results:
          [{
            _contentType: 'application/x-config',
            _description: '',
            _uuid: '5626127f-eaaf-4eef-9806-d152a7894eae',
            _entityType: 'file',
            _name: 'icub.config'
          },
          {
            _contentType: 'image/png',
            _description: '',
            _uuid: '07419007-8353-45bd-9645-d1d6c3dc5e59',
            _entityType: 'file',
            _name: 'icub.png'
          },
          {
            _contentType: 'application/x-config',
            _description: '',
            _uuid: '79e51141-98cf-4ece-aa1b-b766d7842d53',
            _entityType: 'file',
            _name: 'lauron.config'
          },
          {
            _contentType: 'image/png',
            _description: '',
            _uuid: '4f541ef0-84f7-4509-9745-b10eee176205',
            _entityType: 'file',
            _name: 'lauron.png'
          }]
        };
      spyOn(scope, 'retrieveImageFileContent')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve();
          return deferred.promise;
        });
      spyOn(scope, 'retrieveConfigFileContent')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve({
            config:
            {
              desc: 'fakeDesc'
            }
          });
          return deferred.promise;
        });
      scope.createEntitiesListFromEntityFiles(mockCollabStorageResponse);
      expect(scope.retrieveImageFileContent).toHaveBeenCalled();
      expect(scope.retrieveConfigFileContent).toHaveBeenCalled();
    });

    it('should test the retrieveImageFileContent function', function () {
      spyOn(collabFolderAPIService, 'downloadFile')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve();
          return deferred.promise;
        });
      scope.retrieveImageFileContent();
      expect(collabFolderAPIService.downloadFile).toHaveBeenCalled();
    });

    it('should test the retrieveConfigFileContent function', function () {
      spyOn(collabFolderAPIService, 'downloadFile')
        .and.callFake(function () {
          var xmlVersionString = '<?xml version="1.0"?>';
          var xmlModelString = '<model>';
          var xmlNameString = '<name>iCub HBP ros</name>';
          var xmlDescritptionString = '<description>Model for the iCub humanoid robot. For more information check icub.org.</description>';
          var xmlModelTerminateString = '</model>';
          var xml = xmlVersionString
            .concat(xmlModelString)
            .concat(xmlNameString)
            .concat(xmlDescritptionString)
            .concat(xmlModelTerminateString);
          var deferred = $q.defer();
          deferred.resolve(xml);
          return deferred.promise;
        });
      scope.retrieveConfigFileContent();
      expect(collabFolderAPIService.downloadFile).toHaveBeenCalled();
    });

    it('should test the createEntitiesListFromBrainFiles success', function () {
      spyOn(collabFolderAPIService, 'downloadFile')
        .and.callFake(function () {
          var deferred = $q.defer();
          deferred.resolve('"""test"""');
          return deferred.promise;
        });
      var files = {
        results: [
          {
            _name: 'fakeName',
            _uuid: 'fakeuuid'
          }]
      };
      var result = scope.createEntitiesListFromBrainFiles(files);
      result.then(function (brainFiles) {
        expect(collabFolderAPIService.downloadFile).toHaveBeenCalledWith('fakeuuid');
        expect(brainFiles[0].name).toEqual('fakeName');
        expect(brainFiles[0].description).toEqual('test');
      });
    });

    it('should make sure that the destroy dialog function cleans up properly', function () {
      spyOn(nrpModalService, 'destroyModal')
        .and.callFake(function () {
          return;
        });
      scope.uploadBrainDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      expect(scope.entityName).toEqual('Brain');
      scope.destroyDialog();
      expect(scope.entityPageState).toEqual({});
      expect(scope.entityName).toBe('');
      expect(scope.brain).toBe(false);
      expect(scope.entities).toBe(undefined);
      expect(nrpModalService.destroyModal).toHaveBeenCalled();
    });

    it('should select new experiment', function () {
      scope.selectEntity({ id: 1 });
      expect(scope.entityPageState.selected).toEqual(1);
    });

    it('should check that clone new experiment function works', function () {
      scope.uploadBrainDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      scope.completeUploadEntity();
      scope.uploadEnvironmentDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      scope.completeUploadEntity();
      scope.uploadRobotDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      scope.completeUploadEntity();
      scope.cloneNewExperiment();
      expect(scope.brainUploaded).toBe(true);
      expect(scope.robotUploaded).toBe(true);
      expect(scope.environmentUploaded).toBe(true);
      expect(scope.experimentCloned).toBe(true);
    });
  });
})();


