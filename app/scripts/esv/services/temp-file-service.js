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
(function() {
  'use strict';

  angular.module('exdFrontendApp')
    .service('tempFileService', ['$stateParams', '$q', '$rootScope', 'clbUser',
      'nrpModalService', 'environmentService', 'simulationInfo', 'storageServer',
      function($stateParams, $q, $rootScope, clbUser,
        nrpModalService, environmentService, simulationInfo, storageServer) {

        var dirtyDataCol = {};

        return {
          dirtyDataCol: dirtyDataCol,
          saveDirtyData: saveDirtyData,
          removeSavedWork: removeSavedWork,
          checkSavedWork: checkSavedWork,
        };

        function saveDirtyData(filename, overwrite, data, dirtyType) {
          /* Save dirty data to a file. If overwrite is false, only this type of data will be changed in the file. */
          if (!environmentService.isPrivateExperiment())
            return $q.reject();

          if (overwrite)
            return storageServer.setFileContent(simulationInfo.experimentID, filename, angular.toJson(data), true);

          return storageServer.getFileContent(simulationInfo.experimentID, filename, true)
            .then(file => {
              let currentData = file.uuid ? angular.fromJson(file.data) : {};
              if (dirtyType)
                currentData[dirtyType] = data[dirtyType];
              else
                angular.extend(currentData, data);

              return storageServer.setFileContent(simulationInfo.experimentID, filename, angular.toJson(currentData), true);
            });
        };

        function removeSavedWork(filename) {
          if (!environmentService.isPrivateExperiment())
            return $q.reject();

          return storageServer.deleteFile(simulationInfo.experimentID, filename, true);
        }

        function checkSavedWork(filename, callbacks, confirmBox) {
          if (!environmentService.isPrivateExperiment())
            return $q.reject();
          return retrieveSavedWork(filename, confirmBox)
            .then(_.spread(function(savedWork, applySaved) {
              if (!savedWork)
                return $q.reject();

              _.forEach(savedWork, function(value, key) {
                callbacks[key] && callbacks[key](value, applySaved);
              });
              return [savedWork, applySaved];
            }));
        }

        function retrieveSavedWork(filename, confirmBox) {

          return storageServer.getFileContent(simulationInfo.experimentID, filename, true)
            .then(file => {
              if (!file.uuid)
                return $q.reject('No file found');

              return angular.fromJson(file.data);
            })
            .then(foundFile => {
              if (confirmBox) {
                var localScope = $rootScope.$new();
                localScope.username = 'TODO';
                return nrpModalService.createModal({
                  templateUrl: 'views/common/restore-auto-saved.html',
                  closable: true,
                  scope: localScope
                }).then(function(applySaved) {
                  return [foundFile, applySaved];
                });
              }
              else {
                return [foundFile];
              }
            });
        }
      }]
    );
}());



