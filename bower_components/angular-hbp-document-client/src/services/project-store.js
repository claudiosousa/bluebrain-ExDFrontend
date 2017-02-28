/**
 * @namespace hbpProjectStore
 * @desc
 * The `hbpProjectStore` service deal with file entity type.
 *
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 * @memberof hbpDocumentClient.core
 */
angular.module('hbpDocumentClient.core')
.service('hbpProjectStore', function($http, $q, bbpConfig, hbpDocumentClientResolveUserIds) {
  'use strict';
  var baseUrl = bbpConfig.get('api.document.v0');
  var hbpProjectStore = {};

  function getAll(options, acc) {
    var retVal = acc || [];
    return $http.get(baseUrl + '/project', {
      params: {
        sort: (options.sort)? options.sort : '_name',
        from: options.from,
        until: options.until,
        filter: options.filter,
        access: options.access,
        limit: options.pageSize > 0 ? options.pageSize : null,
        hpc: options.hpc
      }
    }).then(function(res) {
      retVal.push.apply(retVal, res.data.result);
      if(options.pageSize === 0 && res.data.hasMore) {
        var lastId = _.last(retVal)._uuid;
        var newOptions = angular.extend({}, options, { from: lastId });
        // remove the last element to avoid duplicate
        retVal.pop();

        return getAll(newOptions, retVal);
      } else {
        return {
          result: retVal,
          hasMore: res.data.hasMore
        };
      }
    });
  }

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
   * - access: filter the result bases on acls. Values: 'read' (default), 'write'
   * - pageSize: number of results per page. Default is provided by the service.
   *             Set to '0' to fetch all records.
   *
   * @function
   * @memberof hbpDocumentClient.core.hbpDocumentClient
   */
  hbpProjectStore.getAll = function(options) {
    var d = $q.defer();
    options = angular.extend({}, options);

    getAll(options).then(function(res) {
      var projects = res.result;

      if (options.resolveUserId) {
        hbpDocumentClientResolveUserIds(projects);
      }
      d.resolve(res);
    }, d.reject, d.notify);
    return d.promise;
  };

  return hbpProjectStore;
});
