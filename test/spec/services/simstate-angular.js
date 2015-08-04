'use strict';

describe('Services: simulation state', function () {
  var simulationStateSpy;
  var updateSpy = jasmine.createSpy('update');
  var stateSpy = jasmine.createSpy('state');
  var stateService;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('simulationStateServices'));

  beforeEach(module('simulationControlServices', function ($provide) {
    $provide.decorator('simulationState', function () {
      simulationStateSpy = jasmine.createSpy('simulationState');
      return simulationStateSpy.andCallThrough();
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

  beforeEach(inject(function (_stateService_) {
    stateService = _stateService_;
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

});
