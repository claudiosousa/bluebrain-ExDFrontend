(function () {
  'use strict';

  describe('Directive: newExperimentWizard', function () {
    var $httpBackend, $rootScope, $compile, nrpModalService, collabFolderAPIService, $q, scope, clbErrorDialog, newExperimentProxyService, collabConfigService;

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));
    beforeEach(module('hbpCollaboratoryCore'));

    beforeEach(inject(function (
      _$rootScope_, _$httpBackend_, _$compile_, _nrpModalService_,
      _collabFolderAPIService_, _$q_, _clbErrorDialog_, _newExperimentProxyService_,
      _collabConfigService_
    ) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      nrpModalService = _nrpModalService_;
      collabFolderAPIService = _collabFolderAPIService_;
      $q = _$q_;
      clbErrorDialog = _clbErrorDialog_;
      newExperimentProxyService = _newExperimentProxyService_;
      collabConfigService = _collabConfigService_;

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

    it('should call the upload from public env for the robot', function () {
      var mockProxyResponse = {
        data: [
          {
            name: 'Arm robot force based version',
            description: 'Modified Hollie arm model for force based index finger movements.\n      In contrast to the first Hollie arm model it was required to remove the\n      PID control of the index finger joints to allow force control for this\n      particular finger.',
            thumbnail: null,
            path: 'robots/icub_model/model.config'
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
      var mockSelectedEntity = mockProxyResponse.data[0];
      scope.completeUploadEntity(mockSelectedEntity);
      expect(scope.robotUploaded).toBe(true);
    });

    it('should call the upload from public env for the environments', function () {
      var mockProxyResponse = {
        data: [
          {
            name: 'Fake environment1',
            description: 'Fake Description1',
            thumbnail: null,
            path: 'environments/virtual_world/model.config'
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
      var mockSelectedEntity = mockProxyResponse.data[0];
      scope.completeUploadEntity(mockSelectedEntity);
      expect(scope.environmentUploaded).toBe(true);
    });

    it('should call the upload from public env for the brain', function () {
      var mockProxyResponse = {
        data: [
          {
            name: 'FakeBrain1',
            description: 'This brain is fake, which means that a zombie can get confused while trying to eat it',
            thumbnail: null,
            path: 'brains/braitenberg.py'
          },
          {
            name: 'FakeBrain2',
            description: 'FakeBrain2Description',
            thumbnail: null,
            path: 'fakePath2/fakePath2.sdf'
          },
          {
            name: 'FakeBrain3',
            description: 'FakeBrain3Description',
            thumbnail: null,
            path: 'fakePath3/fakePath3.sdf'
          },
          {
            name: 'FakeBrain4',
            description: 'FakeBrain4Description',
            thumbnail: null,
            path: 'fakePath4/fakePath4.sdf'
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
      var mockSelectedEntity = mockProxyResponse.data[0];
      scope.completeUploadEntity(mockSelectedEntity);
      expect(scope.brainUploaded).toBe(true);
    });

    it('should call the upload from local env for the robot', function () {
      var mockSelectedEntity = {
        name: 'Arm robot force based version',
        description: 'Modified Hollie arm model for force based index finger movements.\n      In contrast to the first Hollie arm model it was required to remove the\n      PID control of the index finger joints to allow force control for this\n      particular finger.',
        thumbnail: null,
        path: 'robots/icub_model/model.config'
      };
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadRobotDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Robot');
      scope.completeUploadEntity(mockSelectedEntity);
      expect(scope.robotUploaded).toBe(true);
    });

    it('should call the upload from local env for the environment', function () {
      var mockSelectedEntity = {
        name: 'Fake environment1',
        description: 'Fake Description1',
        thumbnail: null,
        path: 'environments/virtual_world/model.config'
      };
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadEnvironmentDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Environment');
      scope.completeUploadEntity(mockSelectedEntity);
      expect(scope.environmentUploaded).toBe(true);
    });

    it('should call the upload from local env for the brain', function () {
      var selectedEntity = {
        name: 'FakeBrain1',
        description: 'This brain is fake, which means that a zombie can get confused while trying to eat it',
        thumbnail: null,
        path: 'brains/braitenberg.py'
      };
      spyOn(scope, 'createUploadModal').and.callThrough();
      scope.uploadBrainDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      expect(scope.createUploadModal).toHaveBeenCalled();
      expect(scope.entityName).toEqual('Brain');
      scope.completeUploadEntity(selectedEntity);
      expect(scope.brainUploaded).toBe(true);
    });

    it('should test the createErrorPopup function', function () {
      spyOn(clbErrorDialog, 'open')
        .and.callFake(function () {
          return;
        });
      scope.createErrorPopup();
      expect(clbErrorDialog.open).toHaveBeenCalled();
    });

    it('should test the createEntitiesListFromEntityFiles function', function () {
      /*jshint camelcase: false */
      var mockCollabStorageResponse =
        {
          results:
          [{
            content_type: 'application/x-config',
            description: '',
            uuid: '5626127f-eaaf-4eef-9806-d152a7894eae',
            entity_type: 'file',
            name: 'icub.config'
          },
          {
            content_type: 'image/png',
            description: '',
            uuid: '07419007-8353-45bd-9645-d1d6c3dc5e59',
            entity_type: 'file',
            name: 'icub.png'
          },
          {
            content_type: 'application/x-config',
            description: '',
            uuid: '79e51141-98cf-4ece-aa1b-b766d7842d53',
            entity_type: 'file',
            name: 'lauron.config'
          },
          {
            content_type: 'image/png',
            description: '',
            uuid: '4f541ef0-84f7-4509-9745-b10eee176205',
            entity_type: 'file',
            name: 'lauron.png'
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
            name: 'fakeName',
            uuid: 'fakeuuid'
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

    it('should check that model selection enables clone', function () {

      var mockSelectedEntities = [{
        name: 'FakeBrain1',
        description: 'This brain is fake, which means that a zombie can get confused while trying to eat it',
        thumbnail: null,
        path: 'brains/braitenberg.py'
      }, {
        name: 'Fake environment1',
        description: 'Fake Description1',
        thumbnail: null,
        path: 'environments/virtual_world/model.config'
      }, {
        name: 'Arm robot force based version',
        description: 'Modified Hollie arm model for force based index finger movements.\n      In contrast to the first Hollie arm model it was required to remove the\n      PID control of the index finger joints to allow force control for this\n      particular finger.',
        thumbnail: null,
        path: 'robots/icub_model/model.config'
      }
      ];
      scope.uploadBrainDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      scope.completeUploadEntity(mockSelectedEntities[0]);
      scope.uploadEnvironmentDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      scope.completeUploadEntity(mockSelectedEntities[1]);
      scope.uploadRobotDialog();
      scope.uploadEntity('LocalEnv');
      scope.$digest();
      scope.completeUploadEntity(mockSelectedEntities[2]);
      expect(scope.brainUploaded).toBe(true);
      expect(scope.robotUploaded).toBe(true);
      expect(scope.environmentUploaded).toBe(true);
    });

    it('should test that the clone new experiment function works', function () {
      spyOn(collabConfigService, 'clone').and.callFake(function () {
        return;
      });
      scope.cloneNewExperiment('fakeExpID');
      expect(scope.isCloneRequested).toBe(true);
    });

    it('should test that the complete upload entity function creates an error popup when the path is not correct', function () {
      var mockSelectedEntity = {
        path: 'C:\\WindowsFakePath'
      };
      spyOn(scope, 'createErrorPopup')
        .and.callFake(function () {
          return;
        });
      scope.completeUploadEntity(mockSelectedEntity);
      expect(scope.createErrorPopup).toHaveBeenCalled();
    });
  });
})();


