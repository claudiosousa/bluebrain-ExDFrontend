'use strict';

describe('Services: slurminfo', function () {
  var httpBackend, bbpConfig, slurminfoService, expectedResult;
  var restServiceUrl;

  // load the service to test and mock the necessary service
  beforeEach(module('slurminfoService'));

  describe('Available cluster', function() {

    beforeEach(inject(function (_$httpBackend_, _bbpConfig_, _slurminfoService_) {
      httpBackend = _$httpBackend_;
      bbpConfig = _bbpConfig_;
      slurminfoService = _slurminfoService_;
      expectedResult = {'name':'interactive','available':true,'cpus':[280,264,0,544],'nodes':[34,0,0,34],'gpus':2};
      restServiceUrl = bbpConfig.get('api.slurmmonitor.url') + '/api/v1/partitions/interactive';
      httpBackend.whenGET(restServiceUrl).respond(expectedResult);
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

  describe('Unavailable cluster', function() {
    var serverErrorMock = {};
    var serverError;
    serverErrorMock.displayHTTPError = jasmine.createSpy('displayHTTPError');

    beforeEach(module(function ($provide) {
      $provide.value('serverError', serverErrorMock);
    }));

    beforeEach(inject(function (_$httpBackend_, _bbpConfig_, _slurminfoService_, _serverError_) {
      serverError = _serverError_;
      httpBackend = _$httpBackend_;
      bbpConfig = _bbpConfig_;
      slurminfoService = _slurminfoService_;
      restServiceUrl = bbpConfig.get('api.slurmmonitor.url') + '/api/v1/partitions/interactive';
      httpBackend.whenGET(restServiceUrl).respond(-1, '');
    }));

    it('should enhance error when viz cluster is not available', function() {
      var result;
      slurminfoService.get(function(data) { result = data; });
      httpBackend.expectGET(restServiceUrl);
      httpBackend.flush();
      var response = serverError.displayHTTPError.calls.mostRecent().args[0];
      expect(response.status).toBe(-1);
      expect(response.data).not.toBe('');
    });
  });


});
