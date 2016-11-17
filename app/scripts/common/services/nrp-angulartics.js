(function() {
  'use strict';
  /* global console: false */
  /* global moment: false */
  var module = angular.module('nrpAngulartics', [
    'hbpCommon',
    'nrpUser',
    'angulartics',
    'angulartics.google.analytics']);

  module.factory('nrpAnalytics', [
    '$analytics',
    'nrpUser',
    function($analytics, nrpUser) {
      var durationClocks = {};

      function eventTrack (actionName, options) {
        if (_.isObject(options) && _.isBoolean(options.value)) {
          options.value = _.toInteger(options.value);
        }
        return nrpUser.getCurrentUser().then(function(user) {
          var extendedOptions = _.extend(options, {
            label: user.displayName
          });
          $analytics.eventTrack(actionName, extendedOptions);
        });
      }

      function tickDurationEvent (actionName) {
        durationClocks[actionName] = moment();
      }
      function durationEventTrack (actionName, options) {
        if (_.isUndefined(durationClocks[actionName])) {
          console.log('Analytics duration: missing tick for action: '+ actionName);
          return;
        }
        var duration = moment() - durationClocks[actionName];
        var extendedOptions = _.extend(options, {
          value: duration / 1000
        });
        eventTrack(actionName, extendedOptions);
        delete durationClocks[actionName];
      }

      return {
        eventTrack: eventTrack,
        tickDurationEvent: tickDurationEvent,
        durationEventTrack: durationEventTrack
      };
    }]);
}());
