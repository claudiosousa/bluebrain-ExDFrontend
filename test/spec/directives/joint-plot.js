(function () {
'use strict';

describe('Directive: joint-plot', function () {
  /*jshint camelcase: false */

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var $scope, parentscope, element, roslib, window;
  var SERVER_URL = 'ws://localhost:1234';
  var JOINT_TOPIC = '/gazebo/joint_states';

  // TODO(Stefan) extract this to a common place, it is used in several places!
  var roslibMock = {};
  var returnedConnectionObject = {};
  var messageMock = {
    name: ['jointa',
           'jointb',
           'jointc'],
    position: [1, 2, 3],
    velocity: [4, 5, 6],
    effort: [7,8,9],
    header: { stamp: { secs: 1, nsecs: 500000000} }
  };

  var messageMockFar = _.cloneDeep(messageMock);
  messageMockFar.header.stamp.secs += 1;

  returnedConnectionObject.subscribe = jasmine.createSpy('subscribe');
  returnedConnectionObject.unsubscribe = jasmine.createSpy('unsubscribe');
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').andReturn({});
  roslibMock.createTopic = jasmine.createSpy('createTopic').andReturn(returnedConnectionObject);

  beforeEach(module(function ($provide) {
    $provide.value('roslib', roslibMock);
  }));

  beforeEach(inject(function ($rootScope, $compile, $window, _roslib_) {
    parentscope = $rootScope.$new();
    parentscope.showJointPlot = true;
    element = $compile('<joint-plot server="' + SERVER_URL + '" topic="' + JOINT_TOPIC + '" ng-show="showJointPlot"></joint-plot>')(parentscope);
    parentscope.$digest();

    $scope = element.isolateScope();
    roslib = _roslib_;
    window = $window;
    $scope.selectedJoints = {
      jointa: true,
      jointb: true,
      jointc: false
    };
    $scope.selectedProperty = { name: 'position' };
    $scope.minYIntervalWidth = 1.0;
  }));

  it('should replace the element with the appropriate content', function () {
    // Compile a piece of HTML containing the directive
    expect(element.prop('outerHTML')).toContain('class="jointplot');
    expect(element.prop('outerHTML')).toContain(JOINT_TOPIC);
    expect(element.prop('outerHTML')).toContain(SERVER_URL);
    expect(element.prop('outerHTML')).toContain('<svg');
  });

  it('should unregister from stateService on destroy', inject(function(stateService) {
    spyOn(stateService,'removeStateCallback');
    $scope.$broadcast('$destroy');
    $scope.$digest();
    expect(stateService.removeStateCallback).toHaveBeenCalled();
  }));

  it('should register selected curves properly', function() {
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.curves.length).toBe(1);
    expect($scope.curves[0].time).toBe(1.5);

    expect($scope.curves[0].jointa_position).toBe(1);
    expect($scope.curves[0].jointb_position).toBe(2);


    // velocity and effort are not selected properties
    expect($scope.curves[0].jointa_velocity).toBeUndefined();
    expect($scope.curves[0].jointb_velocity).toBeUndefined();

    expect($scope.curves[0].jointa_effort).toBeUndefined();
    expect($scope.curves[0].jointb_effort).toBeUndefined();

    expect($scope.curves[0].jointa).toBeUndefined();
    expect($scope.curves[0].jointb).toBeUndefined();

    expect($scope.curves[0].jointc_position).toBeUndefined();
    expect($scope.curves[0].jointc_velocity).toBeUndefined();
    expect($scope.curves[0].jointc_effort).toBeUndefined();
  });



  it('should increase its y interval', function() {
    messageMock.position[0] = -5;
    messageMock.position[1] = 7;
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.plotOptions.axes.y.min).toBe(-5);
    expect($scope.plotOptions.axes.y.max).toBe(7);
  });

  it('should not decrease its y interval below min interval width', function() {
    messageMock.position[0] = -8.0;
    messageMock.position[1] = -7.5;
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.plotOptions.axes.y.min).toBe(-8.25);
    expect($scope.plotOptions.axes.y.max).toBe(-7.25);
  });

  it('should not take undefined into account for computing its y interval', function() {
    messageMock.position[0] = undefined;
    messageMock.position[1] = 5;
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.plotOptions.axes.y.min).toBe(4.5);
    expect($scope.plotOptions.axes.y.max).toBe(5.5);
  });


  it('should register 2 datapoints that are sufficiently far in time', function() {
    $scope.onNewJointMessageReceived(messageMock);
    $scope.onNewJointMessageReceived(messageMockFar);
    expect($scope.curves.length).toBe(2);
  });

  it('should connect to roslib when calling startJointDisplay', function () {
    roslibMock.getOrCreateConnectionTo.reset();
    roslibMock.createTopic.reset();
    returnedConnectionObject.subscribe.reset();

    $scope.jointTopicSubscriber = undefined;
    $scope.startJointDisplay();

    expect(roslibMock.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslibMock.createTopic).toHaveBeenCalled();
    expect(returnedConnectionObject.subscribe).toHaveBeenCalled();
  });

  it('should hide on resize begin', function() {
    var lineChartWrapper = angular.element(element[0].childNodes[1].childNodes[5]);
    $scope.onResizeBegin();
    expect(lineChartWrapper.css('visibility')).toBe('hidden');
  });

  it('should show on resize end', inject(function($timeout) {
    var lineChartWrapper = angular.element(element[0].childNodes[1].childNodes[5]);
    lineChartWrapper.css('visibility', 'hidden');
    $scope.onResizeEnd();
    $timeout.flush();
    expect(lineChartWrapper.css('visibility')).toBe('visible');
  }));


  it('should unsubscribe when stopJointDisplay is called', function () {
    $scope.jointTopicSubscriber = {unsubscribe: jasmine.createSpy('unsubscribe')};
    $scope.stopJointDisplay();
    expect($scope.jointTopicSubscriber.unsubscribe).toHaveBeenCalled();
  });

  it('should call the stopJointDisplay function', function () {
    spyOn($scope, 'stopJointDisplay');
    parentscope.showJointPlot = false;
    parentscope.$digest();
    $scope.$digest();
    expect($scope.stopJointDisplay).toHaveBeenCalled();
  });

  it('should call the startJointDisplay function', function () {
    parentscope.showJointPlot = false;
    parentscope.$digest();
    $scope.$digest();

    spyOn($scope, 'startJointDisplay');
    parentscope.showJointPlot = true;
    parentscope.$digest();
    $scope.$digest();
    expect($scope.startJointDisplay).toHaveBeenCalled();
  });


  it('should register new joint', function () {
    expect($scope.curves.length).toBe(0);
    expect($scope.selectedJoints.jointc).toBeFalsy();
    $scope.selectedJoints.jointc = true;
    $scope.$digest();
    $scope.onNewJointMessageReceived(messageMock);

    expect($scope.curves[0].jointc_position).toBe(3);
    expect($scope.curves[0].jointc_velocity).toBeUndefined();
    expect($scope.curves[0].jointc_effort).toBeUndefined();
  });

  it('should register new property', function () {
    expect($scope.curves.length).toBe(0);
    expect($scope.selectedProperty.name).toBe('position');
    $scope.selectedProperty.name = 'effort';
    $scope.$digest();
    $scope.onNewJointMessageReceived(messageMock);

    expect($scope.curves[0].jointa_effort).toBe(7);
    expect($scope.curves[0].jointb_effort).toBe(8);
  });

  it('should add colors to colormap', function () {
    expect($scope.curveToColorIdx).toEqual({});
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.curveToColorIdx.jointa_position).toBe(0);
    expect($scope.curveToColorIdx.jointb_position).toBe(1);
  });

  it('should clean colormap when curves are removed', function () {
    $scope.curveToColorIdx = {some_joint_position : 0};
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.curveToColorIdx.some_joint_position).toBeUndefined();
  });

  it('should have no color for unselected curve', function() {
    var style = $scope.getCurveColor('jointc');
    expect(style.color).toBeUndefined();
  });



  it('should gray-out a selected curve that has no color yet', function() {
    var style = $scope.getCurveColor('jointa');
    expect(style.color).toBe('#8A8A8A');
  });


  it('should provide curve color', function() {
    spyOn($scope, 'indexToColor').andReturn('#FFFFFF');
    $scope.onNewJointMessageReceived(messageMock);
    var style = $scope.getCurveColor('jointa');
    expect($scope.indexToColor).toHaveBeenCalled();
    expect(style.color).toBe('#FFFFFF');
  });


  it('should use previously selected colors', function() {
    spyOn($scope, 'indexToColor');
    $scope.onNewJointMessageReceived(messageMock);
    var indexToColorCallCount = $scope.indexToColor.callCount;
    expect(indexToColorCallCount).toBeGreaterThan(0);
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.indexToColor.callCount).toBe(indexToColorCallCount);
  });

  it('should pop datapoints when they are too old', function() {
    var messageMockClose = _.cloneDeep(messageMock);
    messageMockClose.header.stamp.secs += 0.5;

    var messageMockReallyFar1 = _.cloneDeep(messageMock);
    messageMockReallyFar1.header.stamp.secs += 1000;
    var messageMockReallyFar2 = _.cloneDeep(messageMock);
    messageMockReallyFar1.header.stamp.secs += 1000.5;

    $scope.onNewJointMessageReceived(messageMock);
    $scope.onNewJointMessageReceived(messageMockClose);
    $scope.onNewJointMessageReceived(messageMockReallyFar1);
    // two first messages are filtered out, too old
    expect($scope.curves.length).toBe(1);
    $scope.onNewJointMessageReceived(messageMockReallyFar2);
    expect($scope.curves.length).toBe(2);
  });

});

describe('Directive: joint-plot (missing necessary attributes)', function () {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var element;
  var $log;
  var $scope;

  var logMock = {error: jasmine.createSpy('error')};

  beforeEach(module(function ($provide) {
    $provide.value('$log', logMock);
  }));

  beforeEach(inject(function ($rootScope, $compile,_$log_) {
    $scope = $rootScope.$new();
    element = $compile('<joint-plot></joint-plot>')($scope);
    $scope.$digest();
    $log = _$log_;
  }));

  it('should log to error in case we have left out necessary attributes', function() {
    expect($log.error).toHaveBeenCalledWith('The server URL was not specified!');
    expect($log.error).toHaveBeenCalledWith('The topic for the joints was not specified!');
  });

});
}());
