/**
 * Home of bbpStubFactory service.
 */
angular
  .module('bbpStubFactory', [])
  /**
 * Provides stub factories for common objects.
 */
  .factory('bbpStubFactory', function($q) {
    'use strict';
    return {
      /**
       * Provide a promise object that resolve successfuly by default.
       *
       * If resolve and reject option keys are true,
       * it will call both callback.
       *
       * Please notes that the callback function are called immediately
       * so the code under test is not behaving exactly the same because
       * it is note asynchronous.
       *
       * options:
       * - resolve: whether to call the success callback,
       * - reject: whether to call the error callback
       */
      promise: function(options) {
        options = angular.extend(
          {
            reject: false,
            resolve: true,
            args: []
          },
          options
        );
        var p = {};
        var callIt = function(cb) {
          if (cb) {
            cb.apply(p, options.args);
          }
          return p;
        };
        var passIt = function() {
          return p;
        };
        p.success = options.resolve ? callIt : passIt;
        p.error = options.reject ? callIt : passIt;
        p.then = function(success, error, complete) {
          return $q.when(
            options.resolve && success && success.apply(p, options.args),
            options.reject && error && error.apply(p, options.args),
            complete && complete.apply(p, options.args)
          );
        };
        p.finally = callIt;
        return p;
      }
    };
  });
