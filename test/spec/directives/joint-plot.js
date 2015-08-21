(function () {
'use strict';

describe('Directive: joint-plot', function () {
  /*jshint camelcase: false */

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var $scope, element, roslib, window;
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

  var messageMockClose = _.cloneDeep(messageMock);
  messageMockClose.header.stamp.nsecs += 500000;
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
    $scope = $rootScope.$new();
    element = $compile('<joint-plot server="' + SERVER_URL + '" topic="' + JOINT_TOPIC + '" ng-show="showJointPlot"></spiketrain>')($scope);
    $scope.$digest();
    roslib = _roslib_;
    window = $window;
    $scope.selectedJoints = {
      jointa: true,
      jointb: true,
      jointc: false
    };
    $scope.selectedProperties = {
      position: true,
      velocity: true,
      effort: false
    };

  }));

  it('replaces the element with the appropriate content', function () {
    // Compile a piece of HTML containing the directive
    expect(element.prop('outerHTML')).toContain('class="jointplot');
    expect(element.prop('outerHTML')).toContain(JOINT_TOPIC);
    expect(element.prop('outerHTML')).toContain(SERVER_URL);
    expect(element.prop('outerHTML')).toContain('<svg');
  });

  it('should register selected curves properly', function() {
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.curves.length).toBe(1);
    expect($scope.curves[0].time).toBe(1.5);

    expect($scope.curves[0].jointa_position).toBe(1);
    expect($scope.curves[0].jointb_position).toBe(2);

    expect($scope.curves[0].jointa_velocity).toBe(4);
    expect($scope.curves[0].jointb_velocity).toBe(5);

    // effort is not a selected property
    expect($scope.curves[0].jointa_effort).toBeUndefined();
    expect($scope.curves[0].jointb_effort).toBeUndefined();

    expect($scope.curves[0].jointa).toBeUndefined();
    expect($scope.curves[0].jointb).toBeUndefined();

    expect($scope.curves[0].jointc_position).toBeUndefined();
    expect($scope.curves[0].jointc_velocity).toBeUndefined();
    expect($scope.curves[0].jointc_effort).toBeUndefined();
  });

  it('should update its lastPointTimestamp', function() {
    expect($scope.lastPointTimestamp).toBe(-Infinity);
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.lastPointTimestamp).toBe(1.5);
  });

  it('should not register 2 datapoints that are too close', function() {
    $scope.onNewJointMessageReceived(messageMock);
    $scope.onNewJointMessageReceived(messageMockClose);
    expect($scope.curves.length).toBe(1);
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

  it('should unsubscribe when stopJointDisplay is called', function () {
    $scope.jointTopicSubscriber = {unsubscribe: jasmine.createSpy('unsubscribe')};
    $scope.stopJointDisplay();
    expect($scope.jointTopicSubscriber.unsubscribe).toHaveBeenCalled();
  });


  it('should call the startJointDisplay function', function () {
    spyOn($scope, 'startJointDisplay');
    $scope.showJointPlot = true;
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
    expect($scope.curves[0].jointc_velocity).toBe(6);
    expect($scope.curves[0].jointc_effort).toBeUndefined();
  });

  it('should register new property', function () {
    expect($scope.curves.length).toBe(0);
    expect($scope.selectedProperties.effort).toBeFalsy();
    $scope.selectedProperties.effort = true;
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
    expect($scope.curveToColorIdx.jointa_velocity).toBe(2);
    expect($scope.curveToColorIdx.jointb_velocity).toBe(3);
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

  it('should pop datapoints when there are too many', function() {
    $scope.curves.length = 100;
    spyOn($scope.curves, 'shift');
    $scope.onNewJointMessageReceived(messageMock);
    expect($scope.curves.shift).toHaveBeenCalled();
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
