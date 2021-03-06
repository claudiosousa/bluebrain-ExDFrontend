'use strict';

describe('Directive: brainvisualizer', function ()
{
  var $rootScope, element,RESET_TYPE;

  var simulationConfigServiceMock = {};
  var backendInterfaceServiceMock = {};

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module(function ($provide)
  {
   backendInterfaceServiceMock.getBrain = function(callback)
   {
     var testData = {};
   /* jshint ignore:start */
     testData.additional_populations = new Object();
     testData.additional_populations.record = {'to':2,'step':null,'from':0};
     testData.additional_populations.sensors = [0,1];
     /* jshint ignore:end */
     callback(testData);
   };

    $provide.value('backendInterfaceService', backendInterfaceServiceMock);

    simulationConfigServiceMock.simulateCatch = false;
    simulationConfigServiceMock.fileExists = true;
    simulationConfigServiceMock.fileWrongFormat = false;

    simulationConfigServiceMock.doesConfigFileExist = function ()
    {
      var that = this;
      var res = {};
      res.then = function (callback)
      {
        callback(that.fileExists);

        var catchres = {};

        catchres.catch = function (callback)
        {
          if (that.simulateCatch)
          {
            callback();
          }
        };

        return catchres;
      };
      return res;
    };

    simulationConfigServiceMock.loadConfigFile = function ()
    {
      var that = this;
      var res = {};
      res.then = function (callback)
      {
        var testData = '{"xyz":[100,0,0,-100,0,0,100,0,100,-100,0,100,0,0,100,0,0,-100,0,100,-100,0,100,100],"populations":{"record":{"to":2,"step":null,"from":0,"color":"hsl(0,70%,80%)","name":"record","visible":true},"neurons":{"to":2,"step":null,"from":0,"color":"hsl(120,70%,80%)","name":"neurons","visible":true}}}';

        if (that.fileWrongFormat)
        {
          testData = null;
        }

        callback(testData);

        var catchres = {};

        catchres.catch = function (callback)
        {
          if (that.simulateCatch)
          {
            callback();
          }
        };

        return catchres;
      };
      return res;
    };

    $provide.value('simulationConfigService', simulationConfigServiceMock);
  }));

  beforeEach(inject(function (
    _$rootScope_,
    _RESET_TYPE_,
    $compile)
  {
    RESET_TYPE = _RESET_TYPE_;

    window.BRAIN3D = {
      MainView: jasmine.createSpy('MainView').and.returnValue(
        {updateData:function(){},
        setPaused: function(p){_$rootScope_.pausedState = p;},
        setDistribution: function(p){_$rootScope_.distribution = p;},
        setShape: function(p){_$rootScope_.shape = p;},
        updatePopulationVisibility:angular.noop  })
    };

    window.BRAIN3D.REP_SHAPE_SPHERICAL = 'Sphere';
    window.BRAIN3D.REP_SHAPE_CUBIC = 'Cube';
    window.BRAIN3D.REP_SHAPE_FLAT = 'Flat';
    window.BRAIN3D.REP_SHAPE_CLOUD = 'Cloud';
    window.BRAIN3D.REP_SHAPE_USER = 'User';
    window.BRAIN3D.REP_DISTRIBUTION_OVERLAP = 'Overlap';
    window.BRAIN3D.REP_DISTRIBUTION_DISTRIBUTE = 'Distribute';
    window.BRAIN3D.REP_DISTRIBUTION_SPLIT = 'Split';

    $rootScope = _$rootScope_;
    element = $compile('<brainvisualizer></brainvisualizer>')($rootScope);
    $rootScope.$digest();
  }));


  it('should create BRAIN3D main view', function ()
  {
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();

    expect(window.BRAIN3D.MainView).toHaveBeenCalled();

  });

  it('should be able to init populations with the brain', function ()
  {
    simulationConfigServiceMock.simulateCatch = true;

    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();

    expect(window.BRAIN3D.MainView).toHaveBeenCalled();

  });

 it('should be able to init with a bad formatted file', function ()
  {
    simulationConfigServiceMock.simulateCatch = true;
    simulationConfigServiceMock.fileExists = true;
    simulationConfigServiceMock.fileWrongFormat = true;
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();

    expect(window.BRAIN3D.MainView).toHaveBeenCalled();
  });


  it('should be able to init without brain file', function ()
  {
    simulationConfigServiceMock.simulateCatch = false;
    simulationConfigServiceMock.fileExists = false;
    simulationConfigServiceMock.fileWrongFormat = false;
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();

    expect(window.BRAIN3D.MainView).toHaveBeenCalled();

  });


  it('should toggle visibility', function ()
  {
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();

    var pop = {visible:true};

    $rootScope.$$childTail.togglePopulationVisibility(pop);

    expect(pop.visible).toBe(false);

  });

  it('should set pause when hidden', function ()
  {
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();
    $rootScope.showBrainvisualizerPanel = false;
    $rootScope.$digest();

    expect($rootScope.pausedState).toBe(true);

  });


  it('should set shape', function ()
  {
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();

    $rootScope.$$childTail.setShape(true);
    expect($rootScope.shape).toBe(true);

  });

 it('should set distribution', function ()
  {
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();

    $rootScope.$$childTail.setDistribution(true);
    expect($rootScope.distribution).toBe(true);

  });

 it('should be able to update data', function ()
  {
    simulationConfigServiceMock.simulateCatch = false;
    simulationConfigServiceMock.fileExists = false;
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();
    $rootScope.$$childTail.update();

    expect(window.BRAIN3D.MainView).toHaveBeenCalled();

  });

   it('should be able to update data on reset', function ()
  {
    $rootScope.$$childTail.update = jasmine.createSpy('update');

    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$broadcast('RESET',RESET_TYPE.RESET_FULL);
    $rootScope.$digest();

    expect($rootScope.$$childTail.update).toHaveBeenCalled();
  });


   it('should be able to update data on reset', function ()
  {
    $rootScope.$$childTail.update = jasmine.createSpy('update');

    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$broadcast('pynn.populationsChanged');
    $rootScope.$digest();

    expect($rootScope.$$childTail.update).toHaveBeenCalled();

  });

   it('should be terminate on destroy', function ()
  {
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$broadcast('$destroy');
    $rootScope.$digest();

    expect(window.BRAIN3D.MainView).toHaveBeenCalled();

  });


});
