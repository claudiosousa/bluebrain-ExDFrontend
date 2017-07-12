/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
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
 * ---LICENSE-END**/
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
    .service('autoSaveService', ['$stateParams', '$q', 'AUTO_SAVE_INTERVAL', 'AUTO_SAVE_FILE', 'tempFileService', 'environmentService',
      function ($stateParams, $q, AUTO_SAVE_INTERVAL, AUTO_SAVE_FILE, tempFileService, environmentService) {

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
          if (!environmentService.isPrivateExperiment())
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
          if(!environmentService.isPrivateExperiment())
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
            .then(_.spread(function(savedWork, applySaved) {
              if (applySaved)
                removeAutoSavedWork();
              else
                dirtyDataCol = savedWork;
            }))
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
