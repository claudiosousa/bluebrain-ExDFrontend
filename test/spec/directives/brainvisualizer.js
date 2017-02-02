'use strict';

describe('Directive: brainvisualizer', function ()
{
  var $rootScope, element;

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
     /* jshint ignore:end */
     callback(testData);
   };

    $provide.value('backendInterfaceService', backendInterfaceServiceMock);

    simulationConfigServiceMock.simulateCatch = false;
    simulationConfigServiceMock.fileExists = true;

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
    $compile)
  {
    window.BRAIN3D = {
      MainView: jasmine.createSpy('MainView').andReturn({setPaused: function(p){_$rootScope_.pausedState = p;},updatePopulationVisibility:angular.noop  })
    };
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

  it('should be able to init without brain file', function ()
  {
    simulationConfigServiceMock.simulateCatch = false;
    simulationConfigServiceMock.fileExists = false;
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


});
