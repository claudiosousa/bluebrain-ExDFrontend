(function() {
  'use strict';

  /**
   * @ngdoc service
   * @namespace exdFrontendApp.services
   * @module jointPlotModule
   * @name jointPlotModule.jointService
   * @description Service that subscribes to the joint ros-topic
   */
  class JointPlotService {
    // number of points per second
    static get POINT_FREQUENCY() { return 2; }

    constructor(roslib, simulationInfo, bbpConfig) {
      this.roslib = roslib;
      this.server = simulationInfo.serverConfig.rosbridge.websocket;
      this.jointTopic = bbpConfig.get('ros-topics').joint;
      this.lastMessageTime = Number.MIN_VALUE;

      this.rosConnection = this.roslib.getOrCreateConnectionTo(this.server);
      this.jointTopicSubscriber = this.roslib.createTopic(
        this.rosConnection,
        this.jointTopic,
        'sensor_msgs/JointState',
        { throttle_rate: 1.0 / JointPlotService.POINT_FREQUENCY * 1000.0 }
      );
      this.callbacks = [];
    }

    close() {
      if (angular.isDefined(this.topicCallback)) {
        this.jointTopicSubscriber.unsubscribe(this.topicCallback);
      }
    }

    /**
     * Parse messages
     * @instance
     * @method parseMessages
     * @param {} received messages
     */
    parseMessages(message) {
      if (this.callbacks.length === 0) return;

      //10% tolerance timewise
      const tolerance = 1.1;

      let currentTime = message.header.stamp.secs + message.header.stamp.nsecs * 0.000000001;

      if (Math.abs(currentTime - this.lastMessageTime) * tolerance >= (1 / JointPlotService.POINT_FREQUENCY)) {
        this.lastMessageTime = currentTime;
        for (let i = 0; i < this.callbacks.length; i = i+1) {
          this.callbacks[i](message);
        }
      }
    }

    /**
     * Subscribes to the joint ros-topic
     * @instance
     * @method subscribe
     * @param {} callback The callback to be called when joint topic messages are received
     */
    subscribe(callback) {
      this.callbacks.push(callback);
      if (this.callbacks.length === 1) {
        // we went from zero subscribers to one
        this.topicCallback = (msg) => this.parseMessages(msg);
        this.jointTopicSubscriber.subscribe(this.topicCallback);
      }
    }

    /**
     * Unsubscribes to the joint ros-topic
     * @instance
     * @method unsubscribe
     * @param {} callback The callback to be removed from the list of callbacks
     */
    unsubscribe(callback) {
      let index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);

        // in case we have zero callbacks now, unsubscribe
        if (this.callbacks.length === 0) {
          this.jointTopicSubscriber.unsubscribe(this.topicCallback);
        }
      }
    }
  }

  angular.module('jointPlotModule')
    .factory('jointService', ['roslib', 'simulationInfo', 'bbpConfig', (...args) => new JointPlotService(...args)]);

}());
