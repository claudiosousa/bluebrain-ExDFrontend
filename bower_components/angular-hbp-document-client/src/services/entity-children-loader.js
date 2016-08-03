(function() {
  'use strict';

  /**
   * @private
   * @desc
   * This factory is currently private as it needs to evolve to a more generic
   * beast.
   */
  angular.module('hbpDocumentClient.ui')
  .factory('hbpLoadEntityChildren', function($q, hbpEntityStore, hbpErrorService) {
    return function(parent, options) {
      return new EntityChildrenLoader($q, hbpEntityStore, hbpErrorService, parent, options);
    };
  });

  //////////

  function EntityChildrenLoader($q, store, errorService, parent, options) {
    var self = this;

    self.entities = [];
    self.state = null;
    self.error = null;
    self.hasNext = false;
    self.hasPrevious = false;

    self.next = next;
    self.previous = previous;

    self.promise = init();

    /////

    var filteredOptions;

    var mergeStrategies = {
      replace: function(resultSet) {
        self.hasPrevious = !!resultSet.hasPrevious;
        self.hasNext = !!resultSet.hasMore;
        self.entities.push.apply(self.entities, resultSet.result);
      },
      append: function(resultSet) {
        self.hasNext = !!resultSet.hasMore;
        resultSet.result.shift(); // remove the first result which is the
                                  // last one from the current list
        self.entities.push.apply(self.entities, resultSet.result);
      },
      prepend: function(resultSet) {
        self.hasPrevious = !!resultSet.hasPrevious;
        resultSet.result.pop(); // remove the last result which is the first
                                // from the current list
        self.entities.unshift.apply(self.entities, resultSet.result);
      }
    };

    function init() {
      filteredOptions = _.pick(options, function(v, k) {
        return ['from', 'until'].indexOf(k) === -1;
      });
      self.state = 'loading';
      return store.getChildren(parent, options)
      .then(function(resultSet) {
        mergeStrategies.replace(resultSet);
        self.state = 'ready';
      })
      .catch(errorHandler);
    }

    function next() {
      return self.promise = self.promise.then(function() {
        self.state = 'loading';
        return store.getChildren(
          parent,
          angular.extend({from: self.entities[self.entities.length-1]._uuid}, filteredOptions)
        )
        .then(function(resultSet) {
          mergeStrategies.append(resultSet);
          self.state = 'ready';
        });
      })
      .catch(errorHandler);
    }

    function previous() {
      return self.promise = self.promise.then(function() {
        self.state = 'loading';
        return store.getChildren(
          parent,
          angular.extend({until: self.entities[0]._uuid}, filteredOptions)
        )
        .then(function(resultSet) {
          mergeStrategies.prepend(resultSet);
          self.state = 'ready';
        });
      })
      .catch(errorHandler);
    }

    function errorHandler(err) {
      self.error = err;
      self.state = 'error';
      $q.reject(err);
    }
  }
}());
