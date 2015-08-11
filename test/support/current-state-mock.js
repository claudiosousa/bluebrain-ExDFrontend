/**
 * Home of currentStateMockFactory service.
 */
angular.module('currentStateMockFactory', [])

/**
 * Provides a mock for the current state service.
 * See environment-designer.js test for usage.
 */
  .factory('currentStateMockFactory', function () {
    'use strict';
    return {
      get: function () {
        var currentStateMock = {};
        var getCurrentStateSpy = jasmine.createSpy('getCurrentState');
        var setCurrentStateSpy = jasmine.createSpy('setCurrentState');
        var ensureStateBeforeExecutingSpy = jasmine.createSpy('ensureStateBeforeExecuting');
        var localCurrentState;

        getCurrentStateSpy.andCallFake(function () {
          return {
            then: function (f) {
              f();
            }
          };
        });

        setCurrentStateSpy.andCallFake(function (s) {
          localCurrentState = s;
          return {
            then: function (f) {
              f();
            },
            catch: function (f) {
              f();
            }
          };
        });

        ensureStateBeforeExecutingSpy.andCallFake(function (s, f) {
          localCurrentState = s;
          f();
        });

        return {
          'stateService': {
            getCurrentState: getCurrentStateSpy,
            setCurrentState: setCurrentStateSpy,
            ensureStateBeforeExecuting: ensureStateBeforeExecutingSpy,
            currentState: localCurrentState
          }
        }

      }
    };
  });
