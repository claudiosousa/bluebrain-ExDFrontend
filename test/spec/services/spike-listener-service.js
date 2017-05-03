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
        listenerMock.messages.push(message);
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
    spikeListenerService.startListening(listenerMock.onNewSpikesMessageReceived);

    expect(roslibMock.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslibMock.createTopic).toHaveBeenCalled();
    expect(roslibMock.createTopic().subscribeCount).toBe(1);
    spikeListenerService.stopListening(listenerMock.onNewSpikesMessageReceived);

  });


  it('should support unregister listener', function ()
  {
    spikeListenerService.startListening(listenerMock.onNewSpikesMessageReceived);
    spikeListenerService.stopListening(listenerMock.onNewSpikesMessageReceived);

    expect(roslibMock.createTopic().subscribeCount).toBe(0);
  });

  it('should support multiple time registration', function ()
  {
    spikeListenerService.startListening(listenerMock.onNewSpikesMessageReceived);
    spikeListenerService.startListening(listenerMock.onNewSpikesMessageReceived);
    expect(roslibMock.createTopic().subscribeCount).toBe(1);
  });

  it('should handle spike message', function ()
  {
    spikeListenerService.startListening(listenerMock.onNewSpikesMessageReceived);

    roslibMock.createTopic().onNewSpikesMessageReceived('test message');

    expect(listenerMock.messages.length).toBe(1);
  });

});



