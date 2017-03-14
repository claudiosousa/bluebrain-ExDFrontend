'use strict';

describe('Services: spike-listener-service', function ()
{
  var SERVER_URL = 'ws://localhost:1234';
  var spikeListenerService;

  var simulationInfoMock = {
    serverConfig: {
      rosbridge: {
        websocket: SERVER_URL
      }
    }
  };

  var returnedConnectionObject = {
    onNewSpikesMessageReceived:null,
    subscribeCount:0,
    subscribe: function(handler) {this.subscribeCount+=1;this.onNewSpikesMessageReceived=handler;},
    unsubscribe: function() {this.subscribeCount-=1;}
  };

  var roslibMock = {
    getOrCreateConnectionTo: jasmine.createSpy('getOrCreateConnectionTo').and.returnValue({}),
    createTopic: jasmine.createSpy('createTopic').and.returnValue(returnedConnectionObject)
  };

  var listenerMock = {

    messages: [],
    onNewSpikesMessageReceived: function (message)
    {
        this.messages.push(message);
    }
  };

  beforeEach(module('exdFrontendApp'));

  beforeEach(module(function ($provide)
  {
    $provide.value('roslib', roslibMock);
    $provide.value('simulationInfo', simulationInfoMock);
  }));


  beforeEach(inject(function (_spikeListenerService_)
  {
    spikeListenerService = _spikeListenerService_;
  }));

  it('should support register listener', function ()
  {
    spikeListenerService.startListening(listenerMock);

    expect(roslibMock.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslibMock.createTopic).toHaveBeenCalled();
    expect(roslibMock.createTopic().subscribeCount).toBe(1);
    spikeListenerService.stopListening(listenerMock);

  });


  it('should support unregister listener', function ()
  {
    spikeListenerService.startListening(listenerMock);
    spikeListenerService.stopListening(listenerMock);

    expect(roslibMock.createTopic().subscribeCount).toBe(0);
  });

  it('should support multiple time registration', function ()
  {
    spikeListenerService.startListening(listenerMock);
    spikeListenerService.startListening(listenerMock);
    expect(roslibMock.createTopic().subscribeCount).toBe(1);
  });

  it('should handle spike message', function ()
  {
    spikeListenerService.startListening(listenerMock);

    roslibMock.createTopic().onNewSpikesMessageReceived('test message');

    expect(listenerMock.messages.length).toBe(1);
  });

});



