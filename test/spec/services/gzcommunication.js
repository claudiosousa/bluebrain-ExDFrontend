'use strict';

/* global GZ3D: true */
/* global Detector: true */
/* global document: true */

describe('setting up the simulation statistics', function () {

  var simulationStatistics;
  var gzCommunication;
  var gzInitialization;

  // we mock the whole gzCommunication service here
  var gzCommunicationMock = {};
  var gzCommunicationMethodChainMock = {};
  gzCommunicationMethodChainMock.subscribe = jasmine.createSpy('subscribe');
  gzCommunicationMock.connect = jasmine.createSpy('connect').andReturn(gzCommunicationMethodChainMock);

  var gzInitializationMock = {};

  // load the service to test and mock the necessary service
  beforeEach(module('gz3dServices'));
  beforeEach(module(function ($provide) {
    $provide.value('gzCommunication', gzCommunicationMock);
    $provide.value('gzInitialization', gzInitializationMock);
  }));

  beforeEach(inject(function (_simulationStatistics_, _gzCommunication_, _gzInitialization_) {
    simulationStatistics = _simulationStatistics_;
    gzCommunication = _gzCommunication_;
    gzInitialization = _gzInitialization_;
    // create a mock for console
    spyOn(console, 'error');
  }));


  it('establishes a communication channel to gzbridge\'s world_stats topic', function () {
    expect(gzCommunication.connect).toHaveBeenCalledWith('~/world_stats', 'worldstatistics');
  });

  it('checks for the calls of the registered callback functions', function () {
    var message = {
      'pause_time': {
        'sec': 0,
        'nsec': 0
      },
      'sim_time': {
        'sec': 19394,
        'nsec': 618000000
      },
      'real_time': {
        'sec': 19459,
        'nsec': 842937775
      },
      'paused': false,
      'iterations': 19394618
    };

    var simulationTimeCallback = jasmine.createSpy('simulationTimeCallback');
    var realTimeCallback = jasmine.createSpy('realTimeCallback');

    simulationStatistics.setSimulationTimeCallback(simulationTimeCallback);
    simulationStatistics.setRealTimeCallback(realTimeCallback);

    // now we can access the registered callback function
    var registeredCallbackFunction = gzCommunicationMethodChainMock.subscribe.mostRecentCall.args[0];
    registeredCallbackFunction(message);

    expect(simulationTimeCallback).toHaveBeenCalledWith('00 05:23:14');
    expect(realTimeCallback).toHaveBeenCalledWith('00 05:24:19');
  });
});

describe('testing the gzInitialization service', function () {
  var gzInitialization;
  var rootScope;

  //Mock the javascript document
  document = {};
  document.getElementById = function() {
    var element = {};
    element.appendChild = function(){};
    element.offsetHeight = 100;
    element.offsetWidth = 200;
    return element;
  };

  Detector = {};
  Detector.webgl = true;

  var SceneObject = {};
  SceneObject.render = jasmine.createSpy('render');
  var DomElement = {};
  SceneObject.getDomElement = jasmine.createSpy('getDomElement').andReturn(DomElement);
  SceneObject.setWindowSize = jasmine.createSpy('setWindowSize');
  var GuiObject = {};
  var GZIfaceObject = {};
  var SdfParserObject = {};
  GZ3D = {};
  GZ3D.Scene = jasmine.createSpy('Scene').andReturn(SceneObject);
  GZ3D.Gui = jasmine.createSpy('Gui').andReturn(GuiObject);
  GZ3D.GZIface = jasmine.createSpy('GZIface').andReturn(GZIfaceObject);
  GZ3D.SdfParser = jasmine.createSpy('SdfParser').andReturn(SdfParserObject);

  beforeEach(module('gz3dServices'));
  beforeEach(inject(function ($rootScope, _gzInitialization_) {
    rootScope = $rootScope;
    gzInitialization = _gzInitialization_;

    // create a mock for console
    spyOn(console, 'error');
  }));

  it('checks if all the GZ3D constructors have been called', function() {
    expect(GZ3D.Scene).toHaveBeenCalled();
    expect(GZ3D.Gui).toHaveBeenCalledWith(SceneObject);
    expect(GZ3D.GZIface).toHaveBeenCalledWith(SceneObject, GuiObject);
    expect(GZ3D.SdfParser).toHaveBeenCalledWith(SceneObject, GuiObject , GZIfaceObject);
    expect(SceneObject.getDomElement).toHaveBeenCalled();
    expect(SceneObject.render).toHaveBeenCalled();
  });

  it('checks for the correct callback of the DIV size changes', function() {
    rootScope.$digest();
    rootScope.container.offsetHeight = 110;
    rootScope.$digest();
    expect(SceneObject.setWindowSize).toHaveBeenCalledWith(200, 110);
    rootScope.container.offsetWidth = 210;
    rootScope.container.offsetHeight = 100;
    rootScope.$digest();
    expect(SceneObject.setWindowSize).toHaveBeenCalledWith(210, 100);
  });
});
