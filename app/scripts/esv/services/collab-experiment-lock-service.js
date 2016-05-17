(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .provider('collabExperimentLockService', function () {

      //The edition lock file name that will be created within the experiment folder
      var LOCK_FILE_NAME = 'edit.lock';
      var LOCK_FILE_CONTENT = 'This file was automatically created to prevent experiment concurrent edition';
      var LOCK_FILE_POLL_RATE = 10 * 1000;//each 10s

      return {
        $get: ['$http',
          '$q',
          '$interpolate',
          '$interval',
          'collabConfigService',
          'hbpFileStore',
          'bbpConfig',
          'hbpIdentityUserDirectory',
          function ($http, $q, $interpolate, $interval, collabConfigService, hbpFileStore, bbpConfig, hbpIdentityUserDirectory) {

            var baseUrl = bbpConfig.get('api.document.v0');

            //searches for a file name within a folder id
            var getFolderFile = function (folderId, fileName) {

              var url = $interpolate('{{baseUrl}}/folder/{{folderId}}/children?filter=_name={{fileName}}')({
                baseUrl: baseUrl,
                folderId: folderId,
                fileName: fileName
              });

              return $http.get(url)
                .then(function (response) {
                  return $q.when(response &&
                    response.data &&
                    response.data.result &&
                    response.data.result.length &&
                    response.data.result[0]);
                });
            };

            //whether a file name exists within a folder id
            var getFolderFileMetaData = function (folderId, fileName) {
              return getFolderFile(folderId, fileName)
                .then(function (foundFile) {
                  var lockResponse = {
                    locked: !!foundFile
                  };
                  if (!lockResponse.locked) {
                    return $q.when(lockResponse);
                  }

                  return hbpIdentityUserDirectory.get([foundFile._createdBy])
                    .then(function (userInfo) {
                      lockResponse.lockInfo = {
                        user: {
                          displayName: userInfo[foundFile._createdBy].displayName,
                          id: foundFile._createdBy
                        },
                        date: foundFile._createdOn
                      };
                      return $q.when(lockResponse);
                    });
                });
            };

            //creates a file within a folder, using the name and content past in the parameters
            var createFolderFile = function (folderId, fileName, fileContent) {
              var blob = new Blob([fileContent], { type: 'text/plain' });
              blob.name = fileName;

              return hbpFileStore.upload(blob,
                {
                  parent: {
                    _uuid: folderId
                  }
                });
            };

            //deletes a file within a folder
            var deleteFile = function (folderId, fileName) {
              return getFolderFile(folderId, fileName)
                .then(function (file) {
                  if (!file) {
                    return $q.when(false);
                  }

                  var url = $interpolate('{{baseUrl}}/file/{{fileId}}')({
                    baseUrl: baseUrl,
                    fileId: file._uuid
                  });

                  return $http.delete(url)
                    .then(function () {
                      return $q.when(true);
                    });
                });
            };

            //gets the experiment folder uuid for a Collab context
            var getExperimentFolderId = function (contextId) {
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

            //creates a contextfull lock service for a given contextId
            var createLockServiceForContext = function (contextId) {

              //the folderId for the Collab context
              var folderId = getExperimentFolderId(contextId);

              //gets whether the experiment is lock for edition
              var isLocked = function () {
                return folderId
                  .then(function (folderId) {
                    return getFolderFileMetaData(folderId, LOCK_FILE_NAME);
                  });
              };

              //releases the edition lock
              var releaseLock = function () {
                return folderId
                  .then(function (folderId) {
                    return deleteFile(folderId, LOCK_FILE_NAME);
                  });
              };

              //tries to lock an experiment for edition
              var tryAddLock = function () {
                return isLocked()
                  .then(function (lockInfo) {
                    var result = {
                      success: !lockInfo.locked
                    };
                    if (!result.success) {
                      result.lock = lockInfo;
                      return $q.when(result);
                    }
                    return $q.when(folderId)
                      .then(function (folderId) {
                        return createFolderFile(folderId, LOCK_FILE_NAME, LOCK_FILE_CONTENT);
                      })
                      .then(function () {
                        return $q.when(result);
                      });
                  });
              };

              var lockChangedPromise;
              var previousIsLockedStatus;
              //subscribes to lockedStatusChange polling
              //and returns the unsubscribe function
              var onLockChanged = function (callback) {
                lockChangedPromise = $interval(function () {
                  isLocked().then(function (isCurrentlyLocked) {
                    //calls the callback when the isLocked status changed
                    if (isCurrentlyLocked.locked !== previousIsLockedStatus) {
                      previousIsLockedStatus = isCurrentlyLocked.locked;
                      callback(isCurrentlyLocked);
                    }
                  });
                }, LOCK_FILE_POLL_RATE);

                return function () { $interval.cancel(lockChangedPromise); };
              };

              return {
                onLockChanged: onLockChanged,
                isLocked: isLocked,
                tryAddLock: tryAddLock,
                releaseLock: releaseLock
              };
            };

            return {
              createLockServiceForContext: createLockServiceForContext
            };
          }]
      };
    });
} ());
