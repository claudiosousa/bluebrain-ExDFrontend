/* global console: false */

(function () {
  'use strict';

  var gz3dServices = angular.module('gz3dServices', []);

  // TODO(Luc): make sure connect is called when the websocket is itself connected
  gz3dServices.factory('gzCommunication', function () {
    return {
      topic: undefined,
      connect: function (topic, messageType) {
        this.topic = new ROSLIB.Topic({ // jshint ignore:line
          ros: iface.webSocket, // jshint ignore:line
          name: topic,
          messageType: messageType
        });
        return this;
      },
      subscribe: function (callback) {
        if (this.topic) {
          this.topic.subscribe(callback);
        }
      }
    };
  });

  gz3dServices.factory('simulationStatistics', [ 'gzCommunication', function (gzCommunication) {
    var simulationTimeCallback;
    var realTimeCallback;
    var pausedCallback;

    // we now create the callback function which we will register below
    var worldStatsUpdate = function (stats) {
      try {
        pausedCallback(stats.paused);
      } catch (err) {
        if (typeof(pausedCallback) !== 'function') {
          console.error('Tried to call an undefined callback function! Did you forget to set it?');
        }
        console.error(err.message);
      }


      var simSec = stats.sim_time.sec;
      var simNSec = stats.sim_time.nsec;

      var simDay = Math.floor(simSec / 86400);
      simSec -= simDay * 86400;

      var simHour = Math.floor(simSec / 3600);
      simSec -= simHour * 3600;

      var simMin = Math.floor(simSec / 60);
      simSec -= simMin * 60;

      var simMsec = Math.floor(simNSec * 1e-6);

      var realSec = stats.real_time.sec;
      var realNSec = stats.real_time.nsec;

      var realDay = Math.floor(realSec / 86400);
      realSec -= realDay * 86400;

      var realHour = Math.floor(realSec / 3600);
      realSec -= realHour * 3600;

      var realMin = Math.floor(realSec / 60);
      realSec -= realMin * 60;

      var realMsec = Math.floor(realNSec * 1e-6);

      var simTimeValue = '';
      var realTimeValue = '';

      if (realDay < 10) {
        realTimeValue += '0';
      }
      realTimeValue += realDay.toFixed(0) + ' ';
      if (realHour < 10) {
        realTimeValue += '0';
      }
      realTimeValue += realHour.toFixed(0) + ':';
      if (realMin < 10) {
        realTimeValue += '0';
      }
      realTimeValue += realMin.toFixed(0) + ':';
      if (realSec < 10) {
        realTimeValue += '0';
      }
      realTimeValue += realSec.toFixed(0);

      if (simDay < 10) {
        simTimeValue += '0';
      }
      simTimeValue += simDay.toFixed(0) + ' ';
      if (simHour < 10) {
        simTimeValue += '0';
      }
      simTimeValue += simHour.toFixed(0) + ':';
      if (simMin < 10) {
        simTimeValue += '0';
      }
      simTimeValue += simMin.toFixed(0) + ':';
      if (simSec < 10) {
        simTimeValue += '0';
      }
      simTimeValue += simSec.toFixed(0);

      try {
        realTimeCallback(realTimeValue);
        simulationTimeCallback(simTimeValue);
      } catch (err) {
        if (typeof(realTimeCallback) !== 'function' || typeof(simulationTimeCallback) !== 'function') {
          console.error('Tried to call an undefined callback function! Did you forget to set it?');
        }
        console.error(err.message);
      }
    };

    gzCommunication
      .connect('~/world_stats', 'worldstatistics')
      .subscribe(worldStatsUpdate);

    // now expose our public functions
    return {
      setSimulationTimeCallback: function (callback) {
        simulationTimeCallback = callback;
      },
      setRealTimeCallback: function (callback) {
        realTimeCallback = callback;
      },
      setPausedCallback: function (callback) {
        pausedCallback = callback;
      }
    };

  }]);
}());