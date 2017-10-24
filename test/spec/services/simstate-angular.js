'use strict';

describe('Services: simulation state', function() {
  var simulationStateSpy;
  var updateSpy, stateSpy;
  var stateService, q, httpBackend, STATE, roslib;

  var rosConnectionObject = {
    close: jasmine.createSpy('close'),
    disableRebirth: angular.noop
  };
  var returnedRosConnectionObject = {
    unsubscribe: jasmine.createSpy('unsubscribe'),
    removeAllListeners: jasmine.createSpy('removeAllListeners'),
    subscribe: jasmine.createSpy('subscribe')
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('simulationStateServices'));

  beforeEach(
    module('simulationControlServices', function($provide) {
      $provide.decorator('simulationState', function() {
        simulationStateSpy = jasmine.createSpy('simulationState');
        return simulationStateSpy.and.callFake(function(s) {
          return {
            state: stateSpy,
            update: updateSpy
          };
        });
      });
    })
  );

  beforeEach(module('gz3dModule'));
  beforeEach(module('exd.templates'));
  beforeEach(
    module(function($provide) {
      // Mock RosLib
      var roslibMock = {
        getOrCreateConnectionTo: jasmine
          .createSpy('getOrCreateConnectionTo')
          .and.returnValue(rosConnectionObject),
        createStringTopic: jasmine
          .createSpy('createStringTopic')
          .and.returnValue(returnedRosConnectionObject),
        createTopic: jasmine
          .createSpy('createTopic')
          .and.returnValue(returnedRosConnectionObject)
      };
      $provide.value('roslib', roslibMock);
      returnedRosConnectionObject.unsubscribe.calls.reset();
      returnedRosConnectionObject.removeAllListeners.calls.reset();
      returnedRosConnectionObject.subscribe.calls.reset();
      rosConnectionObject.close.calls.reset();
      var rosbridge = {
        topics: {
          spikes: '/mock_spike_topic',
          status: '/mock_status_topic'
        },
        websocket: 'wss://mock_ws_url'
      };
      var simulationInfo = {
        serverID: 'bbpce016',
        simulationID: 'mocked_simulation_id',
        serverConfig: { rosbridge: rosbridge },
        Initialize: jasmine.createSpy('Initialize')
      };
      $provide.value('simulationInfo', simulationInfo);
      $provide.value('bbpConfig', {
        get: jasmine.createSpy('get').and.returnValue({
          bbpce016: {
            gzweb: {
              assets: 'mock_assets',
              'nrp-services': 'http://some-url',
              websocket: 'mock_websocket'
            },
            rosbridge: rosbridge
          }
        })
      });
    })
  );

  beforeEach(
    inject(function(_stateService_, $q, _$httpBackend_, _STATE_, _roslib_) {
      stateService = _stateService_;
      q = $q;
      httpBackend = _$httpBackend_;
      STATE = _STATE_;
      roslib = _roslib_;

      // create mock for console
      spyOn(console, 'error');

      updateSpy = jasmine.createSpy('update');
      stateSpy = jasmine.createSpy('state');
    })
  );

  it('should init the simstate service', function() {
    stateService.statePending = true;
    stateService.Initialize();
    expect(stateService.statePending).toBe(false);
  });

  it('should test registerForStatusInformation', function() {
    stateService.Initialize();
    stateService.startListeningForStatusInformation();
    expect(roslib.getOrCreateConnectionTo).toHaveBeenCalled();
    expect(roslib.createStringTopic).toHaveBeenCalled();
    expect(returnedRosConnectionObject.subscribe).toHaveBeenCalled();
  });

  it('should unregister on stopListeningForStatusInformation', function() {
    stateService.Initialize();
    stateService.startListeningForStatusInformation();
    returnedRosConnectionObject.unsubscribe.calls.reset();
    returnedRosConnectionObject.removeAllListeners.calls.reset();
    rosConnectionObject.close.calls.reset();

    stateService.stopListeningForStatusInformation();
    expect(returnedRosConnectionObject.unsubscribe).toHaveBeenCalled();
    expect(returnedRosConnectionObject.removeAllListeners).toHaveBeenCalled();
    expect(rosConnectionObject.close).toHaveBeenCalled();

    // nothing is called a second time
    returnedRosConnectionObject.unsubscribe.calls.reset();
    returnedRosConnectionObject.removeAllListeners.calls.reset();
    rosConnectionObject.close.calls.reset();
    stateService.stopListeningForStatusInformation();
    expect(returnedRosConnectionObject.unsubscribe).not.toHaveBeenCalled();
    expect(
      returnedRosConnectionObject.removeAllListeners
    ).not.toHaveBeenCalled();
    expect(rosConnectionObject.close).not.toHaveBeenCalled();
  });

  it('should call the registered callback methods', function() {
    var stateCallback = jasmine.createSpy('stateCallback');
    var messageCallback = jasmine.createSpy('messageCallback');
    stateService.Initialize();
    stateService.startListeningForStatusInformation();
    var messageReceivedFunction = returnedRosConnectionObject.subscribe.calls.mostRecent()
      .args[0];
    stateService.addStateCallback(stateCallback);
    stateService.addMessageCallback(messageCallback);

    //the registered callback is called
    stateService.currentState = STATE.STARTED;
    messageReceivedFunction({ data: '{"state": "' + STATE.STOPPED + '"}' });
    expect(stateService.currentState).toBe(STATE.STOPPED);
    expect(stateCallback).toHaveBeenCalledWith(STATE.STOPPED);
    expect(messageCallback).toHaveBeenCalledWith({ state: STATE.STOPPED });

    stateCallback.calls.reset();
    messageCallback.calls.reset();

    //nothing is called when the state is the same
    stateService.currentState = STATE.STARTED;
    messageReceivedFunction({ data: '{"state": "' + STATE.STARTED + '"}' });
    expect(stateService.currentState).toBe(STATE.STARTED);
    expect(stateCallback).not.toHaveBeenCalled();

    stateCallback.calls.reset();
    messageCallback.calls.reset();

    //stateCallback is not called when there is no state
    stateService.currentState = STATE.STARTED;
    messageReceivedFunction({ data: '{}' });
    expect(stateService.currentState).toBe(STATE.STARTED);
    expect(stateCallback).not.toHaveBeenCalled();
    expect(messageCallback).toHaveBeenCalled();

    stateCallback.calls.reset();
    messageCallback.calls.reset();

    //an error is logged when there is no valid JSON message
    messageReceivedFunction({ data: '' });
    expect(console.error).toHaveBeenCalled();

    stateCallback.calls.reset();
    messageCallback.calls.reset();

    //after unregister, nothing is called
    stateService.removeStateCallback(stateCallback);
    stateService.removeMessageCallback(messageCallback);
    messageReceivedFunction({ data: '{"state": "' + STATE.PAUSED + '"}' });
    expect(stateService.currentState).toBe(STATE.PAUSED);
    expect(stateCallback).not.toHaveBeenCalled();
    expect(messageCallback).not.toHaveBeenCalled();

    stateCallback.calls.reset();
    messageCallback.calls.reset();

    //don't call undefined callbacks
    stateService.addStateCallback(undefined);
    stateService.addMessageCallback(undefined);
    stateService.currentState = STATE.STARTED;
    console.error.calls.reset();
    messageReceivedFunction({ data: '{"state": "' + STATE.PAUSED + '"}' });
    expect(stateService.currentState).toBe(STATE.PAUSED);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should call "state" when getting', function() {
    stateService.getCurrentState();
    expect(stateSpy).toHaveBeenCalled();
  });

  it('should call "update" when setting', function() {
    stateService.setCurrentState(STATE.STARTED);
    expect(updateSpy).toHaveBeenCalled();
  });

  it('should avoid duplicate update requests', function() {
    simulationStateSpy.calls.reset();
    stateService.statePending = true;
    stateService.currentState = STATE.INITIALIZED;
    stateService.setCurrentState(STATE.PAUSED);
    expect(simulationStateSpy).not.toHaveBeenCalled();

    simulationStateSpy.calls.reset();
    stateService.statePending = true;
    stateService.currentState = STATE.INITIALIZED;
    stateService.setCurrentState(STATE.PAUSED);
    expect(simulationStateSpy).not.toHaveBeenCalled();

    simulationStateSpy.calls.reset();
    stateService.statePending = false;
    stateService.currentState = STATE.PAUSED;
    stateService.setCurrentState(STATE.PAUSED);
    expect(simulationStateSpy).not.toHaveBeenCalled();
  });

  it('should ensure the state when calling ensureStateBeforeExecuting', function() {
    var myOwnFunction = jasmine.createSpy('myOwnFunction');
    //Create mock for the already tested function
    stateService.setCurrentState = jasmine
      .createSpy('setCurrentState')
      .and.returnValue({
        then: function(f) {
          return f();
        }
      });
    stateService.currentState = STATE.STARTED;
    stateService.ensureStateBeforeExecuting(STATE.STARTED, myOwnFunction);
    expect(myOwnFunction).toHaveBeenCalled();

    myOwnFunction.calls.reset();
    stateService.currentState = STATE.STARTED;
    stateService.ensureStateBeforeExecuting(STATE.STOPPED, myOwnFunction);
    expect(stateService.setCurrentState).toHaveBeenCalledWith(STATE.STOPPED);
    expect(myOwnFunction).toHaveBeenCalled();
  });

  it('should set current state when query for the state', function() {
    var stateTestSpy = function(parameters, success) {
      success({ state: 'FAKE_STATE_123' });
    };

    simulationStateSpy.and.callFake(function(s) {
      return {
        state: stateTestSpy,
        update: updateSpy
      };
    });
    stateService.getCurrentState();
    expect(stateService.currentState).toEqual('FAKE_STATE_123');
  });

  it('should not set current state when query for the state output an error', function() {
    var stateTestSpy = function(parameters, success, error) {
      error({ state: 'FAKE_STATE_123' });
    };

    simulationStateSpy.and.callFake(function(s) {
      return {
        state: stateTestSpy,
        update: updateSpy
      };
    });
    stateService.getCurrentState();
    expect(stateService.currentState).not.toEqual('FAKE_STATE_123');
  });

  it('should set current state when updating it', function() {
    var updateTestSpy = function(parameters, nextParameters, success) {
      success({ state: nextParameters.state });
    };
    simulationStateSpy.and.callFake(function(s) {
      return {
        state: stateSpy,
        update: updateTestSpy
      };
    });
    stateService.setCurrentState('ANOTHER_INCREDIBLE_STATE');
    expect(stateService.currentState).toEqual('ANOTHER_INCREDIBLE_STATE');
  });

  it('should not set current state when updating it throws an error', function() {
    var updateTestSpy = function(parameters, nextParameters, success, error) {
      error({ state: nextParameters.state });
    };
    simulationStateSpy.and.callFake(function(s) {
      return {
        state: stateSpy,
        update: updateTestSpy
      };
    });
    stateService.setCurrentState('ANOTHER_INCREDIBLE_STATE');
    expect(stateService.currentState).not.toEqual('ANOTHER_INCREDIBLE_STATE');
  });
});
