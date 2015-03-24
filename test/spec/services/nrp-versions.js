'use strict';

describe('Services: nrp-versions', function () {
  var nrpVersions;
  var serverError;
  var httpBackend;
  var serverURL = 'http://bbpce014.epfl.ch:8080';

  beforeEach(module('nrpBackendAbout'));

    beforeEach(module(function ($provide) {
      $provide.value('serverError', jasmine.createSpy('serverError'));
    }));

  beforeEach(inject(function($httpBackend, _serverError_, _nrpVersions_){
    httpBackend = $httpBackend;
    serverError = _serverError_;
    nrpVersions = _nrpVersions_;
    serverError.reset();
  }));

  afterEach(function() {
     httpBackend.verifyNoOutstandingExpectation();
     httpBackend.verifyNoOutstandingRequest();
   });

  it('should retrieve the versions of the CLosed Loop Engine and the Experiment Designer Back-Ends', function() {
    nrpVersions(serverURL).get();
    httpBackend.expectGET(serverURL + '/version').respond(200);
    httpBackend.flush();
    expect(serverError.callCount).toBe(0);
  });

  it('should call once serverError when the service call fails', function() {
    var response = nrpVersions(serverURL).get();
    httpBackend.expectGET(serverURL + '/version').respond(400);
    httpBackend.flush();
    expect(serverError.callCount).toBe(1);
    response = serverError.mostRecentCall.args[0];
    expect(response.status).toBe(400);
   });
});
