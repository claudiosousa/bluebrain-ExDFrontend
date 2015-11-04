'use strict';

describe('Services: collab-service', function () {
  var httpBackend, bbpConfig, collabConfigService;
  var restServiceUrl;

  // load the service to test and mock the necessary service
  beforeEach(module('collabServices'));

  beforeEach(inject(function (_$httpBackend_, _bbpConfig_, _collabConfigService_) {
    httpBackend = _$httpBackend_;
    bbpConfig = _bbpConfig_;
    collabConfigService = _collabConfigService_;

    restServiceUrl = bbpConfig.get('api.collabContextManagement.url') + '/collab/configuration/1234';

    httpBackend.whenPUT(restServiceUrl).respond({code: 200, message: 'Success'});
    httpBackend.whenGET(restServiceUrl).respond({experimentID: 'FakeExperimentID'});

    spyOn(console, 'error');
  }));

  it('should save a configuration', function() {
    var result;
    collabConfigService.clone({contextID: 1234}, {experimentID: 'FakeExperimentID'}, function(data) { result = data; });
    httpBackend.expectPUT(restServiceUrl, {experimentID: 'FakeExperimentID'});
    httpBackend.flush();
  });

  it('should fetch a configuration', function() {
    var result;
    collabConfigService.get({contextID: 1234}, {}, function(data) { result = data; });
    httpBackend.expectGET(restServiceUrl);
    httpBackend.flush();
    expect(result.experimentID).toBe('FakeExperimentID');
  });

});