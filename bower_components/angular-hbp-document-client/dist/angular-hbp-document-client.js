/**
 * This module contains all the services
 * that gives access to the task manager.
 *
 * @module hbpDocumentClient
 * @requires module:bbpConfig
 * @requires module:hbpCommon
 */
angular.module('hbpDocumentClient', [
  'bbpConfig',
  'hbpCommon',
  'hbpDocumentClientTemplates'
]);
angular.module('hbpDocumentClientTemplates', ['templates/mini-browser.html']);
angular.module('templates/mini-browser.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('templates/mini-browser.html', '<div class="hbp-mini-browser">\n' + '    <ul ng-if="currentEntity.children.list === undefined">\n' + '        <li><bbp-loading class="bbp-browser-loading"/></li>\n' + '    </ul>\n' + '    <ul  ng-if="currentEntity.children.list !== undefined">\n' + '        <li ng-if="!currentEntity.root">\n' + '            <a ng-click="back($event)"><i class="hbp-browser-entity-icon fa fa-level-up"></i>..</a>\n' + '        </li>\n' + '        <li ng-if="currentEntity.children.list.length === 0"><span class="no-entity">Empty</span></li>\n' + '        <li ng-repeat="child in currentEntity.children.list">\n' + '            <a ng-if="isBrowsable(child)" ng-click="browseTo(child, $event)" ng-mouseover="mouseOver(child)">\n' + '                <hbp-icon entity="child"></hbp-icon>\n' + '                {{child._name}}\n' + '                <button ng-if="isSelectable(child)" ng-click="select(child, $event)" class="btn btn-xs btn-default">Select</button>\n' + '            </a>\n' + '            <span ng-if="!isBrowsable(child)" ng-class="{disabled: !isSelectable(child)}" ng-mouseover="mouseOver(child)">\n' + '                <hbp-icon entity="child"></hbp-icon>\n' + '                {{child._name}}\n' + '                <button ng-if="isSelectable(child)" ng-click="select(child, $event)" class="btn btn-xs btn-default">Select</button>\n' + '            </span>\n' + '        </li>\n' + '        <li ng-if="currentEntity.children.hasNext"><a class="hbp-mini-browser-more" ng-click="loadMore()">Load more</a></li>\n' + '    </ul>\n' + '</div>\n' + '');
  }
]);
(function () {
  'use strict';
  angular.module('hbpDocumentClient').directive('hbpMiniBrowser', [
    'hbpEntityStore',
    'hbpProjectStore',
    function (hbpEntityStore, hbpProjectStore) {
      return {
        restrict: 'E',
        templateUrl: 'templates/mini-browser.html',
        link: function ($scope) {
          // loads the entity child
          $scope.getChildren = function (root) {
            $scope.currentEntity.children = { list: undefined };
            if (root) {
              //bbpBrowserRest.getProjectsAndReleases(entities).then( function() {
              hbpProjectStore.getAll().then(function (res) {
                // add current users permissions to entities
                _.forEach(res.result, function (project) {
                  hbpEntityStore.getUserAccess(project).then(function (access) {
                    project.canRead = access.canRead;
                    project.canWrite = access.canWrite;
                    project.canManage = access.canManage;  // TODO: rewrite to entities.list[i].access = access
                  });
                });
                $scope.currentEntity.children = {
                  list: res.result,
                  hasNext: res.hasMore
                };
              });
            } else {
              // there is a parent, we display it's children
              hbpEntityStore.getChildren($scope.currentEntity.entity).then(function (res) {
                $scope.currentEntity.children = {
                  list: res.result,
                  hasNext: res.hasMore
                };
              });
            }
          };
          // initialize current entity with provided entity if any
          if ($scope.entity && $scope.entity._parent) {
            $scope.currentEntity = {
              root: false,
              entity: { _uuid: $scope.entity._parent }
            };
            hbpEntityStore.get($scope.currentEntity.entity._uuid).then(function (entity) {
              $scope.currentEntity.entity = entity;
              $scope.getChildren(false);
            });
          } else {
            $scope.currentEntity = {
              root: true,
              entity: null
            };
            $scope.getChildren(true);
          }
          // Loads the current entity parent's children
          $scope.back = function (event) {
            event.preventDefault();
            if (!$scope.currentEntity.root) {
              if ($scope.currentEntity.entity._parent) {
                // there is a parent, we display it's children
                hbpEntityStore.get($scope.currentEntity.entity._parent).then(function (entity) {
                  $scope.currentEntity.entity = entity;
                  $scope.getChildren(false);
                });
                $scope.currentEntity.entity = {};
                $scope.currentEntity.root = false;
              } else {
                // otherwise we display the list of root entities
                $scope.currentEntity.root = true;
                $scope.getChildren(true);
              }
            }
          };
          // Loads current entity's children
          $scope.browseTo = function (child, event) {
            event.preventDefault();
            $scope.currentEntity.root = false;
            $scope.currentEntity.entity = child;
            $scope.getChildren(false);
          };
          $scope.loadMore = function () {
            var lastId = $scope.currentEntity.children.list[$scope.currentEntity.children.list.length - 1]._uuid;
            var addToCurrentEntity = function (res) {
              // remove the first element of the new page to avoid duplicate
              res.result.shift();
              // add new page to previous children list
              Array.prototype.push.apply($scope.currentEntity.children.list, res.result);
              $scope.currentEntity.children.hasNext = res.hasMore;
            };
            if ($scope.currentEntity.root) {
              hbpProjectStore.getAll({ from: lastId }).then(addToCurrentEntity);
            } else {
              hbpEntityStore.getChildren($scope.currentEntity.entity, { from: lastId }).then(addToCurrentEntity);
            }
          };
          // Calls the selection callback if defined
          $scope.select = function (entity, event) {
            event.preventDefault();
            if ($scope.selection) {
              $scope.selection()(entity);
            }
          };
          // Calls the mouse-over callback if defined
          $scope.mouseOver = function (entity) {
            if (typeof $scope.hovered() === 'function') {
              $scope.hovered()(entity);
            }
          };
          $scope.isBrowsable = function (entity) {
            return $scope.browsable() ? $scope.browsable()(entity) : entity._entityType !== 'file' && entity._entityType !== 'link:file';
          };
          $scope.isSelectable = function (entity) {
            if ($scope.selectable && $scope.selectable()) {
              return $scope.selectable()(entity);
            }
            return false;
          };
        },
        scope: {
          selection: '&hbpSelection',
          selectable: '&hbpSelectable',
          browsable: '&hbpBrowsable',
          hovered: '&hbpHovered',
          entity: '=hbpCurrentEntity'
        }
      };
    }
  ]);
}());
/**
 * The `hbpEntityStore` service retrieve any kind of entity.
 *
 * @module hbpEntityStore
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 */
angular.module('hbpDocumentClient').service('hbpEntityStore', [
  '$http',
  '$q',
  'bbpConfig',
  'hbpUserDirectory',
  'hbpDocumentClientResolveUserIds',
  function ($http, $q, bbpConfig, hbpUserDirectory, hbpDocumentClientResolveUserIds) {
    'use strict';
    var baseUrl = bbpConfig.get('api.document.v0');
    var hbpEntityStore = {};
    /**
     * Get an entity from its id
     *
     * @function
     * @memberof module:hbpEntityStore
     */
    hbpEntityStore.get = function (id) {
      return $http.get(baseUrl + '/entity/' + id).then(function (data) {
        return data.data;
      });
    };
    /**
     * Return true if the entity should be considered as a container.
     *
     * @function
     * @memberof module:hbpEntityStore
     */
    hbpEntityStore.isContainer = function (entity) {
      return /.*(folder|release|project)$/.test(entity._entityType);
    };
    /**
     * Retrieve the complete path of the provided entity
     *
     * @function
     * @memberof module:hbpEntityStore
     */
    hbpEntityStore.getPath = function (entity) {
      var deferred = $q.defer();
      var path = entity._name;
      var onError = function () {
        deferred.reject('Cannot retrieve entity path');
      };
      if (!entity._parent) {
        deferred.resolve('/' + path);
      } else {
        hbpEntityStore.get(entity._parent).then(function (parent) {
          hbpEntityStore.getPath(parent).then(function (parPath) {
            path = parPath + '/' + path;
            deferred.resolve(path);
          }, onError);
        }, onError);
      }
      return deferred.promise;
    };
    var buildEntityTypeFilter = function (accept, acceptLink) {
      if (acceptLink) {
        accept = accept.concat(_.map(acceptLink === true ? accept : acceptLink, function (type) {
          return 'link:' + type;
        }));
      }
      if (accept && accept.length > 0) {
        return '_entityType=' + accept.join('+');
      } else {
        return;
      }
    };
    /**
     * @summary
     * Retrieve children entities of a 'parent' entity according to the options and
     * add them to the children list.
     *
     * @description
     * The returned promise will be resolved with the
     * list of fetched children and a flag indicating if more results are available
     * in the queried direction.
     *
     * Available options:
     *
     * * accept: array of accepted _entityType,
     * * acceptLink: true or an array of accepted linked _entityType,
     * * sort: property to sort on (default to '_name'),
     * * resolveUserId (=false): if true, resolve user ids to user names
     * * until: fetch results until the given id (exclusive with from)
     * * from: fetch results from the given id (exclusive with until)
     *
     * @function
     * @memberof module:hbpEntityStore
     */
    hbpEntityStore.getChildren = function (parent, options) {
      var d = $q.defer();
      options = angular.extend({}, options);
      $http.get(baseUrl + '/' + parent._entityType + '/' + parent._uuid + '/children', {
        params: {
          filter: buildEntityTypeFilter(options.accept, options.acceptLink),
          sort: options.sort ? options.sort : '_name',
          from: options.from,
          until: options.until
        }
      }).then(function (res) {
        var children = res.data.result;
        if (options.resolveUserId) {
          hbpDocumentClientResolveUserIds(children);
        }
        d.resolve(res.data);
      }, d.reject, d.notify);
      return d.promise;
    };
    /**
     * Get current user access right to the provided entity.
     *
     * @description
     * The returned promise will be resolved
     * with an object literal containing three boolean
     * flags corresponding the user access:
     *
     * - canRead
     * - canWrite
     * - canManage
     *
     * @function
     * @memberof module:hbpEntityStore
     */
    hbpEntityStore.getUserAccess = function (entity) {
      var deferred = $q.defer();
      $q.all({
        'acl': $http.get(baseUrl + '/' + entity._entityType + '/' + entity._uuid + '/acl'),
        'user': hbpUserDirectory.getCurrentUser()
      }).then(function (aggregatedData) {
        var acls = aggregatedData.acl.data;
        // expected resp: { 111: 'write', 222: 'manage', groupX: 'manage'}
        var user = aggregatedData.user;
        var access = {
            canRead: false,
            canWrite: false,
            canManage: false
          };
        _.forEach(acls, function (acl, id) {
          if (id === user.id || user.groups.indexOf(id) >= 0) {
            access.canRead = access.canRead || acl === 'read' || acl === 'write' || acl === 'manage';
            access.canWrite = access.canWrite || acl === 'write' || acl === 'manage';
            access.canManage = access.canManage || acl === 'manage';
          }
        });
        deferred.resolve(access);
      }, deferred.reject);
      return deferred.promise;
    };
    return hbpEntityStore;
  }
]);
// the API retrieve object using underscore names, authorize.
/*jshint camelcase:false*/
/**
 * The `hbpFileStore` service deal with file entity type.
 *
 * @module hbpFileStore
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 */
angular.module('hbpDocumentClient').provider('hbpFileStore', function () {
  'use strict';
  return {
    $get: [
      '$http',
      '$q',
      '$log',
      'bbpConfig',
      function ($http, $q, $log, bbpConfig) {
        var maxFileSize = bbpConfig.get('hbpFileStore.maxFileUploadSize', 10 * 1024 * 1024);
        var hbpFileStore = {};
        var baseUrl = bbpConfig.get('api.document.v0');
        var error = function (cause, options) {
          options = options || {};
          var name = 'UploadError';
          var err = new Error(name + ': ' + cause + ' ' + options.message);
          err.cause = cause;
          err.statusText = options.message;
          err.name = name;
          err.file = options.file;
          err.entity = options.entity;
          return err;
        };
        var abortError = function () {
          return error('Aborted');
        };
        var entityUrl = function (entity) {
          return baseUrl + '/' + entity._entityType.split(':')[0] + '/' + entity._uuid;
        };
        var createEntity = function (type, options, config) {
          var d = $q.defer();
          $http.post(baseUrl + '/' + type.split(':')[0], options, config).success(function (entity) {
            d.resolve(entity);
          }).error(function (serviceError, status) {
            var err;
            options = { message: serviceError && serviceError.reason };
            if (status === 0) {
              err = abortError();
            } else if (serviceError.reason.match(/already exists/)) {
              err = error('FileAlreadyExistError', options);
            } else {
              err = error('EntityCreationError', options);
            }
            d.reject(err);
          });
          return d.promise;
        };
        var deleteEntity = function (entity) {
          return $http.delete(entityUrl(entity));
        };
        var uploadFile = function (file, entity, config) {
          var d = $q.defer();
          $http.post(entityUrl(entity) + '/content/upload', file, angular.extend({ headers: { 'Content-Type': 'application/octet-stream' } }, config)).success(function (entity) {
            d.notify({
              lengthComputable: true,
              total: file.size,
              loaded: file.size
            });
            d.resolve(entity);
          }).error(function (err, status) {
            var uploadError = function () {
              if (status === 0) {
                return abortError();
              } else {
                return error('UploadError', {
                  message: err.reason,
                  file: file,
                  entity: entity
                });
              }
            };
            deleteEntity(entity).then(function () {
              d.reject(uploadError(err));
            }, function (deleteErr) {
              $log.error('Unable to remove previously created entity', deleteErr);
              d.reject(uploadError(err));
            });
          });
          return d.promise;
        };
        /**
         * Create file entity and upload the content of the given file.
         *
         * `options` should contain a `parent` key containing the parent entity.
         *
         * Possible error causes:
         *
         * - FileTooBig
         * - UploadError - generic error for content upload requests
         * - EntityCreationError - generic error for entity creation requests
         * - FileAlreadyExistError
         *
         * @function
         * @memberof module:hbpFileStore
         * @param {File} file The file descriptor to upload
         * @param {Object} options The list of options
         * @return {Promise} a Promise that notify about progress and resolve
         *   with the new entity object.
         */
        hbpFileStore.upload = function (file, options) {
          options = options || {};
          var d = $q.defer();
          var dAbort = $q.defer();
          d.promise.abort = function () {
            dAbort.resolve();
          };
          if (file.size > maxFileSize) {
            d.reject(error('FileTooBig', { message: 'The file `' + file.name + '` is too big(' + file.size + ' bytes), max file size is ' + maxFileSize + ' bytes.' }));
            return d.promise;
          }
          var entityOpts = {
              _parent: options.parent && options.parent._uuid,
              _name: file.name,
              _contentType: file.type
            };
          createEntity('file', entityOpts).then(function (entity) {
            d.notify({
              lengthComputable: true,
              total: file.size,
              loaded: 0
            });
            uploadFile(file, entity, {
              timeout: dAbort.promise,
              uploadProgress: function (event) {
                d.notify(event);
              }
            }).then(function (entity) {
              d.promise.abort = function () {
                deleteEntity(entity);
                dAbort.resolve();
              };
              d.resolve(entity);
            }, d.reject, d.notify);
          }, d.reject);
          return d.promise;
        };
        /**
         * Ask for a short-lived presigned URL to be generated to download a file
         *
         * @function
         * @memberof module:hbpFileStore
         */
        hbpFileStore.requestSignedUrl = function (id) {
          return $http.get(baseUrl + '/' + 'file/' + id + '/content/secure_link').then(function (response) {
            return response.data;
          });
        };
        /**
         * Retrieves the content of a file given its id.
         *
         * @function
         * @memberof module:hbpFileStor
         */
        hbpFileStore.getContent = function (id) {
          return $http({
            method: 'GET',
            url: baseUrl + '/' + 'file/' + id + '/content',
            transformResponse: function (data) {
              return data;
            }
          }).then(function (data) {
            return data.data;
          });
        };
        /**
         * Retrieve the max upload file size in bytes.
         *
         * @function
         * @memberof module:hbpFileStore
         */
        hbpFileStore.maxFileSize = function () {
          return maxFileSize;
        };
        return hbpFileStore;
      }
    ]
  };
});
/**
 * The `hbpProjectStore` service deal with file entity type.
 *
 * @module hbpProjectStore
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 */
angular.module('hbpDocumentClient').service('hbpProjectStore', [
  '$http',
  '$q',
  'bbpConfig',
  'hbpUserDirectory',
  'hbpDocumentClientResolveUserIds',
  function ($http, $q, bbpConfig, hbpUserDirectory, hbpDocumentClientResolveUserIds) {
    'use strict';
    var baseUrl = bbpConfig.get('api.document.v0');
    var hbpProjectStore = {};
    /**
     * Retrieve all the user's projects. The returned promise will be resolved
     * with the list of fetched project and a flag indicating if more results
     * are available in the queried direction.
     *
     * Available options:
     * - sort: property to sort on,
     * - resolveUserId (=false): if true, resolve user ids to user names
     * - until: fetch results until the given id (exclusive with from)
     * - from: fetch results from the given id (exclusive with until)
     *
     * @function
     * @memberof module:hbpProjectStore
     */
    hbpProjectStore.getAll = function (options) {
      var d = $q.defer();
      options = angular.extend({}, options);
      $http.get(baseUrl + '/project', {
        params: {
          sort: options.sort ? options.sort : '_name',
          from: options.from,
          until: options.until
        }
      }).then(function (res) {
        var projects = res.data.result;
        if (options.resolveUserId) {
          hbpDocumentClientResolveUserIds(projects);
        }
        d.resolve(res.data);
      }, d.reject, d.notify);
      return d.promise;
    };
    return hbpProjectStore;
  }
]);
angular.module('hbpDocumentClient').factory('hbpDocumentClientResolveUserIds', [
  'hbpUserDirectory',
  function (hbpUserDirectory) {
    'use strict';
    return function (entites) {
      // Get the list of user's ids and try to find thier name
      var userIds = _.map(entites, '_createdBy');
      hbpUserDirectory.get(userIds).then(function (users) {
        for (var i = 0; i < entites.length; i++) {
          var user = users[entites[i]._createdBy];
          if (user) {
            entites[i]._createdByName = user.displayName;
          } else {
            // If no name was found for user we use it's id
            entites[i]._createdByName = entites[i]._createdBy;
          }
        }
      });
    };
  }
]);