(function() {
  'use strict';
  /* global n3Charts */
  n3Charts.Factory.Transition.defaultDuration = 0;

  class JoinPlotController {

    //visible seconds
    static get WINDOW_TIME() { return 10; }
    get properties() { return ["position", "velocity", "effort"]; }

    constructor(scope, RESET_TYPE, jointService) {
      this.plot = {
        curves: {},
        options: {
          drawDots: true,
          drawLegend: false,
          tooltipHook: () => false,
          tooltip: { mode: 'none' },
          axes: {
            x: {
              key: 'time',
              ticks: 10,
              min: 0,
              max: JoinPlotController.WINDOW_TIME
            },
            y: { padding: { min: 5, max: 5 } }
          },
          series: []
        }
      };

      this.selectedProperty = { name: this.properties[0] };

      scope.$on('RESET', (event, resetType) => {
        if (resetType !== RESET_TYPE.RESET_CAMERA_VIEW)
          this.clearPlot();
      });

      let messageCallback = (msg) => this.onNewJointMessage(msg);
      jointService.subscribe(messageCallback);

      scope.$on('$destroy', () => jointService.unsubscribe(messageCallback));
    }

    onNewJointMessage(message) {
      if (!this.allJoints)
        this.initializeJoints(message.name);

      var currentTime = message.header.stamp.secs + message.header.stamp.nsecs * 0.000000001;
      if (currentTime > this.plot.options.axes.x.max) {
        this.plot.options.axes.x.max = currentTime;
        this.plot.options.axes.x.min = currentTime - JoinPlotController.WINDOW_TIME;
      }

      _.forOwn(this.plot.curves, values => {
        while (values.length && values[0].time < this.plot.options.axes.x.min)
          values.shift();
      });
      _.forEach(message.name, (name, idx) => {
        this.properties.forEach(prop => {
          this.plot.curves[name + '_' + prop].push({
            time: currentTime,
            y: message[prop][idx]
          });
        });
      });
    }

    initializeJoints(allJoints) {
      let colorScale = d3.scale.category10();

      this.allJoints = allJoints.map((joint, i) => ({
        name: joint,
        color: colorScale(i),
        selected: false
      }));

      this.allJoints.forEach(joint => {
        this.properties.forEach(prop => {
          let curveName = joint.name + '_' + prop;
          this.plot.curves[curveName] = [];
          this.plot.options.series.push({ //chart series = cartesian multiplication curves * properties
            key: 'y',
            joint,
            prop,
            type: ['dot', 'line'],
            dataset: curveName,
            color: joint.color
          });
        });
      });

      this.updateVisibleSeries();
    }

    clearPlot() {
      _.forOwn(this.plot.curves, values => values.length = 0);
      this.plot.options.axes.x.min = 0;
      this.plot.options.axes.x.max = JoinPlotController.WINDOW_TIME;
    }

    updateVisibleSeries() {
      this.plot.options.series.forEach(serie => {
        serie.visible = serie.prop === this.selectedProperty.name && !!serie.joint.selected;
      });
    }
  }

  angular
    .module('jointPlotModule', ['bbpConfig'])
    .controller('JoinPlotController', ['$scope', 'RESET_TYPE', 'jointService', (...args) => new JoinPlotController(...args)]);

})();
