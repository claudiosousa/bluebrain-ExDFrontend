'use strict';

describe('Services: simulation-config-service', function() {
  var simulationConfigService;
  var gz3dMock;
  var simulationInfo;
  var httpBackend;
  var storageServerMock;
  var $rootScope, environmentService;

  simulationInfo = {
    serverBaseUrl: 'localhost:',
    mode: undefined,
    serverID: 'bbpce016',
    simulationID: 'mocked_simulation_id',
    experimentID: 'mocked_experience_id',
    contextID: 'mocked_context_id',
    serverConfig: {
      gzweb: {},
      rosbridge: {
        topics: {
          cleError: {}
        }
      }
    }
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('gz3dModule'));

  // load the service to test and mock the necessary service

  beforeEach(
    module(function($provide) {
      storageServerMock = {
        setFileContent: jasmine
          .createSpy('setFileContent')
          .and.callFake(function() {
            return window.$q.when();
          }),
        getFileContent: jasmine
          .createSpy('getFileContent')
          .and.callFake(function() {
            return window.$q.when({ uuid: 'mockeduuid' });
          }),
        deleteFile: jasmine.createSpy('deleteFile').and.callFake(function() {
          return window.$q.when();
        })
      };

      $provide.value('gz3d', gz3dMock);
      $provide.value('simulationInfo', simulationInfo);
      $provide.value('storageServer', storageServerMock);
    })
  );

  beforeEach(
    inject(function(
      _$httpBackend_,
      _simulationConfigService_,
      _$rootScope_,
      _environmentService_
    ) {
      simulationConfigService = _simulationConfigService_;
      httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      environmentService = _environmentService_;

      var fileresult = {
        resources: [
          { type: 'mockedFileType', file: 'mockedpath/configfilename' }
        ]
      };
      httpBackend
        .expectGET(
          simulationInfo.serverBaseUrl +
            '/simulation/mocked_simulation_id/resources'
        )
        .respond(JSON.stringify(fileresult));
    })
  );

  it('should check if config file exists in backend', function() {
    var result = simulationConfigService.doesConfigFileExist('mockedFileType');
    httpBackend.flush();
    $rootScope.$digest();

    result.then(function(result) {
      expect(result).toBe(true);
    });

    $rootScope.$digest();
  });

  it('should use cache after initConfigFiles has been called', function() {
    simulationConfigService.initConfigFiles(
      simulationInfo.serverBaseUrl,
      simulationInfo.simulationID
    );

    var result = simulationConfigService.doesConfigFileExist('mockedFileType');
    httpBackend.flush();
    $rootScope.$digest();

    result.then(function(result) {
      expect(result).toBe(true);
    });

    $rootScope.$digest();
  });

  it('should load config file from backend', function() {
    httpBackend
      .expectGET(simulationInfo.serverBaseUrl + 'mockedpath/configfilename')
      .respond('ContentTest');

    simulationInfo.contextID = undefined;
    var result = simulationConfigService.loadConfigFile('mockedFileType');
    httpBackend.flush();
    $rootScope.$digest();

    result.then(function(result) {
      expect(result).toBe('ContentTest');
    });

    $rootScope.$digest();
  });

  it('should load config file from the collab', function() {
    environmentService.setPrivateExperiment(true);
    simulationInfo.contextID = 'mockedContextID';
    simulationConfigService.loadConfigFile('mockedFileType');
    httpBackend.flush();
    $rootScope.$digest();

    expect(storageServerMock.getFileContent).toHaveBeenCalled();
  });

  it('should save config file to collabs', function() {
    environmentService.setPrivateExperiment(true);
    simulationInfo.contextID = 'mockedContextID';

    simulationConfigService.saveConfigFile('mockedFileType', 'mockedData');
    httpBackend.flush();
    $rootScope.$digest();

    expect(storageServerMock.setFileContent).toHaveBeenCalled();
  });

  it('should overwrite config file to collabs', function() {
    environmentService.setPrivateExperiment(true);
    simulationInfo.contextID = 'mockedContextID';

    simulationConfigService.saveConfigFile('mockedFileType', 'mockedData');
    httpBackend.flush();
    $rootScope.$digest();

    expect(storageServerMock.setFileContent).toHaveBeenCalled();
  });
});
