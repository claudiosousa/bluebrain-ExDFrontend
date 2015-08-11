'use strict';

describe('Services: simulation state', function () {
  var simulationStateSpy;
  var updateSpy = jasmine.createSpy('update');
  var stateSpy = jasmine.createSpy('state');
  var stateService, q;


  beforeEach(module('exdFrontendApp'));
  beforeEach(module('simulationStateServices'));

  beforeEach(module('simulationControlServices', function ($provide) {
    $provide.decorator('simulationState', function () {
      simulationStateSpy = jasmine.createSpy('simulationState');
      return simulationStateSpy;
    });
  }));

  beforeEach(module('gz3dServices'));
  beforeEach(module(function ($provide) {
    $provide.value('$stateParams',
      {
        serverID : 'bbpce016',
        simulationID : 'mocked_simulation_id'
      }
    );
    $provide.value('bbpConfig', {
      get: jasmine.createSpy('get').andReturn(
        {
          'bbpce016': {
            gzweb: {
              assets: 'mock_assets',
              websocket: 'mock_websocket'
            }
          }
        }
      )
    });
  }));

  beforeEach(inject(function (_stateService_, $q) {
    stateService = _stateService_;
    q = $q;
  }));

  it('should call state when getting and update when setting', function () {
    stateSpy.callCount = 0;
    updateSpy.callCount = 0;
    simulationStateSpy.andCallFake(function (s) {
      /* jshint unused:false */
      return {
        state: stateSpy,
        update: updateSpy
      };
    });

    stateService.getCurrentState();
    expect(stateSpy.callCount).toBe(1);

    stateService.setCurrentState('PAUSED');
    expect(updateSpy.callCount).toBe(1);
  });

  it('should change the state when calling ensureStateBeforeExecuting', function () {
    var myOwnFunction = jasmine.createSpy('myOwnFunction');
    stateService.currentState = 'STARTED';
    stateService.ensureStateBeforeExecuting('STARTED', myOwnFunction);
    expect(myOwnFunction.callCount).toEqual(1);
  });

  it('should set current state when query for the state', function() {
    var stateTestSpy = function (parameters, success) {
      success({'state':'FAKE_STATE_123'});
    };

    simulationStateSpy.andCallFake(function (s) {
      /* jshint unused:false */
      return {
        state: stateTestSpy,
        update: updateSpy
      };
    });
    stateService.getCurrentState();
    expect(stateService.currentState).toEqual('FAKE_STATE_123');
  });

  it('should not set current state when query for the state output an error', function() {
    var stateTestSpy = function (parameters, success, error) {
      error({'state':'FAKE_STATE_123'});
    };

    simulationStateSpy.andCallFake(function (s) {
      /* jshint unused:false */
      return {
        state: stateTestSpy,
        update: updateSpy
      };
    });
    stateService.getCurrentState();
    expect(stateService.currentState).not.toEqual('FAKE_STATE_123');
  });

  it('should set current state when updating it', function() {
    var updateTestSpy = function (parameters, nextParameters,  success) {
      success({'state':nextParameters.state});
    };
    simulationStateSpy.andCallFake(function (s) {
      /* jshint unused:false */
      return {
        state: stateSpy,
        update: updateTestSpy
      };
    });
    stateService.setCurrentState('ANOTHER_INCREDIBLE_STATE');
    expect(stateService.currentState).toEqual('ANOTHER_INCREDIBLE_STATE');
  });

  it('should not set current state when updating it throws an error', function() {
    var updateTestSpy = function (parameters, nextParameters,  success, error) {
      error({'state':nextParameters.state});
    };
    simulationStateSpy.andCallFake(function (s) {
      /* jshint unused:false */
      return {
        state: stateSpy,
        update: updateTestSpy
      };
    });
    stateService.setCurrentState('ANOTHER_INCREDIBLE_STATE');
    expect(stateService.currentState).not.toEqual('ANOTHER_INCREDIBLE_STATE');
  });
});
