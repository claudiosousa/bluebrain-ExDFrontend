'use strict';

describe('Services: roslib-angular', function () {

  var roslib;
  var testURL = 'ws://fu.bar:123';

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
  }));

  it('should create a connection if there is none for this URL currently', function() {
    roslib.getOrCreateConnectionTo(testURL);
    expect(window.ROSLIB.Ros).toHaveBeenCalled();
    expect(mockedOn).toHaveBeenCalled();
    expect(mockedOn.callCount).toBe(3);
    expect(console.log).not.toHaveBeenCalled();
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
