/**
 * The `hbpProjectStore` service deal with file entity type.
 *
 * @module hbpProjectStore
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 */
angular.module('hbpDocumentClient')
.service('hbpProjectStore', ['$http', '$q', 'bbpConfig', 'hbpUserDirectory', 'hbpDocumentClientResolveUserIds',
  function($http, $q, bbpConfig, hbpUserDirectory, hbpDocumentClientResolveUserIds) {
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
    hbpProjectStore.getAll = function(options) {
      var d = $q.defer();
      options = angular.extend({}, options);

      $http.get(baseUrl + '/project', {
        params: {
          sort: (options.sort)? options.sort : '_name',
          from: options.from,
          until: options.until
        }
      }).then(function(res){
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
