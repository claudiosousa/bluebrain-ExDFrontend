(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .provider('collabExperimentLockService', function () {

      //The edition lock file name that will be created within the experiment folder
      var LOCK_FILE_NAME = 'edit.lock';
      var LOCK_FILE_CONTENT = 'This file was automatically created to prevent experiment concurrent edition';
      var LOCK_FILE_POLL_RATE = 10 * 1000;//each 10s

      return {
        $get: ['$q',
          '$interval',
          'hbpIdentityUserDirectory',
          'collabFolderAPIService',
          function ($q, $interval, hbpIdentityUserDirectory, collabFolderAPIService) {

            //whether a file name exists within a folder id
            var getFolderFileMetaData = function (folderId, fileName) {
              return collabFolderAPIService.getFolderFile(folderId, fileName)
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

            //creates a contextfull lock service for a given contextId
            var createLockServiceForContext = function (contextId) {

              //the folderId for the Collab context
              var folderId = collabFolderAPIService.getExperimentFolderId(contextId);

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
                    return collabFolderAPIService.deleteFile(folderId, LOCK_FILE_NAME);
                  });
              };

              //tries to lock an experiment for edition
              var tryAddLock = function () {
                return isLocked()
                  .then(function (lockInfo) {
                    var result = {
                      success: !lockInfo.locked,
                      lock: lockInfo
                    };
                    if (!result.success) {
                      result.lock = lockInfo;
                      return $q.when(result);
                    }
                    return $q.when(folderId)
                      .then(function (folderId) {
                        return collabFolderAPIService.createFolderFile(folderId, LOCK_FILE_NAME, LOCK_FILE_CONTENT);
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
