'use strict';

describe('Services: slurminfo', function () {
  var httpBackend, bbpConfig, slurminfoService, expectedResult;
  var restServiceUrl;

  // load the service to test and mock the necessary service
  beforeEach(module('slurminfoService'));

  beforeEach(inject(function (_$httpBackend_, _bbpConfig_, _slurminfoService_) {
    httpBackend = _$httpBackend_;
    bbpConfig = _bbpConfig_;
    slurminfoService = _slurminfoService_;
    expectedResult = {'name':'interactive','available':true,'cpus':[280,264,0,544],'nodes':[34,0,0,34],'gpus':2};
    restServiceUrl = bbpConfig.get('api.slurmmonitor.url') + '/api/v1/partitions/interactive';
    httpBackend.whenGET(restServiceUrl).respond(expectedResult);
    spyOn(console, 'error');
  }));

  it('should fetch the usage of the cluster', function() {
    var result;
    slurminfoService.get(function(data) { result = data; });
    httpBackend.expectGET(restServiceUrl);
    httpBackend.flush();
    expect(result.name).toBe('interactive');
    expect(result.available).toBe(true);
    expect(result.cpus).toEqual([280,264,0,544]);
    expect(result.nodes).toEqual([34,0,0,34]);
    expect(result.gpus).toBe(2);

  });

});
