'use strict';

describe('Services: experimentsFactory', function () {
  var $q, experimentProxyService, collabFolderAPIService, experimentsFactory, scope, httpBackend;

  beforeEach(module('experimentServices'));
  beforeEach(module('exdFrontendApp'));
  beforeEach(inject(function (_$q_, _experimentProxyService_, _collabFolderAPIService_, _experimentsFactory_, _$rootScope_, _$httpBackend_) {
    $q = _$q_;
    experimentProxyService = _experimentProxyService_;
    collabFolderAPIService = _collabFolderAPIService_;
    experimentsFactory = _experimentsFactory_;
    scope = _$rootScope_;
    httpBackend = _$httpBackend_;

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
    var experiments = [{joinableServers:[]}];
    var image = {'0' : 'fakeImage'};
    spyOn(experimentProxyService, 'getExperiments').andReturn($q.when(experiments));
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
    var experiments = [{joinableServers:[]}];
    var image = {'0' : 'fakeImage'};
    spyOn(experimentProxyService, 'getExperiments').andReturn($q.when(experiments));
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

});
