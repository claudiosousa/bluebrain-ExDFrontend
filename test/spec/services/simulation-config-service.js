'use strict';

describe('Services: simulation-config-service', function ()
{
  var simulationConfigService;
  var gz3dMock;
  var simulationInfo;
  var collabFolderAPIServiceMock;
  var httpBackend;
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

  collabFolderAPIServiceMock = {};
  collabFolderAPIServiceMock.experimentDoesNotExist = false;
  collabFolderAPIServiceMock.fileDoesNotExist = false;
  collabFolderAPIServiceMock.getExperimentFolderId = function ()
  {
    var res = {};
    res.then = function (callback)
    {
      if (collabFolderAPIServiceMock.experimentDoesNotExist)
      {
        callback();
      }
      else
      {
        callback('mockedfolderid');
      }
    };
    return res;
  };

  collabFolderAPIServiceMock.createFolderFile = function ()
  {
    var res = {};
    res.then = function (callback)
    {
      callback(true);
    };
    return res;
  };

  collabFolderAPIServiceMock.getFolderFile = function ()
  {
    var res = {};
    res.then = function (callback)
    {
      if (collabFolderAPIServiceMock.fileDoesNotExist)
      {
        callback(null);
      }
      else
      {
        callback({ _uuid: 'mockeduuid' });
      }
    };
    return res;
  };

  collabFolderAPIServiceMock.deleteFile = function ()
  {
    var res = {};
    res.then = function (callback)
    {
      callback(true);
    };
    return res;
  };

  collabFolderAPIServiceMock.downloadFile = function ()
  {
    var res = {};
    res.then = function (callback)
    {
      callback('CollabContentTest');
    };
    return res;
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('gz3dServices'));

  // load the service to test and mock the necessary service

  beforeEach(module(function ($provide)
  {
    $provide.value('gz3d', gz3dMock);
    $provide.value('simulationInfo', simulationInfo);
    $provide.value('collabFolderAPIService', collabFolderAPIServiceMock);
  }));

  beforeEach(inject(function (_$httpBackend_, _simulationConfigService_, _$rootScope_, _environmentService_)
  {
    simulationConfigService = _simulationConfigService_;
    httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    environmentService = _environmentService_;

    var fileresult = { resources: [{ type: 'mockedFileType', file: 'mockedpath/configfilename' }] };
    httpBackend.expectGET(simulationInfo.serverBaseUrl + '/simulation/mocked_simulation_id/resources').respond(JSON.stringify(fileresult));
    httpBackend.whenGET('views/common/home.html').respond(200);
  }));

 it('should check if config file exists in backend', function ()
  {
    var result = simulationConfigService.doesConfigFileExist('mockedFileType');
    httpBackend.flush();
    $rootScope.$digest();

    result.then(function (result)
    {
      expect(result).toBe(true);
    });

    $rootScope.$digest();
  });

  it('should use cache after initConfigFiles has been called', function ()
  {
    simulationConfigService.initConfigFiles(simulationInfo.serverBaseUrl,simulationInfo.simulationID);

    var result = simulationConfigService.doesConfigFileExist('mockedFileType');
    httpBackend.flush();
    $rootScope.$digest();

    result.then(function (result)
    {
      expect(result).toBe(true);
    });

    $rootScope.$digest();
  });

  it('should load config file from backend', function ()
  {
    httpBackend.expectGET(simulationInfo.serverBaseUrl + 'mockedpath/configfilename').respond('ContentTest');

    simulationInfo.contextID = undefined;
    var result = simulationConfigService.loadConfigFile('mockedFileType');
    httpBackend.flush();
    $rootScope.$digest();

    result.then(function (result)
    {
      expect(result).toBe('ContentTest');
    });

    $rootScope.$digest();
  });

  it('should load config file from the collab', function ()
  {
    spyOn(collabFolderAPIServiceMock, 'downloadFile').and.callThrough();

    environmentService.setPrivateExperiment(true);
    simulationInfo.contextID = 'mockedContextID';
    simulationConfigService.loadConfigFile('mockedFileType');
    httpBackend.flush();
    $rootScope.$digest();

    expect(collabFolderAPIServiceMock.downloadFile).toHaveBeenCalled();

  });

  it('should save config file to collabs', function ()
  {
    collabFolderAPIServiceMock.fileDoesNotExist = true;
    environmentService.setPrivateExperiment(true);
    simulationInfo.contextID = 'mockedContextID';

    spyOn(collabFolderAPIServiceMock, 'createFolderFile').and.callThrough();
    simulationConfigService.saveConfigFile('mockedFileType','mockedData');
    httpBackend.flush();
    $rootScope.$digest();

    expect(collabFolderAPIServiceMock.createFolderFile).toHaveBeenCalled();
  });

  it('should overwrite config file to collabs', function ()
  {
    collabFolderAPIServiceMock.fileDoesNotExist = false;
    environmentService.setPrivateExperiment(true);
    simulationInfo.contextID = 'mockedContextID';

    spyOn(collabFolderAPIServiceMock, 'createFolderFile').and.callThrough();
    simulationConfigService.saveConfigFile('mockedFileType','mockedData');
    httpBackend.flush();
    $rootScope.$digest();

    expect(collabFolderAPIServiceMock.createFolderFile).toHaveBeenCalled();
  });

});



