(function(){
  'use strict';

  angular.module('stateServiceMock', [])
  .service('stateService', function() {

    var getCurrentStateSpy = jasmine.createSpy('getCurrentState');
    var setCurrentStateSpy = jasmine.createSpy('setCurrentState');
    var ensureStateBeforeExecutingSpy = jasmine.createSpy('ensureStateBeforeExecuting').and.callFake(function(STATE, fn) {
      fn();
    });
    var getThenSpy = jasmine.createSpy('then');
    var setThenSpy = jasmine.createSpy('then');
    var setCatchSpy = jasmine.createSpy('catch');
    var localCurrentState;
    var localStatePending = false;

    getCurrentStateSpy.and.callFake(function () {
      return { then: getThenSpy.and.callFake(function (f) { f(); }) };
    });

    setCurrentStateSpy.and.callFake(function (s) {
      localCurrentState = s;
      return {
        then: setThenSpy.and.callFake(function (f) { f(); }).
        and.returnValue({ catch: function (f) { f(); } }),
        catch: setCatchSpy.and.callFake(function (f) { f(); })
      };
    });

    this.Initialize = jasmine.createSpy('Initialize');
    this.startListeningForStatusInformation = jasmine.createSpy('startListeningForStatusInformation');
    this.stopListeningForStatusInformation = jasmine.createSpy('stopListeningForStatusInformation');
    this.addStateCallback = jasmine.createSpy('addStateCallback');
    this.removeStateCallback = jasmine.createSpy('removeStateCallback');
    this.addMessageCallback = jasmine.createSpy('addMessageCallback');
    this.removeMessageCallback = jasmine.createSpy('removeMessageCallback');
    this.getCurrentState = getCurrentStateSpy;
    this.setCurrentState = setCurrentStateSpy;
    this.ensureStateBeforeExecuting = ensureStateBeforeExecutingSpy;
    this.currentState = localCurrentState;
    this.statePending = localStatePending;

  });
}());
