'use strict';

describe('Service: joint-service', function() {

  var rosLibConnectionObject = {
    subscribe: jasmine.createSpy('subscribe'),
    unsubscribe: jasmine.createSpy('unsubscribe')
  };

  var roslibMock = {
    getOrCreateConnectionTo: jasmine.createSpy('getOrCreateConnectionTo'),
    createTopic: jasmine.createSpy('createTopic').and.returnValue(rosLibConnectionObject)
  };

  var simulationInfoMock = {
    serverConfig: {
      rosbridge: {
        websocket: 'ws://localhost:1234'
      }
    }
  };

  beforeEach(module(function($provide) {
    $provide.value('roslib', roslibMock);
    $provide.value('simulationInfo', simulationInfoMock);
  }));

  beforeEach(module('jointPlotModule'));

  var jointService;
  beforeEach(inject(function(_jointService_) {
    jointService = _jointService_;
  }));

  it('should create a connection and subscribe', function() {

    roslibMock.getOrCreateConnectionTo.calls.reset();
    roslibMock.createTopic.calls.reset();
    rosLibConnectionObject.subscribe.calls.reset();

    var jointMessageCallback = jasmine.createSpy('jointMessageCallback');
    jointService.subscribe(jointMessageCallback);

    expect(roslibMock.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslibMock.createTopic).toHaveBeenCalled();
    expect(rosLibConnectionObject.subscribe).toHaveBeenCalled();

    expect(jointMessageCallback).not.toHaveBeenCalled();
    rosLibConnectionObject.subscribe.calls.first().args[0]({'header':{'stamp':{'secs':1000,'nsecs':0}}});
    expect(jointMessageCallback).toHaveBeenCalled();
  });

  it('should unsubscribe', function() {
    var unsubscribe = jointService.subscribe();
    expect(rosLibConnectionObject.unsubscribe).not.toHaveBeenCalled();
    unsubscribe();
    expect(rosLibConnectionObject.unsubscribe).toHaveBeenCalled();
  });
});
