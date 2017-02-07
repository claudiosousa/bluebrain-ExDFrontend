(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .service('tempFileService', ['$stateParams', '$q', 'collabFolderAPIService', 'hbpIdentityUserDirectory',
      'hbpDialogFactory',
      function ($stateParams, $q, collabFolderAPIService, hbpIdentityUserDirectory,
        hbpDialogFactory) {

        var dirtyDataCol = {},
          getFolderId = _.memoize(collabFolderAPIService.getExperimentFolderId);

        return {
          dirtyDataCol: dirtyDataCol,
          saveDirtyData: saveDirtyData,
          removeSavedWork: removeSavedWork,
          checkSavedWork: checkSavedWork,
        };

        function saveDirtyData(filename, overwrite, data, dirtyType) {
          /* Save dirty data to a file. If overwrite is false, only this type of data will be changed in the file. */
          if (!$stateParams.ctx)
            return $q.reject();
          var defer = $q.defer();
          getFolderId($stateParams.ctx)
            .then(function (folderId) {
              return collabFolderAPIService.getFolderFile(folderId, filename)
                .then(function (file) {
                  if (file){
                    if (overwrite){
                      return collabFolderAPIService.uploadEntity(angular.toJson(data), file);
                    }
                    else {
                      return collabFolderAPIService.downloadFile(file._uuid)
                        .then(function(fileContent){
                          var content = angular.fromJson(fileContent);
                          content[dirtyType] = data[dirtyType];
                          return collabFolderAPIService.uploadEntity(angular.toJson(content), file);
                        });
                    }
                  }
                  else
                    return collabFolderAPIService.createFolderFile(folderId, filename, angular.toJson(data));
                })
                .then(function(){
                  defer.resolve();
                });
            });
            return defer.promise;
        }

        function removeSavedWork(filename) {
          if (!$stateParams.ctx)
            return $q.reject();
          return getFolderId($stateParams.ctx)
            .then(function (folderId) {
              return collabFolderAPIService.deleteFile(folderId, filename);
            });
        }

        function checkSavedWork(filename, callbacks, confirmBox) {
          if (!$stateParams.ctx)
            return $q.reject();
          return retrieveSavedWork(filename, confirmBox)
            .then(function (savedWork) {
              if (!savedWork)
                return $q.reject();

              _.forEach(savedWork, function (value, key) {
                callbacks[key] && callbacks[key](value);
              });
              return savedWork;
            });
        }

        function retrieveSavedWork(filename, confirmBox) {
          return getFolderId($stateParams.ctx)
            .then(function (folderId) {
              return collabFolderAPIService.getFolderFile(folderId, filename);
            })
            .then(function (file) {
              if (!file)
                 return $q.reject();
              return $q.all([
                file,
                collabFolderAPIService.downloadFile(file._uuid).then(angular.fromJson),
                hbpIdentityUserDirectory.get([file._createdBy])
              ]);
            })
            .then(_.spread(function (file, foundFile, userInfo) {
              var username = userInfo[file._createdBy].displayName;
              if (confirmBox){
                return hbpDialogFactory.confirm({
                  title: 'Auto-saved data',
                  confirmLabel: 'Restore',
                  cancelLabel: 'Discard',
                  template: 'There is unsaved work from a previous session by user ' + username + '. Would you like to restore it or discard it?',
                  closable: false
                }).then(function () {
                  return foundFile;
                });
              }
              else {
                return foundFile;
              }
            }));
        }
      }]
    );
} ());



