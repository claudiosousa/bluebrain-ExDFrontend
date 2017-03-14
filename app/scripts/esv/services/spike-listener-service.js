(function ()
{
  'use strict';


  angular.module('exdFrontendApp')
    .service('spikeListenerService', ['$log', 'roslib', 'simulationInfo', 'bbpConfig',
      function ($log, roslib, simulationInfo, bbpConfig)
      {
        var listeners = [];
        var spikeTopicSubscriber;

        var server = simulationInfo.serverConfig.rosbridge.websocket;
        if (angular.isUndefined(server) || server.length === 0)
        {
          $log.error('The server URL was not specified!');
        }

        var spikeTopic = bbpConfig.get('ros-topics').spikes;
        if (angular.isUndefined(spikeTopic) || spikeTopic.length === 0)
        {
          $log.error('The topic for the spikes was not specified!');
        }

        var registerListener = function (listener)
        {
          unregisterListener(listener);
          listeners.push(listener);
        };

        var unregisterListener = function (listener)
        {
          $.each(listeners, function (i)
          {
            if (listeners[i] === listener)
            {
              listeners.splice(i, 1);
              return false;
            }
          });
        };

        // Called each time a spike message is received
        var onNewSpikesMessageReceived = function (message)
        {
          $.each(listeners, function (i)
          {
            listeners[i].onNewSpikesMessageReceived(message);
          });
        };

        var startListening = function (listener)
        {
          var alreadyRegistered = false;

          $.each(listeners, function (i)
          {
            if (listeners[i] === listener)
            {
              alreadyRegistered = true;
              return;
            }
          });

          if (alreadyRegistered)
          {
            return;
          }

          registerListener(listener);
          if (listeners.length===1)
          {
            var rosConnection = roslib.getOrCreateConnectionTo(server);
            spikeTopicSubscriber = spikeTopicSubscriber || roslib.createTopic(rosConnection, spikeTopic, 'cle_ros_msgs/SpikeEvent');
            spikeTopicSubscriber.subscribe(onNewSpikesMessageReceived);
          }
        };

        var stopListening = function (listener)
        {
          unregisterListener(listener);
          if (listeners.length===0)
          {

            if (spikeTopicSubscriber)
            {
              // One has to be careful here: it is not sufficient to only call unsubscribe but you have to
              // put in the function as an argument, otherwise your function will be called twice!
              spikeTopicSubscriber.unsubscribe(onNewSpikesMessageReceived);
            }
          }
        };

        return {
          startListening: startListening,
          stopListening: stopListening
        };
      }]
    );
} ());
