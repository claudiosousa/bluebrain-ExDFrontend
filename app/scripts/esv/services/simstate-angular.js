/*
  This module is thought to centralize the manipulation of the simulation state.
  It provides two functions for getting and setting the simulation state via REST,
  as well as a variable saving the current state that can be accessed when there
  is no necessity to explicitly fetching the state.

  getCurrentState and setCurrentState are implemented so they can be used with
  the AngularJS .then() and .catch() functions.
*/

(function () {
  'use strict';

  /* global console: false */

  var module = angular.module('simulationStateServices',
    ['bbpConfig', 'simulationInfoService',
     'nrpErrorHandlers'
    ]);
  module.factory('stateService',
    ['simulationState', 'STATE',
    '$log', 'bbpConfig', '$q', 'serverError', 'roslib',
    'simulationInfo',
    function (simulationState, STATE,
      $log, bbpConfig, $q, serverError, roslib,
      simulationInfo) {
      // Initialized the state to "paused" so that a view that loads before the
      // first message update from our websocket can properly render the buttons
      var thisStateService = {currentState: STATE.PAUSED};
      var stateCallbacks = [];
      var messageCallbacks = [];
      thisStateService.statePending = false;
      var rosConnection, statusListener;

      var triggerStateCallbacks = function() {
        angular.forEach(stateCallbacks, function(callback) {
          if (angular.isDefined(callback)) {
            callback(thisStateService.currentState);
          }
        });
      };

      var triggerMessageCallbacks = function(message) {
        angular.forEach(messageCallbacks, function(callback) {
          if (angular.isDefined(callback)) {
            callback(message);
          }
        });
      };

      var onMessageReceived = function (data) {
        try {
          var message = JSON.parse(data.data);
          /* State messages */
          /* Manage before other since others may depend on state changes */
          if (angular.isDefined(message.state) && (message.state !== thisStateService.currentState)) {

            if (message.state !== STATE.CREATED)
            {
              // This is a tempory fix. The problem should be fixed in the backend. See NRRPLT-4148 and NRRPLT-4172.

              thisStateService.currentState = message.state;
            }

            if (message.state === STATE.STOPPED){
            rosConnection.disableRebirth();
          }
            triggerStateCallbacks();
          }

          /* Call every registered message callback with the received message */
          triggerMessageCallbacks(message);
        } catch(err) {
          console.error("Invalid JSON Message received.");
        }
      };

      // This function loads the server specific configuration and sets the simulation specific values
      thisStateService.Initialize = function() {
        thisStateService.statePending = false;
      };

      thisStateService.startListeningForStatusInformation = function() {
        // prevent multiple registrations of onMessageReceived callback, do not call
        // unsubscribe here as it brings down the rosbridge connection
        if (angular.isDefined(statusListener)) {
          statusListener.removeAllListeners();
          statusListener = undefined;
        }

        var rosbridgeWebsocketUrl = simulationInfo.serverConfig.rosbridge.websocket;
        var statusTopic = bbpConfig.get('ros-topics').status;
        rosConnection = roslib.getOrCreateConnectionTo(rosbridgeWebsocketUrl);
        statusListener = roslib.createStringTopic(rosConnection, statusTopic);
        statusListener.subscribe(onMessageReceived, true);
      };

      thisStateService.stopListeningForStatusInformation = function() {
        // unregister to the statustopic
        if (angular.isDefined(statusListener)) {
          statusListener.unsubscribe(); // fully disconnects rosbridge
          statusListener.removeAllListeners();
          statusListener = undefined;
        }
        // Close the roslib connections
        if (angular.isDefined(rosConnection)) {
          rosConnection.close();
          rosConnection = undefined;
        }
      };

      thisStateService.addStateCallback = function(callback) {
        stateCallbacks.push(callback);
      };

      thisStateService.removeStateCallback = function(callback) {
        stateCallbacks = stateCallbacks.filter(function(element){
          return element !== callback;
        });
      };

      thisStateService.addMessageCallback = function(callback) {
        messageCallbacks.push(callback);
      };

      thisStateService.removeMessageCallback = function(callback) {
        messageCallbacks = messageCallbacks.filter(function(element){
          return element !== callback;
        });
      };

      thisStateService.getCurrentState = function () {
        var deferred = $q.defer();

        simulationState(simulationInfo.serverBaseUrl).state({sim_id: simulationInfo.simulationID},
          function (data) {
            thisStateService.currentState = data.state;
            deferred.resolve();
          },
          function (data) {
            deferred.reject();
          }
        );

        return deferred.promise;
      };

      thisStateService.setCurrentState = function (newState) {
        var deferred = $q.defer();

        // Ignore state change request if
        // (1) there are pending state changes
        // (2) the requested state is the current state
        if (thisStateService.statePending === true || newState === thisStateService.currentState) {
          deferred.reject();
          return deferred.promise; // avoid duplicated update requests
        }
        thisStateService.statePending = true;

        simulationState(simulationInfo.serverBaseUrl).update(
          {sim_id: simulationInfo.simulationID},
          {state: newState},
          function (data) {
            thisStateService.currentState = data.state;
            thisStateService.statePending = false;
            triggerStateCallbacks();
            deferred.resolve();
          },
          function (data) {
            thisStateService.statePending = false;
            serverError.displayHTTPError(data);
            deferred.reject();
          }
        );

        return deferred.promise;
      };

      thisStateService.ensureStateBeforeExecuting = function (state, toBeExecuted) {
        if (thisStateService.currentState === state) {
          toBeExecuted();
        }
        else {
          thisStateService.setCurrentState(state)
            .then(function () {
              toBeExecuted();
            });
        }
      };

      return thisStateService;
    }
  ]);
}());
