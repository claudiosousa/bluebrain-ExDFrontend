(function () {
  'use strict';
  var pointFrequency = 5.0; // number of points per seconds
  var topicSubCb;

  function configureJointPlot(scope, roslib) {
    scope.curves = {};
    scope.selectedJoints = {};
    scope.properties = ["position", "velocity", "effort"];
    scope.jointColors = [];
    scope.selectedProperty = { name: scope.properties[0] };
    scope.timeWindow = 10;
    var colorScale = d3.scale.category10();

    scope.updateVisibleSeries = function () {
      scope.plotOptions.series.forEach(function (serie) {
        serie.visible = serie.prop === scope.selectedProperty.name && !!scope.selectedJoints[serie.joint];
      });
    };

    // Subscribe to the ROS topic
    scope.startJointDisplay = function () {
      var rosConnection = roslib.getOrCreateConnectionTo(scope.server);
      scope.jointTopicSubscriber = scope.jointTopicSubscriber || roslib.createTopic(rosConnection,
        scope.topic,
        'sensor_msgs/JointState', {
          throttle_rate: 1.0 / pointFrequency * 1000.0
        });
      topicSubCb = scope.jointTopicSubscriber.subscribe(scope.onNewJointMessageReceived, true);
    };

    function initializeJoints(allJoints) {
      scope.allJoints = allJoints;

      allJoints.forEach(function (joint, i) {

        var color = colorScale(i);
        scope.jointColors.push(color);

        scope.properties.forEach(function (prop) {
          scope.curves[joint + '_' + prop] = [];
          var curveName = joint + '_' + prop;
          var curve = {
            key: 'y',
            joint: joint,
            prop: prop,
            type: ['dot', 'line'],
            dataset: curveName,
            color: color
          };
          scope.plotOptions.series.push(curve);
        });
      });

      scope.updateVisibleSeries();
    }

    scope.onNewJointMessageReceived = function (message) {
      if (!scope.allJoints) {
        initializeJoints(message.name);
      }

      var currentTime = message.header.stamp.secs + message.header.stamp.nsecs * 0.000000001;
      if (currentTime > scope.plotOptions.axes.x.max) {
        scope.plotOptions.axes.x.max = currentTime;
        scope.plotOptions.axes.x.min = currentTime - scope.timeWindow;
      }

      _.forOwn(scope.curves, function (values, name) {
        scope.curves[name] = _.filter(values, function (point) {
          return point.time >= scope.plotOptions.axes.x.min;
        });
      });

      _.forEach(message.name, function (name, idx) {
        scope.properties.forEach(function (prop) {
          scope.curves[name + '_' + prop].push({
            time: currentTime,
            y: message[prop][idx]
          });
        });
      });
    };

    // Unsubscribe to the ROS topic
    scope.stopJointDisplay = function () {
      if (scope.jointTopicSubscriber) {
        // One has to be careful here: it is not sufficient to only call unsubscribe but you have to
        // put in the function as an argument, otherwise your function will be called twice!
        scope.jointTopicSubscriber.unsubscribe(topicSubCb);
      }
    };
  }

  angular.module('exdFrontendApp').directive('jointPlot', ['$log', '$window', '$filter', 'roslib', 'stateService', 'STATE', '$timeout', 'RESET_TYPE', function ($log, $window, $filter, roslib, stateService, STATE, $timeout, RESET_TYPE) {
    return {
      templateUrl: 'views/esv/joint-plot.html',
      restrict: 'E',
      replace: true,
      scope: {
        server: '@',
        topic: '@',
        // see https://github.com/angular/angular.js/issues/2500
        ngShow: '=',
        closeWidget: '&'
      },
      link: function (scope, element, attrs) {
        ['server', 'topic']
          .forEach(function (mandatoryProp) {
            if (angular.isUndefined(scope[mandatoryProp])) {
              $log.error('The ' + mandatoryProp + ' property was not specified!');
            }
          });

        configureJointPlot(scope, roslib);

        scope.onResizeBegin = function () {
          element.addClass('resizing');
        };
        scope.onResizeEnd = function () {
          // the chart needs a bit of time to adjust its size
          $timeout(function () { element.removeClass('resizing'); }, 200);
        };

        scope.plotOptions = {
          drawDots: true,
          drawLegend: false,
          tooltipHook: function () { return false; },
          tooltip: {
            mode: 'none'
          },
          axes: {
            x: {
              key: 'time',
              ticks: 10,
              min: 0,
              max: scope.timeWindow
            },
            y: {
              padding: { min: 5, max: 5 }
            }
          },
          series: []
        };

        // When starting to display (or hide) the canvas, we need to subscribe (or unsubscribe) to the
        // ROS topic.
        if (attrs.hasOwnProperty('ngShow')) {
          scope.$watch("ngShow", function (visible) {
            if (visible) {
              element.show();
              scope.startJointDisplay();
            }
            else {
              element.hide();
              scope.stopJointDisplay();
            }
          });
        }

        scope.clearPlot = function () {
          _.forOwn(scope.curves, function (values) {
            values.length = 0;
          });
          scope.plotOptions.axes.x.min = 0;
          scope.plotOptions.axes.x.max = scope.timeWindow;
        };

        //clear plot when resetting the simulation
        scope.resetListenerUnbindHandler = scope.$on('RESET', function (event, resetType) {
          if (resetType !== RESET_TYPE.RESET_CAMERA_VIEW) {
            scope.clearPlot();
          }
        });

        // clean up on leaving
        scope.$on("$destroy", function () {
          // unbind resetListener callback
          scope.resetListenerUnbindHandler();
        });
      }
    };
  }]);
} ());