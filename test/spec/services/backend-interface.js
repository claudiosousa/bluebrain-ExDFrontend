'use strict';

describe('Services: backendInterfaceService', function () {

  var $resource,
    $stateParams,
    bbpConfig,
    serverError,
    backendInterfaceService;

  var bbpConfigMock = {};
  var SERVER_BASE_URL = 'fubar';
  bbpConfigMock.get = jasmine.createSpy('get').andReturn({'someServerId': {'gzweb': {'nrp-services': SERVER_BASE_URL}}});

  beforeEach(module('exdFrontendApp'));
  beforeEach(module(function ($provide) {
    $provide.constant('bbpConfig', bbpConfigMock);
    $provide.value('$stateParams', {serverID: 'someServerId', simulationID: 'someSimulationId '});
  }));
  beforeEach(inject(function (_$resource_, _$stateParams_, _bbpConfig_, _serverError_, _backendInterfaceService_) {
    $resource = _$resource_;
    $stateParams = _$stateParams_;
    bbpConfig = _bbpConfig_;
    serverError = _serverError_;
    backendInterfaceService = _backendInterfaceService_;
  }));

  it('should set the server base URL correctly', function () {
    expect(backendInterfaceService.getServerBaseUrl()).toEqual(SERVER_BASE_URL);
  });

});
