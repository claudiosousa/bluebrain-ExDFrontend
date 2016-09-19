'use strict';

describe('Services: experimentsFactory', function () {
  var $q, experimentProxyService, collabFolderAPIService, experimentsFactory, scope, httpBackend, $interval;

  beforeEach(module('experimentServices'));
  beforeEach(module('exdFrontendApp'));
  beforeEach(inject(function (_$q_, _experimentProxyService_, _collabFolderAPIService_, _experimentsFactory_, _$rootScope_, _$httpBackend_, _$interval_) {
    $q = _$q_;
    experimentProxyService = _experimentProxyService_;
    collabFolderAPIService = _collabFolderAPIService_;
    experimentsFactory = _experimentsFactory_;
    scope = _$rootScope_;
    httpBackend = _$httpBackend_;
    $interval = _$interval_;

    httpBackend.whenGET(new RegExp('.*')).respond({});
    spyOn(console, 'error');
  }));

  it('image should come from proxy', function() {
    var experiments = [{joinableServers:[]}];
    var image = {'0' : 'fakeImage'};
    spyOn(experimentProxyService, 'getExperiments').andReturn($q.when(experiments));
    spyOn(experimentProxyService, 'getImages').andReturn($q.when(image));
    spyOn(collabFolderAPIService, 'getFolderFile');
    var exp = experimentsFactory.createExperimentsService();
    exp.initialize();
    scope.$apply();
    exp.experiments.then(function(experiments){
      expect(experiments[0].imageData).toBe(image[0]);
    });
    expect(collabFolderAPIService.getFolderFile).not.toHaveBeenCalled();
  });

  it('image should come from collab storage', function() {
    var experiments = [{joinableServers:[]}];
    spyOn(experimentProxyService, 'getExperiments').andReturn($q.when(experiments));
    spyOn(collabFolderAPIService, 'getFolderFile').andReturn($q.when({_uuid: 'fakeUUID'}));
    spyOn(experimentProxyService, 'getImages');
    var imageData = 'data:image/png;base64,fakeContent';
    var blob = new Blob([imageData],{type : 'image/png'});
    spyOn(collabFolderAPIService, 'downloadFile').andReturn($q.when(blob));
    var readAsDataURL = jasmine.createSpy();
    var eventListener = jasmine.createSpy();
    spyOn(window, 'FileReader').andReturn({
      addEventListener: eventListener,
      readAsDataURL: readAsDataURL
    });
    var exp = experimentsFactory.createExperimentsService('context_id', 'experimentid', 'folder_id');
    exp.initialize();
    scope.$apply();

    eventListener.mostRecentCall.args[1]({
      target:{
        result:imageData
      }
    });
    scope.$apply();
    exp.experiments.then(function(experiments){
      expect(experiments[0].imageData).toBe('fakeContent');
    });
    expect(experimentProxyService.getImages).not.toHaveBeenCalled();
  });

  it('image should come from proxy if collab storage fails', function() {
    var image = {'experimentid' : 'fakeImage'};
    spyOn(experimentProxyService, 'getJoinableServers').andReturn($q.when([]));
    spyOn(experimentProxyService, 'getAvailableServers').andReturn($q.when([]));
    spyOn(experimentProxyService, 'getImages').andReturn($q.when(image));

    spyOn(collabFolderAPIService, 'getFolderFile').andReturn($q.when(null));

    var exp = experimentsFactory.createExperimentsService('context_id', 'experimentid', 'folder_id');
    exp.initialize();
    scope.$apply();

    exp.experiments.then(function(experiments){
      expect(experiments[0].imageData).toBe('fakeImage');
    });
    scope.$apply();
    expect(experimentProxyService.getImages).toHaveBeenCalled();
  });

  it('image should come from proxy if downloading image from collab storage failed', function() {
    var image = {'experimentid' : 'fakeImage'};
    spyOn(experimentProxyService, 'getJoinableServers').andReturn($q.when([]));
    spyOn(experimentProxyService, 'getAvailableServers').andReturn($q.when([]));
    spyOn(collabFolderAPIService, 'getFolderFile').andReturn($q.when({_uuid: 'fakeUUID'}));
    spyOn(experimentProxyService, 'getImages').andReturn($q.when(image));
    spyOn(collabFolderAPIService, 'downloadFile').andReturn($q.when(null));

    var exp = experimentsFactory.createExperimentsService('context_id', 'experimentid', 'folder_id');
    exp.initialize();
    scope.$apply();

    exp.experiments.then(function(experiments){
      expect(experiments[0].imageData).toBe('fakeImage');
    });
   scope.$apply();
   expect(experimentProxyService.getImages).toHaveBeenCalled();
  });

  it('experiment name and description should come from collab storage', function() {
    spyOn(experimentProxyService, 'getJoinableServers').andReturn($q.when([]));
    spyOn(experimentProxyService, 'getAvailableServers').andReturn($q.when([]));
    spyOn(collabFolderAPIService, 'getFolderFile').andReturn($q.when({_uuid: 'fakeUUID'}));
    spyOn(experimentProxyService, 'getImages');
    var xml = '<?xml version="1.0" ?><ns1:ExD xmlns:ns1="http://schemas.humanbrainproject.eu/SP10/2014/ExDConfig"><ns1:name>newName</ns1:name><ns1:description>newDescription</ns1:description><ns1:timeout>100</ns1:timeout></ns1:ExD>';
    spyOn(collabFolderAPIService, 'downloadFile').andReturn($q.when(xml));
    var exp = experimentsFactory.createExperimentsService('context_id', 'experimentid', 'folder_id');
    exp.initialize();
    scope.$apply();

    exp.experiments.then(function(experiments){
      expect(experiments[0].configuration.name).toBe('newName');
      expect(experiments[0].configuration.description).toBe('newDescription');
      expect(experiments[0].configuration.timeout).toBe(100);
    });
    scope.$apply();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalledWith('folder_id', 'experiment_configuration.xml');
  });

  it('refresh should update collab experiments joinable servers', function() {
    var joinableServer = [{server: 'testHost', runningSimulation: {owner:'1', simulationID:5}}];
    var callCount = 0;
    spyOn(experimentProxyService, 'getJoinableServers').andCallFake(function(){
      if (callCount === 0){
        callCount ++;
        return $q.when([]);
      }
      else if (callCount === 1){
        callCount ++;
        return $q.when(joinableServer);
      }
    });
    spyOn(experimentProxyService, 'getAvailableServers').andReturn($q.when([]));
    spyOn(collabFolderAPIService, 'getFolderFile').andReturn($q.when({_uuid: 'fakeUUID'}));
    spyOn(collabFolderAPIService, 'downloadFile').andReturn($q.when(''));
    var exp = experimentsFactory.createExperimentsService('context_id', 'experimentid', 'folder_id');
    exp.initialize();
    scope.$apply();
    $interval.flush(10 * 1000);
    exp.experiments.then(function(experiments){
      expect(experiments[0].joinableServers).toEqual(joinableServer);
    });
   scope.$apply();

  });
});
