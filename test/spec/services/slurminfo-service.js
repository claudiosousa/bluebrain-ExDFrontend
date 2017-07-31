'use strict';

describe('Services: slurminfo', function() {
  var httpBackend, bbpConfig, slurminfoService, expectedResult,
    restServiceUrl, $rootScope, scheduler;

  // load the service to test and mock the necessary service
  beforeEach(module('slurminfoService'));
  beforeEach(module('nrpErrorHandlers'));

  describe('Available cluster', function() {

    beforeEach(function() {
      scheduler = new Rx.TestScheduler();
      var originalTimer = Rx.Observable.timer;
      spyOn(Rx.Observable, 'timer').and.callFake(function(initialDelay, dueTime) {
        return originalTimer(initialDelay, dueTime, scheduler);
      });
    });

    beforeEach(inject(function(_$httpBackend_, _$rootScope_, _bbpConfig_, _slurminfoService_) {
      httpBackend = _$httpBackend_;
      bbpConfig = _bbpConfig_;
      slurminfoService = _slurminfoService_;
      $rootScope = _$rootScope_;

      expectedResult = { 'name': 'interactive', 'available': true, 'cpus': [280, 264, 0, 544], 'nodes': [34, 0, 0, 34], 'gpus': 2, free: 25 };
      restServiceUrl = bbpConfig.get('api.slurmmonitor.url') + '/api/v1/partitions/interactive';
      httpBackend.whenGET(restServiceUrl).respond(expectedResult);
    }));

    it('should fetch the usage of the cluster', function(done) {
      slurminfoService.subscribe(function(result) {
        expect(result.total).toEqual(34);
        expect(result.free).toBe(25);
        done();
      });
      scheduler.flush();
      $rootScope.$digest();
      httpBackend.expectGET(restServiceUrl);
      httpBackend.flush();
    });
  });

});
