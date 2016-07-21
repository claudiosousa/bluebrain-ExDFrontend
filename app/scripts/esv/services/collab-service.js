(function () {
  'use strict';

  var module = angular.module('collabServices', ['ngResource', 'bbpConfig',
    'nrpErrorHandlers']);

  module.factory('collabConfigService', ['$resource', 'serverError', 'bbpConfig', function ($resource, serverError, bbpConfig) {
    var baseUrl = bbpConfig.get('api.collabContextManagement.url');
    return $resource(baseUrl + '/collab/configuration/:contextID', {}, {
      clone: {
        method: 'PUT',
        interceptor: {responseError: serverError.display}
      },
      get: {
        method: 'GET',
        interceptor: {responseError: serverError.display}
      }
    });
  }]);

  module.service('collabFolderAPIService', ['$http', '$q', '$interpolate', 'collabConfigService', 'hbpFileStore','bbpConfig', function ($http, $q, $interpolate, collabConfigService, hbpFileStore, bbpConfig) {
    var baseUrl = bbpConfig.get('api.document.v0');

    //creates a file within a folder, using the name and content past in the parameters
    this.createFolderFile = function (folderId, fileName, fileContent, blobType) {
      if (!blobType){
        blobType = {type: 'text/plain'};
      }
      var blob = new Blob([fileContent], blobType);
      blob.name = fileName;
      return hbpFileStore.upload(blob,{
        parent: {
          _uuid: folderId
        }
      });
    };

    //deletes a file within a folder
    this.deleteFile = function (folderId, fileName) {
      return this.getFolderFile(folderId, fileName).then(function (file) {
        if (!file) {
          return false;
        }
        var url = $interpolate('{{baseUrl}}/file/{{fileId}}')({
          baseUrl: baseUrl,
          fileId: file._uuid
        });
        return $http.delete(url).then(function () {
          return true;
        });
      });
    };

    //searches for a file name within a folder id
    this.getFolderFile = function (folderId, fileName) {
      var url = $interpolate('{{baseUrl}}/folder/{{folderId}}/children?filter=_name={{fileName}}')({
        baseUrl: baseUrl,
        folderId: folderId,
        fileName: fileName
      });
      return $http.get(url).then(function (response) {
        return response &&
          response.data &&
          response.data.result &&
          response.data.result.length &&
          response.data.result[0];
      });
    };

    this.downloadFile = function(id, customConfig){
      if (customConfig){
        return hbpFileStore.getContent(id, customConfig);
      }
      return hbpFileStore.getContent(id);
    };

    //gets the experiment folder uuid for a Collab context
    this.getExperimentFolderId = function (contextId) {
      var deferred = $q.defer();
      var collabConfig = collabConfigService.get({ contextID: contextId },
      function () {
        deferred.resolve(collabConfig.experimentFolderUUID);
      },
      function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    };
 }]);

}());
