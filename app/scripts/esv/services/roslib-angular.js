/* global console: false */

// we are using the module pattern here, also see
// http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
(function () {
  'use strict';

  // We don't want to have ROSLIB on the global scope (ie. window), but we want to rely on dependency injection.
  // This allows our components to be intuitive, predictable, and testable. Hence we "wrap" this library here.
  // http://www.bennadel.com/blog/2720-creating-and-extending-a-lodash-underscore-service-in-angularjs.htm
  var app = angular.module('exdFrontendApp');
  app.factory('roslib', ['$window','bbpConfig', '$rootScope', function ($window, bbpConfig, $rootScope) {

    // Get a local handle on the global ROSLIB reference
    var ROSLIB = $window.ROSLIB;

    // Delete the global reference to make sure
    // that no one on the team gets lazy and tried to reference the library
    // without injecting it. It's an easy mistake to make, and one that won't
    // throw an error (since the core library is globally accessible).
    // delete($window.ROSLIB); // Unfortunately we cannot delete it, since gz3d.js is relying on it :(

    // custom ROSLIB methods
    ROSLIB.getOrCreateConnectionTo = function (url) {

      if (!bbpConfig.get('localmode.forceuser', false)) {
        var token = [];
        var clientID = bbpConfig.get('auth.clientId', '');
        var localStorageTokenKey = 'tokens-' + clientID + '@https://services.humanbrainproject.eu/oidc';
        if (localStorage.getItem(localStorageTokenKey)) {
          try {
            token = JSON.parse(localStorage.getItem(localStorageTokenKey));
          } catch(e) {
            // this token will be rejected by the server and the client will get a proper auth error
            token[0] = { access_token : 'malformed-token' };
          }
        } else {
          // this token will be rejected by the server and the client will get a proper auth error
          token[0] = { access_token : 'no-token' };
        }
        url = url + '/?token=' + token[0].access_token;
      }

      return new ROSLIB.PhoenixRos({ url: url });
    };

    ROSLIB.createTopic = function (connection, topicName, messageType, additionalOptions) {
      return new ROSLIB.Topic(_.extend({
        ros: connection,
        name: topicName,
        messageType: messageType
      }, additionalOptions));
    };

    ROSLIB.createStringTopic = function (connection, topicName) {
      return new ROSLIB.Topic({
        ros: connection,
        name: topicName,
        messageType: 'std_msgs/String'
      });
    };

    // overwrite subscribe function of topics to add the parameter makeAngularAware
    // when makeAngularAware is true, the callback is called within a $rootScope.$apply()
    // optimally all ros callbacks should be wrapped in a $rootScope.$apply()
    // but some topics publish at too high frequency which degrades performances a lot (eg, spikes)
    ROSLIB.Topic.prototype.subscribe = (function(originalSub) {
      return function(callback, makeAngularAware) {
        var that = this;
        var finalCb = callback;
        if (makeAngularAware) {
          finalCb = function(message) {
            $rootScope.$apply(function() {
              callback(message);
            });
          };
        }
        originalSub.call(that, finalCb);
        return finalCb;
      };
    }(ROSLIB.Topic.prototype.subscribe));

    // Return the (formerly global) reference so that it can be injected
    // into other aspects of the AngularJS application.
    return (ROSLIB);

  }]);

}());
