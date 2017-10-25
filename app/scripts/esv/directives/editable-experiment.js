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

  angular.module('exdFrontendApp').directive('editableExperiment', [
    '$timeout',
    '$window',
    '$stateParams',
    'clbErrorDialog',
    'environmentService',
    'userContextService',
    'collabExperimentLockService',
    'storageServer',
    function(
      $timeout,
      $window,
      $stateParams,
      clbErrorDialog,
      environmentService,
      userContextService,
      collabExperimentLockService,
      storageServer
    ) {
      return {
        scope: true,
        link: function(scope) {
          scope.isSavingToCollab = false;

          let editLockEntity;
          let lockService;
          if (environmentService.isPrivateExperiment()) {
            lockService = collabExperimentLockService.createLockServiceForExperimentId(
              scope.exp.id
            );
          }

          scope.descID = 'descID';
          scope.nameID = 'nameID';
          scope.editing = {};
          scope.editing[scope.descID] = false;
          scope.editing[scope.nameID] = false;

          // exposed to unit test purposes
          scope.originalConfiguration = null;

          var shouldSave = function(input, originalValue, editingKey) {
            if (!input || input.trim().length === 0) {
              clbErrorDialog.open({
                type: 'InputError',
                message: 'Name/Description of an experiment cannot be empty.'
              });
              return false;
            }
            if (scope.containsTags(input)) {
              clbErrorDialog.open({
                type: 'InputError',
                message:
                  'Name/Description of an experiment cannot contain an HTML tag.'
              });
              return false;
            }
            if (input === originalValue) {
              scope.isSavingToCollab = false;
              scope.stopEditingExperimentDetails(editingKey);
              return false;
            }
            return true;
          };

          scope.saveExperimentDetails = function(newDetails, editingKey) {
            var originalValue =
              editingKey === scope.nameID
                ? scope.originalConfiguration.name
                : scope.originalConfiguration.description;

            if (!shouldSave(newDetails, originalValue, editingKey)) {
              return;
            }
            scope.isSavingToCollab = true;
            if (!scope.exp.configuration.experimentFile) {
              clbErrorDialog.open({
                type: 'Error',
                message:
                  'Something went wrong when retrieving the experiment_configuration.exc file from the collab storage. Please check the file exists and is not empty.'
              });
              scope.isSavingToCollab = false;
              return;
            }
            var xml = scope.exp.configuration.experimentFile;
            xml = xml.replace(originalValue, newDetails);
            storageServer
              .setFileContent(
                scope.exp.id,
                'experiment_configuration.exc',
                xml,
                true
              )
              .then(
                function(response) {
                  scope.isSavingToCollab = false;
                  scope.exp.configuration.experimentFile = xml;
                  scope.stopEditingExperimentDetails(editingKey);
                },
                function() {
                  if (editingKey === scope.nameID) {
                    scope.exp.configuration.name = originalValue;
                  } else {
                    scope.exp.configuration.description = originalValue;
                  }

                  scope.isSavingToCollab = false;
                  clbErrorDialog.open({
                    type: 'CollabSaveError',
                    message:
                      'Error while saving updated experiment details to Collab storage.'
                  });
                }
              );
          };

          scope.containsTags = function(input) {
            var div = document.createElement('div');
            div.innerHTML = input;
            return div.innerText !== input;
          };

          scope.stopEditingExperimentDetails = function(editingKey) {
            lockService &&
              lockService.releaseLock().catch(function() {
                clbErrorDialog.open({
                  type: 'CollabError',
                  message:
                    'The edit lock could not be released. Please remove it manually from the Storage area.'
                });
              });
            scope.editing[editingKey] = false;
          };

          scope.editExperiment = function(elementID) {
            if (lockService) {
              scope.loadingEdit = true;
              lockService
                .tryAddLock()
                .then(function(result) {
                  if (
                    !result.success &&
                    result.lock &&
                    result.lock.lockInfo.user.id !== scope.userinfo.userID
                  ) {
                    // save uuid
                    editLockEntity = result.lock.lockInfo.entity;
                    clbErrorDialog.open({
                      type: 'AlreadyEditingError',
                      message:
                        'Sorry you cannot edit at this time. Only one user can edit at a time and ' +
                        result.lock.lockInfo.user.displayName +
                        ' started editing ' +
                        moment(new Date(result.lock.lockInfo.date)).fromNow() +
                        '. Please try again later.'
                    });
                  } else {
                    editLockEntity = null;
                    scope.loadingEdit = false;
                    scope.editing[elementID] = true;
                    scope.originalConfiguration = {
                      name: scope.exp.configuration.name,
                      description: scope.exp.configuration.description
                    };
                    $timeout(function() {
                      $window.document.getElementById(elementID).focus();
                    }, 0);
                  }
                })
                .catch(function() {
                  clbErrorDialog.open({
                    type: 'CollabError',
                    message:
                      'There was an error in opening the edit feature, please try again later.'
                  });
                })
                .finally(function() {
                  scope.loadingEdit = false;
                });
            }
          };
        }
      };
    }
  ]);
})();
