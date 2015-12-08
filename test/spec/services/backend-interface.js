'use strict';

describe('Services: backendInterfaceService', function () {
  var backendInterfaceService, simulationInfo, $httpBackend, serverError;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module(function ($provide) {
    $provide.value('simulationInfo', { serverBaseUrl: 'server-base-url'});
    $provide.value('serverError', {display: jasmine.createSpy('display')});
  }));
  beforeEach(inject(function (
    _backendInterfaceService_,
    _simulationInfo_,
    _$httpBackend_,
    _serverError_) {
    backendInterfaceService = _backendInterfaceService_;
    simulationInfo = _simulationInfo_;
    $httpBackend = _$httpBackend_;
    serverError = _serverError_;
  }));

  it('should set the server base URL correctly', function () {
    expect(backendInterfaceService.getServerBaseUrl()).toEqual(simulationInfo.serverBaseUrl);
  });

  it('should make a PUT request on /experiment/:context_id/sdf_world', function () {
    $httpBackend.whenPUT(/()/).respond(200);
    simulationInfo.serverBaseUrl = 'http://bbpce014.epfl.ch:8080';
    var contextID = '97923877-13ea-4b43-ac31-6b79e130d344';
    backendInterfaceService.saveSDF(contextID);
    $httpBackend.flush();
    /*jshint camelcase: false */
    var contextObject = {context_id: contextID};
    $httpBackend.expectPUT(
      simulationInfo.serverBaseUrl + '/experiment/' +
      contextID + '/sdf_world', contextObject , contextObject
    );
  });

  it('should call serverError.display when the saveSDF PUT request fails', function () {
    $httpBackend.whenPUT(/()/).respond(500);
    simulationInfo.serverBaseUrl = 'http://bbpce014.epfl.ch:8080';
    backendInterfaceService.saveSDF('97923877-13ea-4b43-ac31-6b79e130d344');
    $httpBackend.flush();
    expect(serverError.display).toHaveBeenCalled();
  });

});
