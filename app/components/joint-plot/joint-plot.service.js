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
    }

    /**
     * Parse messages
     * @instance
     * @method parseMessages
     * @param {} received messages
     */
    parseMessages(message, callback) {
      //10% tolerance timewise
      const tolerance = 1.1;

      let currentTime = message.header.stamp.secs + message.header.stamp.nsecs * 0.000000001;

      if (Math.abs(currentTime - this.lastMessageTime) * tolerance >= (1 / JointPlotService.POINT_FREQUENCY)) {
        this.lastMessageTime = currentTime;
        callback(message);
      }
    }

    /**
     * Subscribes to the join ros-topic
     * @instance
     * @method subscribe
     * @param {} callback The callback to be called when joint topic messages are received
     * @return The unsusbribe methode for the subsription
     */
    subscribe(callback) {
      let rosConnection = this.roslib.getOrCreateConnectionTo(this.server);
      let jointTopicSubscriber = this.roslib.createTopic(rosConnection,
        this.jointTopic,
        'sensor_msgs/JointState',
        { throttle_rate: 1.0 / JointPlotService.POINT_FREQUENCY * 1000.0 });

      let topicSubCb = jointTopicSubscriber.subscribe((msg)=>this.parseMessages(msg, callback), true);

      return () => jointTopicSubscriber.unsubscribe(topicSubCb);
    }
  }

  angular.module('jointPlotModule')
    .factory('jointService', ['roslib', 'simulationInfo', 'bbpConfig', (...args) => new JointPlotService(...args)]);

}());
