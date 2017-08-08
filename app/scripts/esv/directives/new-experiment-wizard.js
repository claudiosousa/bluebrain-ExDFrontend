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

    angular.module('exdFrontendApp')
        .directive('newExperimentWizard', [
            '$q',
            'storageServer',
            'nrpModalService',
            'clbErrorDialog',
            '$http',
            'newExperimentProxyService',
            'collabConfigService',
            '$window',
            '$stateParams',
            function (
                $q,
                storageServer,
                nrpModalService,
                clbErrorDialog,
                $http,
                newExperimentProxyService,
                collabConfigService,
                $window,
                $stateParams
            ) {
                return {
                    templateUrl: 'views/esv/new-experiment-wizard.html',
                    restrict: 'E',
                    replace: true,
                    scope: true, // create a child scope for the directive and inherits the parent scope properties
                    link: function ($scope, element, attrs) {
                        $scope.query = '';
                        $scope.entities = null;
                        $scope.entityPageState = {};
                        $scope.brainUploaded = false;
                        $scope.robotUploaded = false;
                        $scope.environmentUploaded = false;
                        $scope.newExperiment = 'newExperiment';
                        $scope.brain = false;
                        $scope.experimentCloned = false;
                        //object containing the path to the robot,env, brain
                        //looks like : {
                        // robotPath: 'icub_model/icub.sdf'
                        // environmentPath: 'virtual_room/vitual_room.sdf'
                        // brainPath: 'brain_models/braitenberg.py'
                        //}
                        $scope.paths = {};

                        var RobotUploader = {
                            name: 'Robot',
                            uploadFromPublicEnv: function () {
                                delete $scope.entities;
                                newExperimentProxyService.getEntity('robots')
                                    .then(function (robotsArray) {
                                        $scope.entities = $scope.parseEntityList(robotsArray);
                                    });
                                $scope.createUploadModal('PrivateCollab');
                            },
                            uploadFromPrivateCollab: function () {
                                delete $scope.entities;
                                storageServer.getExperiments('robots')
                                    .then($scope.createEntitiesListFromEntityFiles,
                                    function (error) {
                                        $scope.createErrorPopup(error);
                                        nrpModalService.destroyModal();
                                    })
                                    .then(function (robots) {
                                        $scope.entities = robots;
                                    });
                                $scope.createUploadModal('PrivateCollab');
                            },
                            uploadFromLocalEnv: function () {
                                $scope.entityName = $scope.entityUploader.name;
                                $scope.createUploadModal('LocalEnv');
                            }
                        };

                        var EnvUploader = {
                            name: 'Environment',
                            uploadFromPublicEnv: function () {
                                delete $scope.entities;
                                newExperimentProxyService.getEntity('environments')
                                    .then(function (envsArray) {
                                        $scope.entities = $scope.parseEntityList(envsArray);
                                    });
                                $scope.createUploadModal('PrivateCollab');
                            },
                            uploadFromPrivateCollab: function () {
                                delete $scope.entities;
                                storageServer.getExperiments('environments')
                                    .then($scope.createEntitiesListFromEntityFiles,
                                    function (error) {
                                        $scope.createErrorPopup(error);
                                        nrpModalService.destroyModal();
                                    })
                                    .then(function (environments) {
                                        $scope.entities = environments;
                                    });
                                $scope.createUploadModal('PrivateCollab');
                            },
                            uploadFromLocalEnv: function () {
                                $scope.entityName = $scope.entityUploader.name;
                                $scope.createUploadModal('LocalEnv');
                            }
                        };

                        var BrainUploader = {
                            name: 'Brain',
                            uploadFromPublicEnv: function () {
                                delete $scope.entities;
                                newExperimentProxyService.getEntity('brains')
                                    .then(function (brainsArray) {
                                        $scope.entities = $scope.parseEntityList(brainsArray);
                                    });
                                $scope.createUploadModal('PrivateCollab');
                            },
                            uploadFromPrivateCollab: function () {
                                delete $scope.entities;
                                storageServer.getExperiments('brains')
                                    .then($scope.createEntitiesListFromBrainFiles,
                                    function (error) {
                                        $scope.createErrorPopup(error);
                                        nrpModalService.destroyModal();
                                    }).then(function (brains) {
                                        $scope.entities = brains;
                                        $scope.brain = true;
                                    });
                                $scope.createUploadModal('PrivateCollab');
                            },
                            uploadFromLocalEnv: function () {
                                $scope.entityName = $scope.entityUploader.name;
                                $scope.createUploadModal('LocalEnv');
                            }
                        };

                        $scope.selectNewExperiment = function () {
                            $scope.pageState.selected = $scope.newExperiment;
                        };

                        $scope.uploadEntityDialog = function (entityUploader) {
                            $scope.entityUploader = entityUploader;
                            $scope.entityName = entityUploader.name;
                            var templateUrl = {
                                templateUrl: 'views/esv/entity-upload-dialog.html',
                                closable: true,
                                scope: $scope
                            };
                            nrpModalService.createModal(templateUrl);
                        };

                        $scope.uploadRobotDialog = function () {
                            $scope.uploadEntityDialog(RobotUploader);
                        };

                        $scope.uploadEnvironmentDialog = function () {
                            $scope.uploadEntityDialog(EnvUploader);
                        };

                        $scope.uploadBrainDialog = function () {
                            $scope.uploadEntityDialog(BrainUploader);
                        };

                        var dict = {
                            PublicEnv: 'uploadFromPublicEnv',
                            PrivateCollab: 'uploadFromPrivateCollab',
                            LocalEnv: 'uploadFromLocalEnv'
                        };

                        $scope.uploadEntity = function (environment) {
                            $scope.brain = false;
                            $scope.entityUploader[dict[environment]]();
                        };

                        $scope.completeUploadEntity = function (selectedEntity) {
                            if (selectedEntity.path.match('/')) {
                                var entityType = selectedEntity.path.split('/')[0];
                                if (entityType === 'environments') {
                                    $scope.paths.environmentPath = _.join(_.drop(selectedEntity.path.split('/')), '/');
                                    $scope.environmentUploaded = true;
                                }
                                if (entityType === 'robots') {
                                    $scope.paths.robotPath = _.join(_.drop(selectedEntity.path.split('/')), '/');
                                    $scope.robotUploaded = true;
                                }
                                if (entityType === 'brains') {
                                    $scope.paths.brainPath = _.join(_.drop(selectedEntity.path.split('/')), '/');
                                    $scope.brainUploaded = true;
                                }
                            } else {
                                //code to handle other OS. For now create an error createErrorPopup
                                $scope.createErrorPopup('The provided path cannot be handled by the operating system');
                            }
                            $scope.destroyDialog();
                        };

                        $scope.destroyDialog = function () {
                            $scope.entityPageState = {};
                            $scope.entityName = '';
                            $scope.brain = false;
                            delete $scope.entities;
                            nrpModalService.destroyModal();
                        };

                        $scope.selectEntity = function (entity) {
                            $scope.entityPageState.selected = entity.id;
                        };

                        $scope.createUploadModal = function (mode) {
                            if (mode === 'LocalEnv') {
                                var templateUrl = {
                                    templateUrl: 'views/esv/entity-local-environment-upload.html',
                                    closable: true,
                                    scope: $scope
                                };
                                nrpModalService.createModal(templateUrl);
                            }
                            else if (mode === 'PrivateCollab') {
                                nrpModalService.createModal({
                                    templateUrl: 'views/esv/entities-list.html',
                                    closable: true,
                                    scope: $scope,
                                    size: 'lg',
                                    windowClass: 'modal-window'
                                });
                            }
                        };

                        $scope.createEntitiesListFromBrainFiles = function (brainFiles) {
                            return $q.all(brainFiles.map(function (brain) {
                                return storageServer.getFileContent(brain.uuid).then(function (resp) {
                                    return {
                                        name: brain.name.split(".")[0],
                                        id: brain.name.split(".")[0],
                                        description: resp.data.match(/^"""([^\"]*)"""/m)[1].trim() || 'Brain description'
                                    };
                                });
                            }));
                        };

                        $scope.createEntitiesListFromEntityFiles = function (files) {

                            var isImage = function (file) {
                                return file.content_type !== 'application/x-config';
                            };

                            files.forEach(function (file) {
                                file.entityId = file.name.split('.')[0];
                            });

                            var images = $q.all(files
                                .filter(function (f) {
                                    return isImage(f);
                                })
                                .map(function (f) {
                                    return $q.all({
                                        id: f.entityId,
                                        imageData: $scope.retrieveImageFileContent(f.uuid)
                                    });
                                }));

                            var configs = $q.all(files
                                .filter(function (f) {
                                    return !isImage(f);
                                })
                                .map(function (f) {
                                    return $q.all({
                                        id: f.entityId,
                                        config: $scope.retrieveConfigFileContent(f.uuid)
                                    })
                                        .then(function (entity) {
                                            entity.description = entity.config.desc;
                                            entity.name = entity.config.name;
                                            return entity;
                                        });
                                }));

                            return $q.all([images, configs])
                                .then(function (entityData) {
                                    return _(entityData)
                                        .flatten()
                                        .groupBy("id")
                                        .map(function (f) {
                                            return _.merge(f[0], f[1]);
                                        })
                                        .value();
                                });
                        };

                        $scope.createErrorPopup = function (errorMessage) {
                            clbErrorDialog.open({
                                type: 'Error.',
                                message: errorMessage
                            });
                        };

                        $scope.retrieveImageFileContent = function (fileid) {
                            return storageServer.getBase64Content(fileid)
                                .then(file => file.data);
                        };

                        $scope.retrieveConfigFileContent = function (fileid) {
                            return storageServer.getFileContent(fileid)
                                .then(function (file) {
                                    var xml = $.parseXML(file.data);
                                    return $q.resolve({
                                        name: xml.getElementsByTagNameNS("*", "name")[0].textContent,
                                        desc: xml.getElementsByTagNameNS("*", "description")[0].textContent
                                    });
                                });
                        };

                        $scope.parseEntityList = function (entityArray) {
                            var entities = [];
                            entityArray.data.forEach(function (entity) {
                                entities.push({
                                    name: entity.name,
                                    description: entity.description,
                                    id: entity,
                                    imageData: entity.thumbnail
                                });
                            });
                            return entities;
                        };

                        $scope.cloneNewExperiment = function (experimentID) {
                            $scope.isCloneRequested = true;
                            collabConfigService.clone({ contextID: $stateParams.ctx },
                                {
                                    experimentID: experimentID,
                                    brainPath: $scope.paths.brainPath,
                                    robotPath: $scope.paths.robotPath,
                                    envPath: $scope.paths.environmentPath
                                }, function () {
                                    $window.location.reload();
                                    $window.parent.postMessage({
                                        eventName: 'navigation.reload'
                                    }, '*');
                                });
                        };
                    }
                };
            }
        ]);
}());