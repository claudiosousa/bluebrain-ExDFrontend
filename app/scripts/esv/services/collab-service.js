/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/
(function () {
  'use strict';

  var module = angular.module('collabServices', ['ngResource', 'bbpConfig',
    'nrpErrorHandlers']);

  module.factory('collabConfigService', ['$resource', 'serverError', 'bbpConfig', function ($resource, serverError, bbpConfig) {
    var baseUrl = bbpConfig.get('api.collabContextManagement.url');
    return $resource(baseUrl + '/collab/configuration/:contextID', {}, {
      clone: {
        method: 'PUT',
        interceptor: {responseError: serverError.displayHTTPError}
      },
      get: {
        method: 'GET',
        interceptor: {responseError: serverError.displayHTTPError}
      }
    });
  }]);

  module.service('collabFolderAPIService', ['$http', '$q', '$interpolate', 'collabConfigService', 'hbpFileStore','bbpConfig','$stateParams', 'clbStorage', function ($http, $q, $interpolate, collabConfigService, hbpFileStore, bbpConfig,$stateParams, clbStorage) {
    var baseUrl = bbpConfig.get('api.document.v0');
    var collabBaseUrl = bbpConfig.get('api.collab.v0');

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
      return hbpFileStore.getContent(id, customConfig);
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

    var entityUrl = function(entity) {
      return baseUrl+'/'+entity._entityType.split(':')[0]+'/'+entity._uuid;
    };

    this.uploadEntity = function(file, entity) {
      return $http.post(entityUrl(entity)+'/content/upload', file, angular.extend({
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      })).$promise;
    };

    /**
     *  Fetches all the files under a folder in the storage of the current collab
     *  First we get the current experiment context, then using that context we get the 
     *  list of navigational entities. These entities are objects that are appearing in 
     *  the list on the left column of the collab. Then we 
     *  get the files under a specific folder in the navigational entity
     *  
     *  Example usage : 
     *  var robotsList = collabFolderAPIService.getFilesFromNavEntityFolder('Storage','robots');
     *  which will fetch all the files under the robots folder in the storage
     *
     * @param  navEntityName the name of the navigational entity                
     * @param  folderName the name of the folder under the navigational entity 
     * @return a promise that contains the files under the storage folder 
     **/
    this.getFilesFromNavEntityFolder = function (navEntityName, folderName) {
      return getCurrentCollab(this.getContextId())
        .then(function successCallback(response) {
          return getCollabNavEntities(response.data);
        }, function () {
          return $q.reject('Could not retrieve the collab');
        }).then(function (response) {
          var navEntity = _.find(response.data, function (folder) {
            return folder.name === navEntityName;
          });
          if (!navEntity) {
            return $q.reject(navEntityName + " folder was not found on this collab");
          }
          return clbStorage.getEntity({ ctx: navEntity.context });
        })
        .then(clbStorage.getChildren)
        .then(function (result) {
          var folder = _.find(result.results, function (folder) {
            return folder._name === folderName;
          });
          if (!folder) {
            return $q.reject(folderName + " folder was not found on this collab");
          }
          return clbStorage.getChildren(folder);
        });
    };

    /**
     *  Returns the current collab (i.e. the collab on which the experiment belongs to),
     *  based on the input context id
     *  
     *  Example usage : 
     *  var collabDataPromise = getCurrentCollab($stateParams.ctx);
     *  which will return the promise containing the current collab data 
     *
     * @param  contextId the context id provided                
     * @return a promise that contains the collab data 
     **/
    var getCurrentCollab = function (contextId) {
      return $http({
        method: 'GET',
        url: collabBaseUrl + '/collab/context/' + contextId + '/'
      });
    };

    /**
     *  Returns the navigational entities under the current collab (i.e. the collab on which the experiment belongs to),
     *  based on the input collab data
     *  
     *  Example usage : 
     *  var currentCollabPromise =  getCurrentCollab($stateParams.ctx);
     *  var collabNavigationalEntitiesPromise = currentCollabPromise.then(function (response){
     *  return getCollabNavEntities(response.data)};
     *  which will return the promise containing the current collab data 
     *
     * @param  contextId the context id provided                
     * @return a promise that contains the collab data 
     **/
    var getCollabNavEntities = function (currentCollab) {
      return $http({
        method: 'GET',
        url: collabBaseUrl + '/collab/' + currentCollab.collab.id + '/nav/all/'
      });
    };

    /**
     *  Returns the current collab contextId
     *  
     *  Example usage : 
     *  var contextId =  collabFolderAPIService.getContextId;
     *              
     * @return the current contextId uuid
     **/
    this.getContextId = function () {
      return $stateParams.ctx;
    };
  }
  ]);
} ());