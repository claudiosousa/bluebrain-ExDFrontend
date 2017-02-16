'use strict';

describe('Services: nrp-versions', function () {
  var nrpBackendVersions, nrpFrontendVersion;
  var serverError;
  var httpBackend;
  var serverURL = 'http://bbpce014.epfl.ch:8080';
  var serverErrorMock = {};
  serverErrorMock.displayHTTPError = jasmine.createSpy('displayHTTPError');

  beforeEach(module('nrpBackendAbout'));

    beforeEach(module(function ($provide) {
      $provide.value('serverError', serverErrorMock);
    }));

  beforeEach(inject(function($httpBackend, _serverError_, _nrpBackendVersions_, _nrpFrontendVersion_){
    httpBackend = $httpBackend;
    serverError = _serverError_;
    nrpBackendVersions = _nrpBackendVersions_;
    nrpFrontendVersion = _nrpFrontendVersion_;
    serverError.displayHTTPError.calls.reset();
  }));

  afterEach(function() {
     httpBackend.verifyNoOutstandingExpectation();
     httpBackend.verifyNoOutstandingRequest();
   });

  it('should retrieve the versions of the CLosed Loop Engine and the Experiment Designer Back-Ends', function() {
    nrpBackendVersions(serverURL).get();
    httpBackend.expectGET(serverURL + '/version').respond(200);
    httpBackend.flush();
    expect(serverError.displayHTTPError.calls.count()).toBe(0);
  });

  it('should parse properly the versions', function() {
    var response = nrpBackendVersions(serverURL).get();
    // Many lines are ignored for jshint. The reason is the use of underscore. And we use them to reflect the way python packages are named.
    var softwareAVersion = '1.2.3';
    var softwareBVersion = '1.3.4.dev4';
    var softwareCVersion = 'Not_a_standard_version';

    var serverResponse = {software_a: softwareAVersion, software_b: softwareBVersion, software_c: softwareCVersion}; // jshint ignore:line
    httpBackend.expectGET(serverURL + '/version').respond(200, serverResponse); // jshint ignore:line
    httpBackend.flush();
    expect(response.software_a).toEqual(softwareAVersion); // jshint ignore:line
    expect(response.software_b).toEqual(softwareBVersion); // jshint ignore:line
    expect(response.software_c).toEqual(softwareCVersion); // jshint ignore:line
    expect(response.software_b_components).toEqual({ major : '1', minor : '3', patch : '4', dev : 'dev4'}); // jshint ignore:line
    expect(response.software_a_components).toEqual(jasmine.objectContaining({ major : '1', minor : '2', patch : '3'})); // jshint ignore:line
    expect(response.software_c_components).not.toBeDefined(); // jshint ignore:line

  });

  it('should call once serverError when the service call fails', function() {
    var response = nrpBackendVersions(serverURL).get();
    httpBackend.expectGET(serverURL + '/version').respond(400);
    httpBackend.flush();
    expect(serverError.displayHTTPError.calls.count()).toBe(1);
    response = serverError.displayHTTPError.calls.mostRecent().args[0];
    expect(response.status).toBe(400);
   });
});
