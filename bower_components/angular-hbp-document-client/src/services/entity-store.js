/**
 * @namespace hbpEntityStore
 * @desc
 * The `hbpEntityStore` service retrieve any kind of entity.
 *
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 * @memberof hbpDocumentClient.core
 */
angular.module('hbpDocumentClient.core')
.service('hbpEntityStore', function($http, $q, bbpConfig, hbpUtil, hbpIdentityUserDirectory, hbpDocumentClientResolveUserIds, hbpErrorService) {
    'use strict';
    var baseUrl = bbpConfig.get('api.document.v0');
    var hbpEntityStore = {};
    var promises = {};

    // Ensure there is only one async `fn` run named `k` at once.
    // subsequent call to runOnce with the same `k` value will
    // return the promise of the running async function.
    var runOnce = function(k, fn) {
      if (!promises[k]) {
        promises[k] = fn().finally(function() {
          promises[k] = null;
        });
      }
      return promises[k];
    };

    /**
     * Get an entity from its id
     *
     * @function
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.get = function (id) {
      var url = baseUrl + '/entity/' + id;
      var k = 'GET ' + url;
      return runOnce(k, function() {
        return $http.get(url).then(function(data) {
          return data.data;
        });
      });
    };

    /**
     * Query entities by attributes or metadata.
     *
     * @function
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.query = function(params) {
      return $http.get(baseUrl + '/entity/', {
        params: params
      }).then(function(response) {
        return response.data;
      });
    };

    /**
     * Return true if the entity should be considered as a container.
     *
     * @function
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.isContainer = function(entity) {
      return (/.*(folder|release|project)$/).test(entity._entityType);
    };

    /**
     * Retrieve an array of entities from root to the current entity (where `root` and `entity` are omitted).
     * @function
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.getAncestors = function (entity, root) {
      // End recursion condition
      if (!entity || !entity._parent || (root && entity._parent === root._uuid)) {
        return $q.when([]);
      }

      var onError = function(err) {
        $q.reject(hbpErrorService.error({
          type: 'EntityAncestorRetrievalError',
          message: 'Cannot retrieve some ancestors from entity ' + entity._name,
          data: {
            entity: entity,
            root: root,
            cause: err
          }
        }));
      };

      var recurse = function(parent) {
        return hbpEntityStore.getAncestors(parent, root)
        .then(function(ancestors) {
          ancestors.push(parent);
          return ancestors;
        });
      };

      return hbpEntityStore.get(entity._parent)
        .then(recurse, onError);
    };

    /**
     * Retrieve the complete path of the provided entity
     *
     * @function
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.getPath = function (entity) {
      var deferred = $q.defer();
      var path = entity._name;
      var onError = function() {
        deferred.reject('Cannot retrieve entity path');
      };
      if (!entity._parent) {
        deferred.resolve('/'+path);
      } else {
        hbpEntityStore.get(entity._parent).then(function(parent) {
          hbpEntityStore.getPath(parent)
          .then(function(parPath) {
            path = parPath + '/' + path;
            deferred.resolve(path);
          }, onError);
        }, onError);
      }
      return deferred.promise;
    };

    var buildEntityTypeFilter = function(accept, acceptLink) {
      if (acceptLink) {
        accept = accept.concat(_.map(
          (acceptLink === true)? accept : acceptLink,
          function(type) {
            return 'link:'+type;
          })
        );
      }
      if (accept && accept.length > 0) {
        return '_entityType='+accept.join('+');
      } else {
        return;
      }
    };

    /**
     * @desc
     * Retrieve children entities of a 'parent' entity according to the options and
     * add them to the children list.
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
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.getChildren = function(parent, options) {
      var d = $q.defer();
      options = angular.extend({}, options);

      $http.get(baseUrl+'/'+parent._entityType + '/' + parent._uuid + '/children', {
        params: {
          filter: buildEntityTypeFilter(options.accept, options.acceptLink),
          sort: (options.sort)? options.sort : '_name',
          from: options.from,
          until: options.until
        }
      }).then(function(res){
        var children = res.data.result;

        if (options.resolveUserId) {
          hbpDocumentClientResolveUserIds(children);
        }
        d.resolve(res.data);
      }, d.reject, d.notify);
      return d.promise;
    };

    /**
     * @desc
     * Get current user access right to the provided entity.
     *
     * The returned promise will be resolved
     * with an object literal containing three boolean
     * flags corresponding the user access:
     *
     * - canRead
     * - canWrite
     * - canManage
     *
     * @function
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.getUserAccess = function(entity) {
      var deferred = $q.defer();

      $q.all( {
        'acl': $http.get(baseUrl+'/'+entity._entityType + '/' + entity._uuid + '/acl'),
        'user': hbpIdentityUserDirectory.getCurrentUser()
      })
      .then( function(aggregatedData) {
        var acls = aggregatedData.acl.data; // expected resp: { 111: 'write', 222: 'manage', groupX: 'manage'}
        var user = aggregatedData.user;

        var access = {
          canRead: false,
          canWrite: false,
          canManage: false
        };

        _.forEach(acls, function(acl, id) {
          if(id === user.id || user.groups.indexOf(id) >= 0) {
            access.canRead = access.canRead || acl === 'read' || acl === 'write' || acl === 'manage';
            access.canWrite = access.canWrite || acl === 'write' || acl === 'manage';
            access.canManage = access.canManage || acl === 'manage';
          }
        });

        deferred.resolve(access);
      }, deferred.reject);

      return deferred.promise;
    };

    /**
     * Add metadata to the provided entity and returns a promise that resolves to an object
     * containing all the new metadata. The promise fails if one of the metadata already exists.
     *
     * @function
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.addMetadata = function(entity, metadata) {
      return $http.post(baseUrl + '/' + entity._entityType + '/' + entity._uuid + '/metadata', metadata)
        .then(function(response) {
          return response.data;
        });
    };

    /**
     * Delete metadata keys in input from the provided entity and returns a promise that resolves to an object
     * containing all the remaining metadata. The promise fails if one of the metadata doesn't exist.
     *
     * @function
     * @memberof hbpDocumentClient.core.hbpEntityStore
     */
    hbpEntityStore.deleteMetadata = function(entity, metadataKeys) {
      return $http.delete(baseUrl + '/' + entity._entityType + '/' + entity._uuid + '/metadata', { data: { keys: metadataKeys }})
        .then(function(response) {
          return response.data;
        });
    };

    hbpEntityStore.create = function(type, parent, name, options) {
      return $http.post(
        baseUrl+'/'+type.split(':')[0],
        angular.extend({
          _name: name,
          _parent: parent &&  parent._uuid || parent
        }, options)
      )
      .then(function(res) {
        return res.data;
      })
      .catch(function(err) {
        if (err.code === 0) {
          err = hbpErrorService.error({
            type: 'Aborted',
            message: 'Network unreachable',
            code: 0
          });
        } else {
          err = hbpErrorService.httpError(err);
        }
        if (err.message.match(/already exists/)) {
          err.type = 'FileAlreadyExistError';
        } else {
          err.type = 'EntityCreationError';
        }
        err.cause = err.type; // preserve legacy API
        return $q.reject(err);
      });
    };

    hbpEntityStore.copy = function(srcId, destFolderId) {
      return hbpEntityStore.get(srcId).then(function(src) {
        return hbpEntityStore.create(src._entityType, destFolderId, src._name, {
          _description: src._description,
          _contentType: src._contentType
        })
        .then(function(dest) {
          var url = hbpUtil.format('{0}/{1}/{2}/content', [baseUrl, dest._entityType, dest._uuid]);
          return $http.put(url, {}, {
            headers: {'X-Copy-From': src._uuid}
          }).then(function() {
            return dest;
          }).catch(function(err) {
            $q.reject(hbpErrorService.httpError(err));
          });
        });
      });
    };

    return hbpEntityStore;
  }
);
