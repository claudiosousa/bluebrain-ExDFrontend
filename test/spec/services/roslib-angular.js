'use strict';

describe('Services: roslib-angular', function () {

  var roslib;
  var testURL = 'ws://fu.bar:123';
  var tokenKey = 'tokens-test-client-id@https://services.humanbrainproject.eu/oidc';

  // Unfortunately we have to mock a global variable here.
  var mockedOn = jasmine.createSpy('on');
  window.ROSLIB = {
    Ros: jasmine.createSpy('Ros').andReturn({ on: mockedOn }),
    PhoenixRos: jasmine.createSpy('PhoenixRos').andReturn({ on: mockedOn }),
    Topic: jasmine.createSpy('Topic')
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(inject(function(_roslib_){
    roslib = _roslib_;
    mockedOn.reset();
    spyOn(console, 'log');
    spyOn(console, 'error');
    var mockToken = '[{"access_token":"mockaccesstoken","token_type":"Bearer","state":"mockstate","expires_in":"172799","id_token":"mockidtoken","expires":1432803024,"scopes":["openid"]}]';
    window.localStorage = {};
    window.localStorage.getItem = jasmine.createSpy('getItem').andReturn(mockToken);
  }));

  it('should create a connection if there is none for this URL currently', function() {
    roslib.getOrCreateConnectionTo(testURL);
    expect(localStorage.getItem).toHaveBeenCalledWith(tokenKey);
    expect(window.ROSLIB.PhoenixRos).toHaveBeenCalledWith({url: 'ws://fu.bar:123/?token=mockaccesstoken'});
  });

  it('should create a dummy token if localStorage token is malformed or absent', function() {
    window.localStorage.getItem.reset();
    window.ROSLIB.PhoenixRos.reset();
    window.localStorage.getItem = jasmine.createSpy('getItem').andReturn(undefined);
    roslib.getOrCreateConnectionTo(testURL);
    expect(localStorage.getItem).toHaveBeenCalledWith(tokenKey);
    expect(window.ROSLIB.PhoenixRos).toHaveBeenCalledWith({url: 'ws://fu.bar:123/?token=no-token'});
    window.localStorage.getItem.reset();
    window.localStorage.getItem = jasmine.createSpy('getItem').andReturn([{}]);
    roslib.getOrCreateConnectionTo(testURL);
    expect(localStorage.getItem).toHaveBeenCalledWith(tokenKey);
    expect(window.ROSLIB.PhoenixRos).toHaveBeenCalledWith({url: 'ws://fu.bar:123/?token=malformed-token'});
  });

  it('should not use token if in full local mode (user forced)', function() {
    window.localStorage.getItem.reset();
    window.ROSLIB.PhoenixRos.reset();
    window.bbpConfig.localmode.forceuser = true;
    roslib.getOrCreateConnectionTo(testURL);
    expect(localStorage.getItem).not.toHaveBeenCalled();
    expect(window.ROSLIB.PhoenixRos).toHaveBeenCalledWith({url: 'ws://fu.bar:123'});
    window.bbpConfig.localmode.forceuser = false;
  });

  it('should reuse an already existing connection', function () {
    var rosConnection1 = roslib.getOrCreateConnectionTo(testURL);
    var rosConnection2 = roslib.getOrCreateConnectionTo(testURL);
    expect(rosConnection1.close).toBe(rosConnection2.close);
  });

  it('should create a topic by calling the global ROSLIB.Topic', function() {
    roslib.createStringTopic({}, 'topic_name');
    expect(window.ROSLIB.Topic).toHaveBeenCalled();
  });

});
