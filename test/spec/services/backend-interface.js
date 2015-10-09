'use strict';

describe('Services: backendInterfaceService', function () {
  var backendInterfaceService, simulationInfo;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module(function ($provide) {
    $provide.value('simulationInfo', { serverBaseUrl: 'server-base-url'});
  }));
  beforeEach(inject(function (_backendInterfaceService_, _simulationInfo_) {
    backendInterfaceService = _backendInterfaceService_;
    simulationInfo = _simulationInfo_;
  }));

  it('should set the server base URL correctly', function () {
    expect(backendInterfaceService.getServerBaseUrl()).toEqual(simulationInfo.serverBaseUrl);
  });

});
