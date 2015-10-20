(function () {
  'use strict';
  var MAX_N_MEASUREMENTS = 100;
  var pointFrequency = 5.0; // number of points per seconds

  function configureJointPlot(scope, roslib) {
    scope.curves = [];
    scope.allJoints = [];
    scope.selectedJoints = {};
    scope.selectedProperty = { name: "position" };
    scope.indexToColor = d3.scale.category10();
    scope.curveToColorIdx = {};

    scope.getCurveColor = function(joint) {
      var cssRet = {};
      if (scope.selectedJoints[joint]) {
        var colorIdx = scope.curveToColorIdx[joint + '_' + scope.selectedProperty.name];
        if (!_.isUndefined(colorIdx)) {
          cssRet.color = scope.indexToColor(scope.curveToColorIdx[joint + '_' + scope.selectedProperty.name]);
        }
        else {
          // this curve is selected but it may not have been assigned a color yet
          cssRet.color = "#8A8A8A";
        }
      }
      return cssRet;
    };

    scope.updateSerieRequired = true;
    var requireUpdateSerie = function() {
      scope.updateSerieRequired = true;
    };

    // get first available index in colormap and save it: [0, 1, 2, 4, 5] ---> 3
    var findColorForCurve = function(curveName) {
      var colorIdx = _.chain(scope.curveToColorIdx)
        .map(_.identity) //get all taken color index
        .sortBy(_.lt)
        .reduce(function(previous, n) {
          // return the first available index
          return (previous === n) ? n+1 : previous;
        }, 0)
        .value();

      scope.curveToColorIdx[curveName] = colorIdx;
      return colorIdx;
    };

    var updateSeries = function() {
      var jointToPlot =  _.pick(scope.selectedJoints, _.identity); // filter out falsy values

      var curveNamesToPlot = [];

      _.forOwn(jointToPlot, function(trueBool, joint) {
        curveNamesToPlot.push(joint + '_' + scope.selectedProperty.name);
      });


      // unregister curve in colormap if not selected for plotting
      _.forOwn(scope.curveToColorIdx, function(colorIdx, curveName) {
        if (!_.contains(curveNamesToPlot,curveName)) {
          delete scope.curveToColorIdx[curveName];
        }
      });


      // finally copy the colored curves we plot in series
      var newSeries = [];
      _.forEach(curveNamesToPlot, function(curveName) {
        var curveColor = scope.curveToColorIdx.hasOwnProperty(curveName) ?
          scope.curveToColorIdx[curveName] : findColorForCurve(curveName);

        newSeries.push({
          y: curveName,
          color: scope.indexToColor(curveColor)
        });
      });

      scope.plotOptions.series = newSeries;
    };

    scope.$watch('selectedProperty.name', requireUpdateSerie);
    scope.$watch('selectedJoints', requireUpdateSerie, true);

    // Subscribe to the ROS topic
    scope.startJointDisplay = function () {
      var rosConnection = roslib.getOrCreateConnectionTo(scope.server);
      scope.jointTopicSubscriber = scope.jointTopicSubscriber || roslib.createTopic(rosConnection,
                                                                                    scope.topic,
                                                                                    'sensor_msgs/JointState', {
                                                                                      throttle_rate: 1.0 / pointFrequency * 1000.0
                                                                                    });
      scope.jointTopicSubscriber.subscribe(scope.onNewJointMessageReceived);
    };

    scope.onNewJointMessageReceived = function (message) {
      scope.allJoints = message.name;
      var currentTime = message.header.stamp.secs + message.header.stamp.nsecs * 0.000000001;
      if (scope.curves.length >= MAX_N_MEASUREMENTS) {
        scope.curves.shift();
      }

      var newDataPoint = {
        time: currentTime
      };

      var messageByJoint = [];
      _.forEach(message.name, function(name, idx) {
        messageByJoint.push({
          name: name,
          position: message.position[idx],
          velocity: message.velocity[idx],
          effort: message.effort[idx]
        });
      });

      _.forEach(messageByJoint, function (joint) {
        if (scope.selectedJoints[joint.name]) {
          // that joint is selected
          newDataPoint[joint.name + '_' + scope.selectedProperty.name] = joint[scope.selectedProperty.name];
        }
      });

      scope.curves.push(newDataPoint);

      if (scope.updateSerieRequired) {
        scope.updateSerieRequired = false;
        updateSeries();
      }
    };

    // Unsubscribe to the ROS topic
    scope.stopJointDisplay = function () {
      if (scope.jointTopicSubscriber) {
        // One has to be careful here: it is not sufficient to only call unsubscribe but you have to
        // put in the function as an argument, otherwise your function will be called twice!
        scope.jointTopicSubscriber.unsubscribe(scope.onNewJointMessageReceived);
      }
    };
  }

  angular.module('exdFrontendApp').directive('jointPlot', ['$log', '$window', '$filter', 'roslib', function ($log, $window, $filter, roslib) {
    return {
      templateUrl: 'views/esv/joint-plot.html',
      restrict: 'E',
      replace: true,
      scope: {
        server: '@',
        topic: '@'
      },
      link: function (scope, element, attrs) {
        scope.chartHeight = 400;
        if(angular.isUndefined(attrs.server)) {
          $log.error('The server URL was not specified!');
        }

        if(angular.isUndefined(attrs.topic)) {
          $log.error('The topic for the joints was not specified!');
        }

        configureJointPlot(scope, roslib);
        scope.plotOptions = {
          tooltip: {
            mode: 'none'
          },
          axes: {
            x: {key: 'time'}
          },
          series: []
        };

        // When starting to display (or hide) the canvas, we need to subscribe (or unsubscribe) to the
        // ROS topic.
        scope.$watch(function() { return element.is(':visible'); }, function(visible) {
          if (visible) {
            scope.startJointDisplay();
          }
          else {
            scope.stopJointDisplay();
          }
        });

        var parent = angular.element(element[0].childNodes[1]);
        scope.$watch(function() {
          return parent.height();
        }, function(newHeight) {
          scope.chartHeight = Math.max(newHeight,80);
        });
      }

    };
  }]);
}());
