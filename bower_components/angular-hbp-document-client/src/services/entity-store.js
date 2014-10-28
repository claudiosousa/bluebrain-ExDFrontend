/**
 * The `hbpEntityStore` service retrieve any kind of entity.
 *
 * @module hbpEntityStore
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 */
angular.module('hbpDocumentClient')
.service('hbpEntityStore', ['$http', '$q', 'bbpConfig', 'hbpUserDirectory', 'hbpDocumentClientResolveUserIds',
  function($http, $q, bbpConfig, hbpUserDirectory, hbpDocumentClientResolveUserIds) {
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
      return $http.get(baseUrl + '/entity/' + id).then(function(data) {
        return data.data;
      });
    };

    /**
     * Return true if the entity should be considered as a container.
     *
     * @function
     * @memberof module:hbpEntityStore
     */
    hbpEntityStore.isContainer = function(entity) {
      return (/.*(folder|release|project)$/).test(entity._entityType);
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
    hbpEntityStore.getUserAccess = function(entity) {
      var deferred = $q.defer();

      $q.all( {
        'acl': $http.get(baseUrl+'/'+entity._entityType + '/' + entity._uuid + '/acl'),
        'user': hbpUserDirectory.getCurrentUser()
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

    return hbpEntityStore;
  }
]);
