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
  var httpBackend, bbpConfig, collabConfigService, collabFolderAPIService, clbStorage, $q, scope;
  var baseUrl;
  var matchAllRegex = new RegExp('.*');
  var fakeGETData = {experimentID: 'FakeExperimentID', results:[true], experimentFolderUUID: 'FakeExperimentFolderUUID'};
  var fakePOSTData = {code: 200, message: 'Success', _entityType: 'testEntity'};

  // load the service to test and mock the necessary service
  beforeEach(module('collabServices'));
  beforeEach(module('hbpCollaboratoryCore'));

  beforeEach(inject(function (_$httpBackend_, _bbpConfig_, _collabConfigService_, _collabFolderAPIService_, _clbStorage_, _$q_, _$rootScope_) {
    httpBackend = _$httpBackend_;
    bbpConfig = _bbpConfig_;
    collabConfigService = _collabConfigService_;
    collabFolderAPIService = _collabFolderAPIService_;
    clbStorage = _clbStorage_;
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

  it('test createFolderFile calls clbStorage with correct paramters', function() {
    spyOn(clbStorage, 'upload');
    collabFolderAPIService.createFolderFile('FakeFolderId', 'FileName', 'fileContent');
    var blob = new Blob(['fileContent'], {type: 'text/plain'});
    blob.name = 'FileName';
    expect(clbStorage.upload).toHaveBeenCalledWith(blob, {parent: {uuid: 'FakeFolderId'}});
  });

  it('test deleteFile works when everything goes normally', function() {
    spyOn(collabFolderAPIService, 'getFolderFile').and.callFake(function(){
      var deferred = $q.defer();
      deferred.resolve({'uuid':'123'});
      return deferred.promise;
    });
    spyOn(clbStorage, 'delete').and.returnValue($q.when(true));
    var returnValue = collabFolderAPIService.deleteFile('FakeFolderId', 'FileName');
    scope.$apply();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalledWith('FakeFolderId', 'FileName');
    expect(clbStorage.delete).toHaveBeenCalledWith({'uuid':'123'});
    returnValue.then(function(value){
      expect(value).toBe(true);
    });
  });

  it('test deleteFile handles when a file cannont be deleted', function() {
    spyOn(collabFolderAPIService, 'getFolderFile').and.callFake(function(){
      var deferred = $q.defer();
      deferred.resolve(null);
      return deferred.promise;
    });
    spyOn(clbStorage, 'delete').and.returnValue($q.reject());
    var returnValue = collabFolderAPIService.deleteFile('FakeFolderId', 'FileName');
    scope.$apply();
    expect(collabFolderAPIService.getFolderFile).toHaveBeenCalledWith('FakeFolderId', 'FileName');
    expect(clbStorage.delete).not.toHaveBeenCalled();
    returnValue.then(function(value){
      expect(value).toBe(false);
    });
  });

  it('test getFolderFile', function() {
    var returnValue = collabFolderAPIService.getFolderFile('FakeFolderId', 'FileName');
    httpBackend.expectGET(baseUrl+'/folder/FakeFolderId/children/?name=FileName');
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

  it('test downloadFile calls clbStorage with expected parameters', function() {
    spyOn(clbStorage, 'getContent');
    collabFolderAPIService.downloadFile('FakeFolderId');
    expect(clbStorage.getContent).toHaveBeenCalledWith('FakeFolderId', undefined);
    clbStorage.getContent.calls.reset();
    // test with some custom config
    collabFolderAPIService.downloadFile('FakeFolderId', {responseType: 'blob'});
    expect(clbStorage.getContent).toHaveBeenCalledWith('FakeFolderId', {responseType: 'blob'});
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

describe('Services: collab-folder-api-service', function () {
  var httpBackend, bbpConfig, collabConfigService, collabFolderAPIService, $q, scope, clbStorage;

  beforeEach(module('collabServices'));
  //beforeEach(module('hbpDocumentClient.core'));
  beforeEach(module('hbpCollaboratoryCore'));

  beforeEach(inject(function (_$httpBackend_, _bbpConfig_, _collabConfigService_,
    _collabFolderAPIService_, _$q_, _$rootScope_, _clbStorage_) {
    httpBackend = _$httpBackend_;
    bbpConfig = _bbpConfig_;
    collabConfigService = _collabConfigService_;
    collabFolderAPIService = _collabFolderAPIService_;
    $q = _$q_;
    scope = _$rootScope_.$new();
    clbStorage = _clbStorage_;

    var collabBaseUrl = bbpConfig.get('api.collab.v0');
    var fakeCollabUrl = collabBaseUrl + '/collab/context/' + 'fakeContextId' + '/';
    spyOn(collabFolderAPIService, 'getContextId').and.callFake(function () {
      return 'fakeContextId';
    });
    var fakeNavEntitiesUrl = collabBaseUrl + '/collab/' + 1716 + '/nav/all/';
    httpBackend.whenGET(fakeCollabUrl).respond(
      {
        id: 17508,
        context: 'a107967f-4466-48b7-a16a-49f86c74c689',
        name: 'EpxerimentExample',
        collab:
        {
          id: 1716,
          title: 'Dev servers test',
          content: 'Dev servers test'
        }

      });
    httpBackend.whenGET(fakeNavEntitiesUrl).respond(
      [
        { id: 15359, name: 'Overview' },
        { id: 15360, name: 'Team' },
        { id: 15361, name: 'Storage' },
        { id: 15362, name: 'Settings' },
        { id: 15364, name: 'Documentation' },
        { id: 15365, name: 'Support' },
        { id: 17501, name: 'My Dev Experiment' },
        { id: 17508, name: 'EpxerimentExample' }
      ]
    );
    spyOn(clbStorage, 'getEntity').and.callFake(function () {
      /*jshint camelcase: false */
      return {
        uuid: '04bc38c7-f30b-4c1c-976d-830ffa4b7d27',
        entity_type: 'project',
        name: 'Dev servers test'
      };
    });
    spyOn(clbStorage, 'getChildren').and.callFake(function () {
      return {
        results:
        [
          { name: 'robots' },
          { name: 'Environments' }
        ]
      };
    });
    spyOn($q, 'reject').and.callFake(function () {
      return;
    });
  }));

  it('should test getFilesFromNavEntityFolder successfuly retrieves the files', function () {
    collabFolderAPIService.getFilesFromNavEntityFolder('Storage', 'robots');
    httpBackend.flush();
    expect(collabFolderAPIService.getContextId).toHaveBeenCalled();
    expect($q.reject).not.toHaveBeenCalled();
  });

  it('should test getFilesFromNavEntityFolder with wrong nav envtity name calls the reject function', function () {
    collabFolderAPIService.getFilesFromNavEntityFolder('fakeNavName', 'robots');
    httpBackend.flush();
    expect($q.reject).toHaveBeenCalledWith('fakeNavName' + ' folder was not found on this collab');
  });

  it('should test getFilesFromNavEntityFolder with wrong folder name calls the reject function', function () {
    collabFolderAPIService.getFilesFromNavEntityFolder('Storage', 'FakeRbots');
    httpBackend.flush();
    expect($q.reject).toHaveBeenCalledWith('FakeRbots' + ' folder was not found on this collab');
  });
});



