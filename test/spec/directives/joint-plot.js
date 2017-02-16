(function () {
'use strict';

describe('Directive: joint-plot', function () {
  /*jshint camelcase: false */

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var $scope, parentscope, element, roslib, simulationInfo, bbpConfig, window, RESET_TYPE;
  var SERVER_URL = 'ws://localhost:1234';
  var JOINT_TOPIC = '/joint_states';

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
  roslibMock.getOrCreateConnectionTo = jasmine.createSpy('getOrCreateConnectionTo').and.returnValue({});
  roslibMock.createTopic = jasmine.createSpy('createTopic').and.returnValue(returnedConnectionObject);

  var simulationInfoMock = {
    serverConfig: {
      rosbridge: {
        websocket: SERVER_URL
      }
    }
  };

  beforeEach(module(function ($provide) {
    $provide.value('roslib', roslibMock);
    $provide.value('simulationInfo', simulationInfoMock);
  }));

  beforeEach(inject(function ($rootScope, $compile, $window, _roslib_, _RESET_TYPE_, _simulationInfo_, _bbpConfig_) {
    parentscope = $rootScope.$new();
    parentscope.showJointPlot = true;
    element = $compile('<joint-plot></joint-plot>')(parentscope);
    parentscope.$digest();

    $scope = element.scope();
    roslib = _roslib_;
    simulationInfo = _simulationInfo_;
    bbpConfig = _bbpConfig_;
    window = $window;
    $scope.selectedJoints = {
      jointa: true,
      jointb: true,
      jointc: false
    };
    $scope.selectedProperty = { name: 'position' };
    RESET_TYPE = _RESET_TYPE_;
  }));

  it('should set websocket url and joint topic correctly', function () {
    // Compile a piece of HTML containing the directive
    expect($scope.server).toBe(SERVER_URL);
    expect($scope.jointTopic).toBe(JOINT_TOPIC);
  });

  it('should clear the plot on RESET event', function () {
      spyOn($scope, 'clearPlot').and.callThrough();

      $scope.$broadcast('RESET', RESET_TYPE.RESET_FULL);
      $scope.$digest();

      expect($scope.clearPlot).toHaveBeenCalled();
  });

    it('should NOT clear the plot on RESET event: RESET_CAMERA_VIEW', function () {
      spyOn($scope, 'clearPlot').and.callThrough();

      $scope.$broadcast('RESET', RESET_TYPE.RESET_CAMERA_VIEW);
      $scope.$digest();

      expect($scope.clearPlot).not.toHaveBeenCalled();
  });

  it('should remove the RESET event callback on $destroy event', function () {
    spyOn($scope, 'resetListenerUnbindHandler').and.callThrough();
    $scope.$broadcast('$destroy');
    $scope.$digest();
    expect($scope.resetListenerUnbindHandler).toHaveBeenCalled();
  });

  function checkSeriesVisibility(){
    $scope.plotOptions.series.forEach(function (serie) {
      expect(serie.visible).toBe($scope.selectedJoints[serie.joint] && serie.prop === $scope.selectedProperty.name);
    });
  }

  it('should register selected curves properly', function() {
    $scope.onNewJointMessageReceived(messageMock);

    expect($scope.curves.jointa_position[0].time).toBe(1.5);

    //test values
    messageMock.name.forEach(function (jointName, iJoint) {
      ['position', 'velocity', 'effort'].forEach(function (propName) {
        expect($scope.curves[jointName + '_' + propName][0].y).toBe(messageMock[propName][iJoint]);
      });
    });

    //test visibility
    checkSeriesVisibility();
  });

  it('should register 2 datapoints that are sufficiently far in time', function() {
    $scope.onNewJointMessageReceived(messageMock);
    $scope.onNewJointMessageReceived(messageMockFar);
    expect($scope.curves.jointa_position.length).toBe(2);
  });

  it('should connect to roslib when calling startJointDisplay', function () {
    roslibMock.getOrCreateConnectionTo.calls.reset();
    roslibMock.createTopic.calls.reset();
    returnedConnectionObject.subscribe.calls.reset();

    $scope.jointTopicSubscriber = undefined;
    $scope.startJointDisplay();

    expect(roslibMock.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslibMock.createTopic).toHaveBeenCalled();
    expect(returnedConnectionObject.subscribe).toHaveBeenCalled();
  });

  it('should hide on resize begin', function() {
    expect(element.hasClass('resizing')).toBe(false);
    $scope.onResizeBegin();
    expect(element.hasClass('resizing')).toBe(true);
  });

  it('should show on resize end', inject(function($timeout) {
    $scope.onResizeBegin();
    expect(element.hasClass('resizing')).toBe(true);
    $scope.onResizeEnd();
    $timeout.flush();
    expect(element.hasClass('resizing')).toBe(false);
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

  it('should make new joint visible', function () {
    $scope.selectedJoints.jointc = true;
    checkSeriesVisibility();
  });

  it('should make new property visible', function () {
    $scope.selectedProperty.name = 'effort';
    checkSeriesVisibility();
  });

  it('should color series per joint name', function () {
    $scope.onNewJointMessageReceived(messageMock);
    var colorScale = d3.scale.category10();

    $scope.plotOptions.series.forEach(function (serie) {
      expect(serie.color).toBe(colorScale($scope.allJoints.indexOf(serie.joint)));
    });
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
    expect($scope.curves.jointa_position.length).toBe(1);
    $scope.onNewJointMessageReceived(messageMockReallyFar2);
    expect($scope.curves.jointa_position.length).toBe(2);
  });

});

describe('Directive: joint-plot (missing necessary attributes)', function () {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates')); // import html template

  var element;
  var $log;
  var $scope;
  var simulationInfo, bbpConfig;

  var logMock = {error: jasmine.createSpy('error')};

  var simulationInfoMock = {
    serverConfig: {
      rosbridge: {
        websocket: ''
      }
    }
  };

  beforeEach(module(function ($provide) {
    $provide.value('$log', logMock);
    $provide.value('simulationInfo', simulationInfoMock);
  }));

  beforeEach(inject(function ($rootScope, $compile, _$log_, _simulationInfo_, _bbpConfig_) {
    $scope = $rootScope.$new();
    simulationInfo = _simulationInfo_;
    bbpConfig = _bbpConfig_;
    bbpConfig.get('ros-topics').joint = '';
    element = $compile('<joint-plot></joint-plot>')($scope);
    $scope.$digest();
    $log = _$log_;
  }));

  it('should log to error in case we have left out necessary attributes', function() {
    expect($log.error).toHaveBeenCalledWith('The server property was not specified!');
    expect($log.error).toHaveBeenCalledWith('The jointTopic property was not specified!');
  });

});
}());
