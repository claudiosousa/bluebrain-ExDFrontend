(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .constant('SAVE_FILE', 'editor_errors.saved')
    .service('saveErrorsService', ['$stateParams', '$q', 'collabFolderAPIService', 'hbpIdentityUserDirectory',
      'hbpDialogFactory', 'SAVE_FILE','tempFileService', 'environmentService',
      function ($stateParams, $q, collabFolderAPIService, hbpIdentityUserDirectory,
        hbpDialogFactory, SAVE_FILE, tempFileService, environmentService) {
        /*
        This service can be used to save data (which contains Python errors) to an error file. e.g. TFs, SMs, Brain Editor.
        It's needed as if they are saved to the normal file, further simulations are not possible.
        */
        var dirtyDataCol = {},
          loaded = false,
          foundCallbacks = {};

        return {
          saveDirtyData: saveDirtyData,
          getErrorSavedWork: getErrorSavedWork,
          clearDirty: clearDirty,
          registerCallback: registerCallback
        };
        function saveDirtyData(dirtyType, data){
          var dataObj = {};
          dataObj[dirtyType] = data;
          return tempFileService.saveDirtyData(SAVE_FILE, false, dataObj, dirtyType);
        }
        function clearDirty(dirtyType){
          if(!environmentService.isPrivateExperiment())
            return $q.reject();
          return collabFolderAPIService.getExperimentFolderId($stateParams.ctx)
            .then(function(folderId){
              return collabFolderAPIService.getFolderFile(folderId, SAVE_FILE);
             })
             .then(function(file){
               return collabFolderAPIService.downloadFile(file._uuid)
                 .then(function(fileContent){
                   var content = angular.fromJson(fileContent);
                   delete content[dirtyType];
                   if (Object.keys(content).length === 0)
                     return removeTempErrorSave();
                   else
                     return collabFolderAPIService.uploadEntity(angular.toJson(content), file);
                 });
             });
        }
        function removeTempErrorSave() {
          return tempFileService.removeSavedWork(SAVE_FILE);
        }

        function getErrorSavedWork() {
          if(loaded)
            return $q.reject();
          return tempFileService.checkSavedWork(SAVE_FILE, foundCallbacks)
            .finally(function(){
              loaded = true;
            });
        }

        function registerCallback(dirtyType, cb) {
          foundCallbacks[dirtyType] = cb;
        }

      }]
    );
} ());



