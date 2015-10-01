'use strict';

describe('Directive: smachEditor', function () {

  var VIEW = 'views/esv/smach-editor.html';

  var $rootScope,
    $compile,
    $httpBackend,
    $scope,
    isolateScope,
    element,
    backendInterfaceService,
    pythonCodeHelper,
    ScriptObject,
    stateMachines;

  var backendInterfaceServiceMock = {
    getStateMachines: jasmine.createSpy('getStateMachines'),
    setStateMachine: jasmine.createSpy('setStateMachine'),
    deleteStateMachine: jasmine.createSpy('deleteStateMachine')
  };

  var documentationURLsMock =
  {
    getDocumentationURLs: function() {
      return {
        then: function(callback) {
          return callback({
            cleDocumentationURL: 'cleDocumentationURL',
            backendDocumentationURL: 'backendDocumentationURL'
          });
        }
      };
    }
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('documentationURLs', documentationURLsMock);
  }));

  beforeEach(inject(function (_$rootScope_,
                              _$httpBackend_,
                              _$compile_,
                              _backendInterfaceService_,
                              $templateCache,
                              _pythonCodeHelper_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $httpBackend = _$httpBackend_;
    $httpBackend.whenGET(VIEW).respond('');
    $templateCache.put(VIEW, '');
    backendInterfaceService = _backendInterfaceService_;
    pythonCodeHelper = _pythonCodeHelper_;
    ScriptObject = pythonCodeHelper.ScriptObject;
    $scope = $rootScope.$new();
    $scope.control = {};
    element = $compile('<smach-editor control="control"/>')($scope);
    $scope.$digest();
    isolateScope = element.isolateScope();
    stateMachines = isolateScope.stateMachines;
  }));

  it('should init the stateMachines variable', function () {
    $scope.control.refresh();
    expect(isolateScope.stateMachines).toEqual([]);
    expect(backendInterfaceService.getStateMachines).toHaveBeenCalled();
    expect(isolateScope.backendDocumentationURL).toEqual('backendDocumentationURL');
  });

  describe('Retrieving, saving and deleting stateMachines', function () {
      var response = {data: {SM3: 'Code of SM3', SM2: 'Code of SM2', SM1: 'Code of SM1'}};
      var expected = [];
      var sm1, sm2, sm3;

      beforeEach(function(){
        $scope.control.refresh();
        sm1 = new ScriptObject('SM1', 'Code of SM1');
        sm2 = new ScriptObject('SM2', 'Code of SM2');
        sm3 = new ScriptObject('SM3', 'Code of SM3');
        expected = [sm1, sm2, sm3];
        isolateScope.stateMachines = angular.copy(expected);
        stateMachines = isolateScope.stateMachines;
      });

      it('should handle the retrieved stateMachines properly', function () {
        backendInterfaceService.getStateMachines.mostRecentCall.args[0](response);
        expect(_.findIndex(stateMachines, sm1)).not.toBe(-1);
        expect(_.findIndex(stateMachines, sm2)).not.toBe(-1);
        expect(_.findIndex(stateMachines, sm3)).not.toBe(-1);
        expect(stateMachines.length).toBe(3);
        // This order is not guaranteed. Still, keys are printed in insertion order on all major browsers
        // See http://stackoverflow.com/questions/5525795/does-javascript-guarantee-object-property-order
        expect(stateMachines).toEqual(expected);
      });

      it('should test the update function', function() {
        var sm = new ScriptObject('SM', 'Code of SM');
        isolateScope.stateMachines = [sm];
        isolateScope.update(sm);
        expect(backendInterfaceService.setStateMachine).toHaveBeenCalledWith(sm.id, sm.code, jasmine.any(Function));
        sm.dirty = true;
        sm.local = true;
        backendInterfaceService.setStateMachine.mostRecentCall.args[2]();
        expect(sm.dirty).toEqual(false);
        expect(sm.local).toEqual(false);
      });

      it('should delete a state machine properly', function() {
        var sm1 = stateMachines[0];
        isolateScope.delete(sm1);
        expect(backendInterfaceService.deleteStateMachine).toHaveBeenCalledWith('SM1', jasmine.any(Function));
        backendInterfaceService.deleteStateMachine.mostRecentCall.args[1]();
        expect(stateMachines.indexOf(sm1)).toBe(-1);

        var sm2 = stateMachines[0];
        sm2.local = true;
        isolateScope.delete(sm2);
        expect(stateMachines.indexOf(sm2)).toBe(-1);
        // Since the state machine is local, we should not call back the server
        expect(backendInterfaceService.deleteStateMachine).not.toHaveBeenCalledWith('SM2', jasmine.any(Function));
    });
  });

  describe('Editing state machines', function () {

      it('should create state machines properly', function() {
        var numberOfNewStateMachines = 3;
        for (var i = 0; i < numberOfNewStateMachines; ++i) {
          isolateScope.create();
        }
        var n = numberOfNewStateMachines - 1;
        var sm = stateMachines[0];
        expect(sm.id).toEqual('statemachine_' + n);
        expect(sm.code).toContain('import smach_ros');
        expect(sm.code).toContain('import DefaultStateMachine');
        expect(sm.code).toContain('def populate():\n');
        expect(sm.code).toContain('(DefaultStateMachine)');
      });

      it('should update script flags properly when editing the state machine code', function() {
        var smCode = 'class(MyStateMachine):\n    def populate():\n        return None';
        var smCodeNewCode = 'class(MyStateMachine):\n    def populate():\n        return []';
        stateMachines[0] = {code: smCode, dirty: false, local: false, id: 'sm'};
        var sm = stateMachines[0];
        sm.code = smCodeNewCode;
        isolateScope.onStateMachineChange(sm);
        expect(stateMachines).toEqual(
          [
            { code: smCodeNewCode, dirty: true, local: false, id: 'sm'}
          ]);
      });

    });

});
