(function () {
  'use strict';

  /**
   * @ngdoc service
   * @namespace exdFrontendApp.services
   * @module exdFrontendApp
   * @name exdFrontendApp.autoSaveService
   * @description Service responsible for auto saving the work in progress
   */
    angular.module('exdFrontendApp')
    .constant('AUTO_SAVE_INTERVAL', 20 * 1000)
    .constant('AUTO_SAVE_FILE', 'env_editor.autosaved')
    .service('autoSaveService', ['$stateParams', '$q', 'AUTO_SAVE_INTERVAL', 'AUTO_SAVE_FILE', 'tempFileService',
      function ($stateParams, $q, AUTO_SAVE_INTERVAL, AUTO_SAVE_FILE, tempFileService) {

        var dirtyDataCol = {},
          loaded = false,
          retrieving = false,
          foundAutoSavedCallbacks = {},
          scheduleDirtyDataSaving = _.throttle(saveDirtyData, AUTO_SAVE_INTERVAL, { leading: false });

        return {
          saveDirtyData: saveDirtyData,
          setDirty: setDirty,
          clearDirty: clearDirty,
          checkAutoSavedWork: checkAutoSavedWork,
          registerFoundAutoSavedCallback: registerFoundAutoSavedCallback
        };

        /**
         * Save the data which is marked as dirty
         * @method saveDirtyData
         * @instance
         */
        function saveDirtyData(){
          return tempFileService.saveDirtyData(AUTO_SAVE_FILE, true, dirtyDataCol)
            .catch(function(){
              scheduleDirtyDataSaving();
            });
        }

        /**
         * Sets a type of data as dirty
         * @method setDirty
         * @instance
         * @param {} dirtyType
         * @param {} dirtyData
         */
        function setDirty(dirtyType, dirtyData) {
          if (!$stateParams.ctx)
            return;
          dirtyDataCol[dirtyType] = dirtyData;
          scheduleDirtyDataSaving();
        }

        /**
         * Clear the dirty data set for a dirty type
         * @instance
         * @method clearDirty
         * @param {} dirtyType
         */
        function clearDirty(dirtyType) {
          if(!$stateParams.ctx)
            return;
          delete dirtyDataCol[dirtyType];
          if(_.isEmpty(dirtyDataCol))
            removeAutoSavedWork();
          else
            scheduleDirtyDataSaving();
        }
        /**
         * Clear the dirty data set for a dirty type
         * @instance
         * @method clearDirty
         * @param {} dirtyType
         */
        function removeAutoSavedWork() {
          scheduleDirtyDataSaving.cancel();
          return tempFileService.removeSavedWork(AUTO_SAVE_FILE);
        }

        /**
         * Checks if there is auto saved work
         * @instance
         * @method checkAutoSavedWork
         * @return CallExpression
         */
        function checkAutoSavedWork(){
          if(retrieving || loaded){
            return $q.reject();
          }
          retrieving = true;
          return tempFileService.checkSavedWork(AUTO_SAVE_FILE, foundAutoSavedCallbacks, true)
            .then(function(savedWork){
              dirtyDataCol = savedWork;
            })
            .catch(function(){
              removeAutoSavedWork();
              return $q.reject();
            })
            .finally(function(){
              retrieving = false;
              loaded = true;
            });
        }
        /**
         * Resgisters a callback to be called when dirty data of the specified type is called
         * @method registerFoundAutoSavedCallback
         * @instance
         * @param {} dirtyType
         * @param {} cb The callback function to be called
         */
        function registerFoundAutoSavedCallback(dirtyType, cb) {
          foundAutoSavedCallbacks[dirtyType] = cb;
        }
      }]
    );
} ());
