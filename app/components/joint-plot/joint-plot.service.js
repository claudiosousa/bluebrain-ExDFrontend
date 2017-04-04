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
    // number of points per seconds
    static get POINT_FREQUENCY() { return 2; }

    constructor(roslib, simulationInfo, bbpConfig) {
      this.roslib = roslib;
      this.server = simulationInfo.serverConfig.rosbridge.websocket;
      this.jointTopic = bbpConfig.get('ros-topics').joint;
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
      let topicSubCb = jointTopicSubscriber.subscribe(callback, true);

      return () => jointTopicSubscriber.unsubscribe(topicSubCb);
    }
  }

  angular.module('jointPlotModule')
    .factory('jointService', ['roslib', 'simulationInfo', 'bbpConfig', (...args) => new JointPlotService(...args)]);

}());
