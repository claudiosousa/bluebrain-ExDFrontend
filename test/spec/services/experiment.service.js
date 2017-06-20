'use strict';

describe('Services: experimentService', function ()
{
  var experimentService,
    simulationInfo,
    nrpUser,
    simulationControlObject,
    bbpConfig,
    experimentsFactoryObject,
    nrpFrontendVersion,
    nrpBackendVersions,
    rootScope,
    $httpBackend,
    $q;

  var simulationData =
    {
      owner: 'Some owner id',
      experimentConfiguration: 'expconf',
      environmentConfiguration: 'envconf',
      creationDate: '19.02.1970'
    };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('simulationInfoMock'));
  beforeEach(module('nrpUserMock'));
  beforeEach(module(function ($provide)
  {
    simulationControlObject = {
      simulation: function (desc, rescallback)
      {
        rescallback(simulationData);
      }
    };

    var nrpFrontendVersionObject = {
      get: function(callback)
      {
        callback({toString:'V1.0'});
      }
    };

    var nrpBackendVersionsObject = {
      get: function(callback)
      {
        callback({toString:'V1.0'});
      }
    };

    $provide.value('simulationControl', jasmine.createSpy('simulationControl').and.returnValue(simulationControlObject));
    $provide.value('experimentsFactory', experimentsFactoryObject);
    $provide.value('nrpFrontendVersion', nrpFrontendVersionObject);
    $provide.value('nrpBackendVersions', jasmine.createSpy('nrpBackendVersions').and.returnValue(nrpBackendVersionsObject));

  }));

  beforeEach(inject(function (_$q_)
  {
    $q = _$q_;
  }));

  beforeEach(inject(function (_experimentService_,
    _$rootScope_,
    _simulationInfo_,
    _nrpUser_,
    _nrpFrontendVersion_,
    _nrpBackendVersions_,
    _bbpConfig_,
    _$httpBackend_)
  {
    experimentService = _experimentService_;
    simulationInfo = _simulationInfo_;
    nrpUser = _nrpUser_;

    bbpConfig = _bbpConfig_;
    nrpFrontendVersion = _nrpFrontendVersion_;
    nrpBackendVersions = _nrpBackendVersions_;
    rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    rootScope.$digest();
  }));


  it('should set experimentConfiguration', function ()
  {
    expect(experimentService.experimentConfiguration).toBe(simulationData.experimentConfiguration);
  });

  it('should set environmentConfiguration', function ()
  {
    expect(experimentService.environmentConfiguration).toBe(simulationData.environmentConfiguration);
  });

  it('should set creationDate', function ()
  {
    expect(experimentService.creationDate).toBe(simulationData.creationDate);
  });

  it('should set creationDate', function ()
  {
    expect(experimentService.creationDate).toBe(simulationData.creationDate);
  });

  it('should set owner display name', function ()
  {
    expect(experimentService.owner).toBe('ownerDisplayName');
  });

  it('should init rosTopics', function ()
  {
    expect(experimentService.rosTopics).not.toBeNull();
  });

  it('should init rosbridgeWebsocketUrl', function ()
  {
    expect(experimentService.rosbridgeWebsocketUrl).not.toBeNull();
  });

  it('should init versionString', function ()
  {
    rootScope.$digest();

    expect(experimentService.versionString).not.toBeNull();
  });


});

