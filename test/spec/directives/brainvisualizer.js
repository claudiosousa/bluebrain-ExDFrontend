'use strict';

describe('Directive: brainvisualizer', function() {
  var $rootScope, element, RESET_TYPE;

  var spikeListenerServiceMock = {};
  var simulationConfigServiceMock = {};
  var backendInterfaceServiceMock = {};

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module(function($provide) {
    backendInterfaceServiceMock.getBrain = function(callback) {
      var testData = {};
      /* jshint ignore:start */
      testData.additional_populations = new Object();
      testData.additional_populations.record = {'to': 2, 'step': null, 'from': 0};
      testData.additional_populations.sensors = [0, 1];
      /* jshint ignore:end */
      callback(testData);
    };

    backendInterfaceServiceMock.getPopulations = function(callback) {
      var testData = {};

      /* jshint ignore:start */

       testData.populations = new Array();
       testData.populations.push({ "indices": [0, 1], "neuron_model": "IF_cond_alpha", "name": "circuit", "parameters": [{ "parameterName": "tau_refrac", "value": 10 }, { "parameterName": "tau_m", "value": 10 }, { "parameterName": "e_rev_E", "value": 0 }, { "parameterName": "i_offset", "value": 0 }, { "parameterName": "cm", "value": 0.02500000037252903 }, { "parameterName": "e_rev_I", "value": -75 }, { "parameterName": "v_thresh", "value": -60 }, { "parameterName": "tau_syn_E", "value": 2.5 }, { "parameterName": "v_rest", "value": -60.5 }, { "parameterName": "tau_syn_I", "value": 2.5 }, { "parameterName": "v_reset", "value": -60.5 }], "gids": [3, 4] });

       testData.populations.push({ "indices": [0, 1], "neuron_model": "IF_cond_alpha", "name": "record", "parameters": [{ "parameterName": "tau_refrac", "value": 10 }, { "parameterName": "tau_m", "value": 10 }, { "parameterName": "e_rev_E", "value": 0 }, { "parameterName": "i_offset", "value": 0 }, { "parameterName": "cm", "value": 0.02500000037252903 }, { "parameterName": "e_rev_I", "value": -75 }, { "parameterName": "v_thresh", "value": -60 }, { "parameterName": "tau_syn_E", "value": 2.5 }, { "parameterName": "v_rest", "value": -60.5 }, { "parameterName": "tau_syn_I", "value": 2.5 }, { "parameterName": "v_reset", "value": -60.5 }], "gids": [3, 4] });

      /* jshint ignore:end */
      callback(testData);
    };

    $provide.value('backendInterfaceService', backendInterfaceServiceMock);

    simulationConfigServiceMock.simulateCatch = false;
    simulationConfigServiceMock.fileExists = true;
    simulationConfigServiceMock.fileWrongFormat = false;

    simulationConfigServiceMock.doesConfigFileExist = function() {
      var that = this;
      var res = {};
      res.then = function(callback) {
        callback(that.fileExists);

        var catchres = {};

        catchres.catch = function(callback) {
          if (that.simulateCatch) {
            callback();
          }
        };

        return catchres;
      };
      return res;
    };

    simulationConfigServiceMock.loadConfigFile = function() {
      var that = this;
      var res = {};
      res.then = function(callback) {
        var testData = '{"xyz":[100,0,0,-100,0,0,100,0,100,-100,0,100,0,0,100,0,0,-100,0,100,-100,0,100,100],"populations":{"record":{"to":2,"step":null,"from":0,"color":"hsl(0,70%,80%)","name":"record","visible":true},"neurons":{"to":2,"step":null,"from":0,"color":"hsl(120,70%,80%)","name":"neurons","visible":true}}}';

        if (that.fileWrongFormat) {
          testData = null;
        }

        callback(testData);

        var catchres = {};

        catchres.catch = function(callback) {
          if (that.simulateCatch) {
            callback();
          }
        };

        return catchres;
      };
      return res;
    };

    $provide.value('simulationConfigService', simulationConfigServiceMock);

    spikeListenerServiceMock.startListening = function() { };
    spikeListenerServiceMock.stopListening = function() { };

    $provide.value('spikeListenerService', spikeListenerServiceMock);

  }));

  describe('- normal initialization', function() {
    beforeEach(inject(function(_$rootScope_,
                               _RESET_TYPE_,
                               $compile) {
      RESET_TYPE = _RESET_TYPE_;

      window.BRAIN3D = {
        MainView: jasmine.createSpy('MainView').and.returnValue(
          {
            updateData: function() {},
            flushPendingSpikes: function() {},
            setSpikeScaleFactor: function(spikefactor) {_$rootScope_.spikefactor = spikefactor;},
            setPaused: function(p) {_$rootScope_.pausedState = p;},
            setDistribution: function(p) {_$rootScope_.distribution = p;},
            setDisplayType: function(p) {_$rootScope_.display = p;},
            setShape: function(p) {_$rootScope_.shape = p;},
            displaySpikes: jasmine.createSpy('displaySpikes'),
            updatePopulationVisibility: angular.noop,
            terminate: jasmine.createSpy('terminate')
          })
      };

      window.BRAIN3D.REP_SHAPE_SPHERICAL = 'Sphere';
      window.BRAIN3D.REP_SHAPE_CUBIC = 'Cube';
      window.BRAIN3D.REP_SHAPE_FLAT = 'Flat';
      window.BRAIN3D.REP_SHAPE_CLOUD = 'Cloud';
      window.BRAIN3D.REP_SHAPE_USER = 'User';
      window.BRAIN3D.REP_DISTRIBUTION_OVERLAP = 'Overlap';
      window.BRAIN3D.REP_DISTRIBUTION_DISTRIBUTE = 'Distribute';
      window.BRAIN3D.REP_DISTRIBUTION_SPLIT = 'Split';
      window.BRAIN3D.DISPLAY_TYPE_POINT = 'Solid';
      window.BRAIN3D.DISPLAY_TYPE_BLENDED = 'Blended';

      $rootScope = _$rootScope_;
      element = $compile('<brainvisualizer></brainvisualizer>')($rootScope);
      $rootScope.$digest();
  }));

    it('should create BRAIN3D main view', function() {
      $rootScope.$digest();

      expect(window.BRAIN3D.MainView).toHaveBeenCalled();

    });

    it('should toggle visibility', function() {
      $rootScope.$digest();

      var pop = {visible: true};

      $rootScope.$$childTail.togglePopulationVisibility(pop);

      expect(pop.visible).toBe(false);

    });

    it('should handle spike scaler', function() {
      $rootScope.$$childTail.spikeScaler = 1.0;
      $rootScope.$digest();
      $rootScope.$$childTail.updateSpikeScaler();

      expect($rootScope.spikefactor).toBe(1.0);

      $rootScope.$$childTail.spikeScaler = 0.0;
      $rootScope.$digest();
      $rootScope.$$childTail.updateSpikeScaler();
      expect($rootScope.spikefactor).toBe(0.0);

    });

    it('should set shape', function() {
      $rootScope.$digest();

      $rootScope.$$childTail.setShape(true);
      expect($rootScope.shape).toBe(true);

    });

    it('should set distribution', function() {
      $rootScope.$digest();

      $rootScope.$$childTail.setDistribution(true);
      expect($rootScope.distribution).toBe(true);

    });

    it('should set display', function() {
      $rootScope.$digest();

      $rootScope.$$childTail.setDisplay(true);
      expect($rootScope.display).toBe(true);

    });

    it('should be able to update data', function() {
      simulationConfigServiceMock.simulateCatch = false;
      simulationConfigServiceMock.fileExists = false;
      $rootScope.$digest();
      $rootScope.$$childTail.update();

      expect(window.BRAIN3D.MainView).toHaveBeenCalled();

    });

    it('should be able to update data on reset', function() {
      $rootScope.$$childTail.update = jasmine.createSpy('update');

      $rootScope.$broadcast('RESET', RESET_TYPE.RESET_FULL);
      $rootScope.$digest();

      expect($rootScope.$$childTail.update).toHaveBeenCalled();
    });

    it('should be able to update data on reset', function() {
      $rootScope.$$childTail.update = jasmine.createSpy('update');

      $rootScope.$broadcast('pynn.populationsChanged');
      $rootScope.$digest();

      expect($rootScope.$$childTail.update).toHaveBeenCalled();

    });

    it('should be terminate on destroy', function() {

      $rootScope.$broadcast('$destroy');
      $rootScope.$digest();

      expect(window.BRAIN3D.MainView).toHaveBeenCalled();

    });

  });

  describe('use alternative init methods', function() {

    beforeEach(inject(function(_$rootScope_,
                               _RESET_TYPE_,
                               $compile) {
      RESET_TYPE = _RESET_TYPE_;

      window.BRAIN3D = {
        MainView: jasmine.createSpy('MainView').and.returnValue(
          {
            updateData: function() {},
            flushPendingSpikes: function() {},
            setSpikeScaleFactor: function(spikefactor) {_$rootScope_.spikefactor = spikefactor;},
            setPaused: function(p) {_$rootScope_.pausedState = p;},
            setDistribution: function(p) {_$rootScope_.distribution = p;},
            setDisplayType: function(p) {_$rootScope_.display = p;},
            setShape: function(p) {_$rootScope_.shape = p;},
            displaySpikes: jasmine.createSpy('displaySpikes'),
            updatePopulationVisibility: angular.noop,
            terminate: jasmine.createSpy('terminate')
          })
      };

      window.BRAIN3D.REP_SHAPE_SPHERICAL = 'Sphere';
      window.BRAIN3D.REP_SHAPE_CUBIC = 'Cube';
      window.BRAIN3D.REP_SHAPE_FLAT = 'Flat';
      window.BRAIN3D.REP_SHAPE_CLOUD = 'Cloud';
      window.BRAIN3D.REP_SHAPE_USER = 'User';
      window.BRAIN3D.REP_DISTRIBUTION_OVERLAP = 'Overlap';
      window.BRAIN3D.REP_DISTRIBUTION_DISTRIBUTE = 'Distribute';
      window.BRAIN3D.REP_DISTRIBUTION_SPLIT = 'Split';
      window.BRAIN3D.DISPLAY_TYPE_POINT = 'Solid';
      window.BRAIN3D.DISPLAY_TYPE_BLENDED = 'Blended';

      $rootScope = _$rootScope_;

      element = $compile('<brainvisualizer></brainvisualizer>')($rootScope);
    }));


    it('should be able to init populations with the brain', function() {
      simulationConfigServiceMock.simulateCatch = true;

      $rootScope.$digest();

      expect(window.BRAIN3D.MainView).toHaveBeenCalled();
      //expect($rootScope.$$childTail.initBrainContainer).not.toHaveBeenCalled();
    });

    it('should be able to init with a bad formatted file', function() {
      simulationConfigServiceMock.simulateCatch = true;
      simulationConfigServiceMock.fileExists = true;
      simulationConfigServiceMock.fileWrongFormat = true;
      $rootScope.$digest();

      expect(window.BRAIN3D.MainView).toHaveBeenCalled();
    });

    it('should be able to init without brain file', function() {
      simulationConfigServiceMock.simulateCatch = false;
      simulationConfigServiceMock.fileExists = false;
      simulationConfigServiceMock.fileWrongFormat = false;
      $rootScope.$digest();

      expect(window.BRAIN3D.MainView).toHaveBeenCalled();

    });
    //
    //it('should skip init brain container and call initWithPopulation', function() {
    //  simulationConfigServiceMock.fileExists = false;
    //  $rootScope.$$childTail.initBrainContainer = jasmine.createSpy('initBrainContainer');
    //  $rootScope.$$childTail.initWithPopulations = jasmine.createSpy('initWithPopulations');
    //  $rootScope.$digest();
    //
    //  expect($rootScope.$$childTail.initBrainContainer).not.toHaveBeenCalled();
    //  //expect($rootScope.$$childTail.initWithPopulations).toHaveBeenCalled();
    //});
    //
    //it('should skip init brain container and call initWithPopulation', function() {
    //  simulationConfigServiceMock.fileWrongFormat = false;
    //  $rootScope.$$childTail.initBrainContainer = jasmine.createSpy('initBrainContainer');
    //  $rootScope.$$childTail.initWithPopulations = jasmine.createSpy('initWithPopulations');
    //  $rootScope.$digest();
    //
    //  expect($rootScope.$$childTail.initBrainContainer).not.toHaveBeenCalled();
    //  //expect($rootScope.$$childTail.initWithPopulations).toHaveBeenCalled();
    //});
  });
});
