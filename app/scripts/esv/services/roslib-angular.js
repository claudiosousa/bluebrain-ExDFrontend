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

    var connections = {};

    // custom ROSLIB methods
    ROSLIB.getOrCreateConnectionTo = function (url) {

      var ros;
      if (!bbpConfig.get('localmode.forceuser', false)) {
        var token = [];
        if (localStorage.getItem('tokens-neurorobotics-ui@https://services.humanbrainproject.eu/oidc')) {
          try {
            token = JSON.parse(localStorage.getItem('tokens-neurorobotics-ui@https://services.humanbrainproject.eu/oidc'));
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
      if (! connections[url]) {
        ros = new ROSLIB.Ros({
          url: url
        });
        connections[url] = ros;
      } else {
        ros = connections[url];
        console.log('Reusing already established connection to ' + url);
      }

      ros.on('connection', function () {
        console.log('Connected to websocket server: ' + url);
      });

      ros.on('error', function (error) {
        console.error('Error connecting to websocket server (' + url + '):', error);
      });

      ros.on('close', function () {
        delete connections[url];
        console.log('Connection closed to websocket server: ' + url);
      });

      return ros;
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

    ROSLIB.Topic.prototype.subscribe = (function(originalSub) {
      return function(callback) {
        var that = this;
        var angularAwareCb = function(message) {
          $rootScope.$apply(function() {
            callback(message);
          });
        };
        originalSub.call(that, angularAwareCb);
      };
    }(ROSLIB.Topic.prototype.subscribe));

    // Return the (formerly global) reference so that it can be injected
    // into other aspects of the AngularJS application.
    return (ROSLIB);

  }]);

}());
