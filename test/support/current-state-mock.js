/**
 * Home of currentStateMockFactory service.
 */
angular
  .module('currentStateMockFactory', [])
  /**
 * Provides a mock for the current state service.
 * See environment-designer.js test for usage.
 */
  .factory('currentStateMockFactory', function() {
    'use strict';
    return {
      get: function() {
        var currentStateMock = {};
        var getCurrentStateSpy = jasmine.createSpy('getCurrentState');
        var setCurrentStateSpy = jasmine.createSpy('setCurrentState');
        var ensureStateBeforeExecutingSpy = jasmine.createSpy(
          'ensureStateBeforeExecuting'
        );
        var localCurrentState;

        getCurrentStateSpy.and.callFake(function() {
          return {
            then: function(f) {
              f();
            }
          };
        });

        setCurrentStateSpy.and.callFake(function(s) {
          localCurrentState = s;
          return {
            then: function(f) {
              f();
            },
            catch: function(f) {
              f();
            }
          };
        });

        ensureStateBeforeExecutingSpy.and.callFake(function(s, f) {
          localCurrentState = s;
          f();
        });

        return {
          stateService: {
            getCurrentState: getCurrentStateSpy,
            setCurrentState: setCurrentStateSpy,
            ensureStateBeforeExecuting: ensureStateBeforeExecutingSpy,
            currentState: localCurrentState
          }
        };
      }
    };
  });
