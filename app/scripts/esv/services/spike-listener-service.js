/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/
(function ()
{
  'use strict';


  angular.module('spikeListenerModule', ['roslibModule', 'bbpConfig', 'simulationInfoService'])
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
            listeners[i](message);
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
