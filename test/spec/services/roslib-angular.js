'use strict';

describe('Services: roslib-angular', function () {

  var roslib;
  var testURL = 'ws://fu.bar:123';
  var tokenKey = 'tokens-test-client-id@https://services.humanbrainproject.eu/oidc';

  // Unfortunately we have to mock a global variable here.
  var mockedOn = jasmine.createSpy('on');
  window.ROSLIB = {
    Ros : jasmine.createSpy('Ros').andReturn({on: mockedOn}),
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
    expect(window.ROSLIB.Ros).toHaveBeenCalledWith({url: 'ws://fu.bar:123/?token=mockaccesstoken'});
    expect(mockedOn).toHaveBeenCalled();
    expect(mockedOn.callCount).toBe(3);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should create a dummy token if localStorage token is malformed or absent', function() {
    window.localStorage.getItem.reset();
    window.ROSLIB.Ros.reset();
    window.localStorage.getItem = jasmine.createSpy('getItem').andReturn(undefined);
    roslib.getOrCreateConnectionTo(testURL);
    expect(localStorage.getItem).toHaveBeenCalledWith(tokenKey);
    expect(window.ROSLIB.Ros).toHaveBeenCalledWith({url: 'ws://fu.bar:123/?token=no-token'});
    window.localStorage.getItem.reset();
    window.localStorage.getItem = jasmine.createSpy('getItem').andReturn([{}]);
    roslib.getOrCreateConnectionTo(testURL);
    expect(localStorage.getItem).toHaveBeenCalledWith(tokenKey);
    expect(window.ROSLIB.Ros).toHaveBeenCalledWith({url: 'ws://fu.bar:123/?token=malformed-token'});
  });

  it('should not use token if in full local mode (user forced)', function() {
    window.localStorage.getItem.reset();
    window.ROSLIB.Ros.reset();
    window.bbpConfig.localmode.forceuser = true;
    roslib.getOrCreateConnectionTo(testURL);
    expect(localStorage.getItem).not.toHaveBeenCalled();
    expect(window.ROSLIB.Ros).toHaveBeenCalledWith({url: 'ws://fu.bar:123'});
    window.bbpConfig.localmode.forceuser = false;
  });

  it('should reuse an already existing connection', function () {
    var rosConnection1 = roslib.getOrCreateConnectionTo(testURL);
    var rosConnection2 = roslib.getOrCreateConnectionTo(testURL);
    expect(console.log).toHaveBeenCalled();
    expect(rosConnection1).toBe(rosConnection2);
  });

  it('should log on success, error and close', function(){
    roslib.getOrCreateConnectionTo(testURL);
    // call the three registered on(...) calls
    for(var i=0; i<3; i++) {
      mockedOn.argsForCall[i][1]();
    }
    // on successful connection and on close we expect a call to console.log
    expect(console.log.callCount).toBe(2);
    // in the on error case we have call to console.error
    expect(console.error.callCount).toBe(1);
  });

  it('should create a topic by calling the global ROSLIB.Topic', function() {
    roslib.createStringTopic({}, 'topic_name');
    expect(window.ROSLIB.Topic).toHaveBeenCalled();
  });

});
