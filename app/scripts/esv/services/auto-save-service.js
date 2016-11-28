(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .constant('AUTO_SAVE_INTERVAL', 20 * 1000)
    .constant('AUTO_SAVE_FILE', 'env_editor.autosaved')
    .service('autoSaveService', ['$stateParams', '$q', 'collabFolderAPIService', 'hbpIdentityUserDirectory',
      'hbpDialogFactory', 'AUTO_SAVE_INTERVAL', 'AUTO_SAVE_FILE',
      function ($stateParams, $q, collabFolderAPIService, hbpIdentityUserDirectory,
        hbpDialogFactory, AUTO_SAVE_INTERVAL, AUTO_SAVE_FILE) {

        var dirtyDataCol = {},
          dataTimestamp,
          retrieving = false,
          foundAutoSavedCallbacks = {},
          getFolderId = _.memoize(collabFolderAPIService.getExperimentFolderId),
          scheduleDirtyDataSaving = _.throttle(saveDirtyData, AUTO_SAVE_INTERVAL, { leading: false });

        return {
          setDirty: setDirty,
          clearDirty: clearDirty,
          checkAutoSavedWork: checkAutoSavedWork,
          registerFoundAutoSavedCallback: registerFoundAutoSavedCallback
        };

        function saveDirtyData() {
          return getFolderId($stateParams.ctx)
            .then(function (folderId) {
              return collabFolderAPIService.getFolderFile(folderId, AUTO_SAVE_FILE)
                .then(function (file) {
                  if (file)
                    return collabFolderAPIService.uploadEntity(angular.toJson(dirtyDataCol), file);
                  else
                    return collabFolderAPIService.createFolderFile(folderId, AUTO_SAVE_FILE, angular.toJson(dirtyDataCol));
                })
                .then(function(){
                  dataTimestamp = Date.now() + 1000;
                })
                .catch(function () {
                  scheduleDirtyDataSaving();
                });
            });
        }

        function setDirty(dirtyType, dirtyData) {
          if (!$stateParams.ctx)
            return;
          dirtyDataCol[dirtyType] = dirtyData;
          scheduleDirtyDataSaving();
          dataTimestamp = Date.now();
        }

        function clearDirty(dirtyType) {
          if (!$stateParams.ctx)
            return;
          delete dirtyDataCol[dirtyType];
          if (_.isEmpty(dirtyDataCol))
            removeAutoSavedWork();
          else
            scheduleDirtyDataSaving();
        }

        function removeAutoSavedWork() {
          scheduleDirtyDataSaving.cancel();
          return getFolderId($stateParams.ctx)
            .then(function (folderId) {
              return collabFolderAPIService.deleteFile(folderId, AUTO_SAVE_FILE);
            });
        }

        function checkAutoSavedWork() {
          if (!$stateParams.ctx)
            return $q.reject();

          return retrieveAutoSavedWork()
            .then(function (savedWork) {
              if (!savedWork)
                return $q.reject();

              dirtyDataCol = savedWork;

              _.forEach(savedWork, function (value, key) {
                foundAutoSavedCallbacks[key] && foundAutoSavedCallbacks[key](value);
              });
              return savedWork;
            });
        }

        function registerFoundAutoSavedCallback(dirtyType, cb) {
          foundAutoSavedCallbacks[dirtyType] = cb;
        }

        function retrieveAutoSavedWork() {
          if (retrieving)
            return $q.reject();

          retrieving = true;

          return getFolderId($stateParams.ctx)
            .then(function (folderId) {
              return collabFolderAPIService.getFolderFile(folderId, AUTO_SAVE_FILE);
            })
            .then(function (file) {
              if (!file)
                return $q.reject();

              if (dataTimestamp && new Date(file._modifiedOn).getTime() <= dataTimestamp)
                return $q.reject();

              dataTimestamp = new Date(file._modifiedOn).getTime();

              return $q.all([
                file,
                collabFolderAPIService.downloadFile(file._uuid).then(angular.fromJson),
                hbpIdentityUserDirectory.get([file._createdBy])
              ]);
            })
            .then(_.spread(function (file, foundFile, userInfo) {
              var username = userInfo[file._createdBy].displayName;
              return hbpDialogFactory.confirm({
                title: 'Auto-saved data',
                confirmLabel: 'Restore',
                cancelLabel: 'Discard',
                template: 'There is unsaved work from a previous session by user ' + username + '. Would you like to restore it or discard it?',
                closable: false
              }).then(function () {
                return foundFile;
              }).catch(function () {
                removeAutoSavedWork();
              });
            }))
            .finally(function () {
              retrieving = false;
            });
        }
      }]
    );
} ());
