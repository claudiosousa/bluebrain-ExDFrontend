(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('transferFunctionEditor', ['$log', function ($log) {
    return {
      templateUrl: 'views/esv/transfer-function-editor.html',
      restrict: 'E',
      link: function (scope, element, attrs) {
        if(!attrs.server) {
          $log.error('The server URL was not specified!');
        }

        if(!attrs.simulation) {
          $log.error('The simulationID was not specified!');
        }

        var serverBaseUrl = attrs.server;
        var simulationID = attrs.simulation;

        scope.transferFunctions = [];
        scope.transferFunctions = [' @nrp.MapSpikeSink("all_neurons", nrp.brain.circuit[slice(0, 8, 1)], nrp.spike_recorder)\n @nrp.Neuron2Robot(Topic(\'/monitor/spike_recorder\', cle_ros_msgs.msg.SpikeEvent))\n    def all_neurons_spike_monitor(t, all_neurons):\n        return monitoring.create_spike_recorder_message(t, 8, all_neurons.times, "all_neurons_spike_monitor")\n', ' @nrp.MapSpikeSink("left_wheel_neuron", nrp.brain.actors[1], nrp.population_rate)\n @nrp.Neuron2Robot(Topic(\'/monitor/population_rate\', cle_ros_msgs.msg.SpikeRate))\n    def left_wheel_neuron_rate_monitor(t, left_wheel_neuron):\n return cle_ros_msgs.msg.SpikeRate(t, left_wheel_neuron.rate, "left_wheel_neuron_rate_monitor")\n', ' @nrp.MapSpikeSink("left_wheel_neuron", nrp.brain.actors[1], nrp.leaky_integrator_alpha)\n @nrp.MapSpikeSink("right_wheel_neuron", nrp.brain.actors[2], nrp.leaky_integrator_alpha)\n @nrp.Neuron2Robot(Topic(\'/husky/cmd_vel\', geometry_msgs.msg.Twist))\n    def linear_twist(t, left_wheel_neuron, right_wheel_neuron):\n\n\n\n\n        return geometry_msgs.msg.Twist(linear=geometry_msgs.msg.Vector3(x=20.0 * min(left_wheel_neuron.voltage, right_wheel_neuron.voltage), y=0.0, z=0.0), angular=geometry_msgs.msg.Vector3(x=0.0, y=0.0, z=100.0 * (right_wheel_neuron.voltage - left_wheel_neuron.voltage)))\n', ' @nrp.MapRobotSubscriber("camera", Topic(\'/husky/camera\', sensor_msgs.msg.Image))\n    @nrp.MapSpikeSource("red_left_eye", nrp.brain.sensors[slice(0, 3, 2)], nrp.poisson)\n @nrp.MapSpikeSource("red_right_eye", nrp.brain.sensors[slice(1, 4, 2)], nrp.poisson)\n    @nrp.MapSpikeSource("green_blue_eye", nrp.brain.sensors[4], nrp.poisson)\n    @nrp.Robot2Neuron()\n    def eye_sensor_transmit(t, camera, red_left_eye, red_right_eye, green_blue_eye):\n\n        image_results = hbp_nrp_cle.tf_framework.tf_lib.detect_red(image=camera.value)\n\n red_left_eye.rate = 1000.0 * image_results.left\n red_right_eye.rate = 1000.0 * image_results.right\n green_blue_eye.rate = 1000.0 * image_results.go_on\n'];

        //$scope.openCallback = function() {
        //  simulationTransferFunctions(serverBaseUrl).transferFunctions({sim_id: simulationID}, function (data) {
        //    $scope.transferFunctions = eval(data.transfer_functions);
        //  });
        //}
      }
    };
  }]);
}());
