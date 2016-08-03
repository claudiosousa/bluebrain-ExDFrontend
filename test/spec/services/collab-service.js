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


describe('Services: collab-folder-api-service', function () {
  var httpBackend, bbpConfig, collabConfigService, collabFolderAPIService, hbpFileStore, $q, scope;
  var baseUrl;
  var matchAllRegex = new RegExp('.*');
  var fakeGETData = {experimentID: 'FakeExperimentID', result:[true], experimentFolderUUID: 'FakeExperimentFolderUUID'};
  var fakePOSTData = {code: 200, message: 'Success', _entityType: 'testEntity'};

  // load the service to test and mock the necessary service
  beforeEach(module('collabServices'));
  beforeEach(module('hbpDocumentClient.core'));

  beforeEach(inject(function (_$httpBackend_, _bbpConfig_, _collabConfigService_, _collabFolderAPIService_, _hbpFileStore_, _$q_, _$rootScope_) {
    httpBackend = _$httpBackend_;
    bbpConfig = _bbpConfig_;
    collabConfigService = _collabConfigService_;
    collabFolderAPIService = _collabFolderAPIService_;
    hbpFileStore = _hbpFileStore_;
    $q = _$q_;
    scope = _$rootScope_.$new();

    baseUrl = bbpConfig.get('api.document.v0');
    httpBackend.whenPOST(matchAllRegex).respond(fakePOSTData);
    httpBackend.whenGET(matchAllRegex).respond(fakeGETData);
    httpBackend.whenDELETE(baseUrl +'/file/123').respond({});

    spyOn(console, 'error');
  }));

  it('test createFolderFile creates a file in the collab', function() {
    var returnValue = collabFolderAPIService.createFolderFile('FakeFolderId', 'FileName', 'fileContent');
    httpBackend.expectPOST(matchAllRegex);
    httpBackend.flush();
    returnValue.then(function(value){
      expect(value).toEqual(fakePOSTData);
    });
    scope.$apply();
  });

  it('test createFolderFile calls hbpFileStore with correct paramters', function() {
    spyOn(hbpFileStore, 'upload');
    collabFolderAPIService.createFolderFile('FakeFolderId', 'FileName', 'fileContent');
    var blob = new Blob(['fileContent'], {type: 'text/plain'});
    blob.name = 'FileName';
    expect(hbpFileStore.upload).toHaveBeenCalledWith(blob, {parent: {_uuid: 'FakeFolderId'}});
  });

  it('test deleteFile works when everything goes normally', function() {
    spyOn(collabFolderAPIService, 'getFolderFile').andCallFake(function(){
      var deferred = $q.defer();
      deferred.resolve({'_uuid':'123'});
      return deferred.promise;
    });
    var returnValue = collabFolderAPIService.deleteFile('FakeFolderId', 'FileName');
    httpBackend.expectDELETE(baseUrl+'/file/123');
    httpBackend.flush();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalledWith('FakeFolderId', 'FileName');
    returnValue.then(function(value){
      expect(value).toBe(true);
    });
    scope.$apply();
  });

  it('test deleteFile handles when a file cannont be deleted', function() {
    spyOn(collabFolderAPIService, 'getFolderFile').andCallFake(function(){
      var deferred = $q.defer();
      deferred.resolve(null);
      return deferred.promise;
    });
    var returnValue = collabFolderAPIService.deleteFile('FakeFolderId', 'FileName');
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalledWith('FakeFolderId', 'FileName');
    returnValue.then(function(value){
      expect(value).toBe(false);
    });
    scope.$apply();
  });

  it('test getFolderFile', function() {
    var returnValue = collabFolderAPIService.getFolderFile('FakeFolderId', 'FileName');
    httpBackend.expectGET(baseUrl+'/folder/FakeFolderId/children?filter=_name=FileName');
    httpBackend.flush();
    returnValue.then(function(value){
      expect(value).toBe(true);
    });
    scope.$apply();
  });

  it('test downloadFile', function() {
     var returnValue = collabFolderAPIService.downloadFile('FakeFolderId');
    httpBackend.expectGET(matchAllRegex);
    httpBackend.flush();
    returnValue.then(function(value){
      expect(value).toEqual(fakeGETData);
    });
    scope.$apply();
  });

  it('test downloadFile calls hbpFileStore with expected parameters', function() {
    spyOn(hbpFileStore, 'getContent');
    collabFolderAPIService.downloadFile('FakeFolderId');
    expect(hbpFileStore.getContent).toHaveBeenCalledWith('FakeFolderId');
    hbpFileStore.getContent.reset();
    // test with some custom config
    collabFolderAPIService.downloadFile('FakeFolderId', {responseType: 'blob'});
    expect(hbpFileStore.getContent).toHaveBeenCalledWith('FakeFolderId', {responseType: 'blob'});
  });

  it('test getExperimentFolderId', function() {
    var returnValue = collabFolderAPIService.getExperimentFolderId('FakeContextId');
    httpBackend.expectGET(matchAllRegex);
    httpBackend.flush();
    returnValue.then(function(value){
      expect(value).toBe('FakeExperimentFolderUUID');
    });
    scope.$apply();
  });

  it('test getExperimentFolderId calls collabConfigService with expected parameters', function() {
    spyOn(collabConfigService, 'get');
    collabFolderAPIService.getExperimentFolderId('FakeContextId');
    expect(collabConfigService.get).toHaveBeenCalledWith({contextID: 'FakeContextId'}, jasmine.any(Function), jasmine.any(Function));
  });
});


