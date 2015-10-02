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
    stateMachines,
    $timeout;

  var backendInterfaceServiceMock = {
    getStateMachines: jasmine.createSpy('getStateMachines'),
    setStateMachine: jasmine.createSpy('setStateMachine'),
    deleteStateMachine: jasmine.createSpy('deleteStateMachine'),
    getServerBaseUrl: jasmine.createSpy('getServerBaseUrl')
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
  beforeEach(module('exd.templates')); // import html template
  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('documentationURLs', documentationURLsMock);
  }));

  beforeEach(inject(function (_$rootScope_,
                              _$httpBackend_,
                              _$compile_,
                              _backendInterfaceService_,
                              $templateCache,
                              _pythonCodeHelper_,
                              _$timeout_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $compile = _$compile_;
    backendInterfaceService = _backendInterfaceService_;
    pythonCodeHelper = _pythonCodeHelper_;
    ScriptObject = pythonCodeHelper.ScriptObject;
    $timeout = _$timeout_;

    $scope = $rootScope.$new();
    $templateCache.put(VIEW, '');
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
      var data = {};
      for (var i = 0; i < 3; ++i) {
        var smId = 'SM' + i;
        data[smId] = 'class ' + smId + '(DefaultStateMachine):\n';
      }
      var response = {data: data};
      var expected = [];

      beforeEach(function(){
        $scope.control.refresh();
        for (var i = 0; i < 3; ++i) {
          var smId = 'SM' + i;
          var sm = new ScriptObject(smId, data[smId]);
          sm.name = isolateScope.getStateMachinePythonClassName(data[smId]);
          expected.push(sm);
        }
        isolateScope.stateMachines = angular.copy(expected);
        stateMachines = isolateScope.stateMachines;
      });

      it('should handle the retrieved stateMachines properly', function () {
        backendInterfaceService.getStateMachines.mostRecentCall.args[0](response);
        expect(_.findIndex(stateMachines, expected[0])).not.toBe(-1);
        expect(_.findIndex(stateMachines, expected[1])).not.toBe(-1);
        expect(_.findIndex(stateMachines, expected[2])).not.toBe(-1);
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
        var sm0 = stateMachines[0];
        isolateScope.delete(sm0);
        expect(backendInterfaceService.deleteStateMachine).toHaveBeenCalledWith('SM0', jasmine.any(Function));
        backendInterfaceService.deleteStateMachine.mostRecentCall.args[1]();
        expect(stateMachines.indexOf(sm0)).toBe(-1);

        var sm1 = stateMachines[0];
        sm1.local = true;
        isolateScope.delete(sm1);
        expect(stateMachines.indexOf(sm1)).toBe(-1);
        // Since the state machine is local, we should not call back the server
        expect(backendInterfaceService.deleteStateMachine).not.toHaveBeenCalledWith('SM1', jasmine.any(Function));
      });

      it('should save state machine code to a file', function() {
        var buttonMock = { attr: jasmine.createSpy('attr') };
        var URLMock = { createObjectURL: jasmine.createSpy('createObjectURL') };
        spyOn(document, 'querySelector').andReturn(buttonMock);
        spyOn(window, 'Blob').andReturn({});
        expect(window.URL).not.toBeDefined();
        window.URL = URLMock;
        isolateScope.save(new ScriptObject('stateMachineId','Some code'));
        expect(document.querySelector).toHaveBeenCalled();
        expect(URLMock.createObjectURL).toHaveBeenCalled();
      });

  });

  describe('Editing state machines', function () {

      it('should create state machines properly', function() {
        var numberOfNewStateMachines = 3;
        var date = 666;
        spyOn(Date, 'now').andReturn(date);
        for (var i = 0; i < numberOfNewStateMachines; ++i) {
          isolateScope.create();
        }
        var n = numberOfNewStateMachines - 1;
        var sm = stateMachines[0];
        expect(sm.name).toEqual('MyStateMachine_' + n);
        expect(sm.id).toEqual('statemachine_' + n + '_' + date);
        expect(sm.code).toContain('import smach_ros');
        expect(sm.code).toContain('import DefaultStateMachine');
        expect(sm.code).toContain('def populate():\n');
        expect(sm.code).toContain('(DefaultStateMachine)');
      });

      it('should update script flags properly when editing the state machine code', function() {
        var smCode = 'class MyStateMachine(DefaultStateMachine):\n    def populate():\n        return None';
        var smCodeNewCode = 'class MyStateMachine(DefaultMachine):\n    def populate():\n        return []';
        stateMachines[0] = {code: smCode, dirty: false, local: false, id: 'sm'};
        var sm = stateMachines[0];
        sm.code = smCodeNewCode;
        isolateScope.onStateMachineChange(sm);
        expect(stateMachines).toEqual(
          [
            { code: smCodeNewCode, dirty: true, local: false, id: 'sm'}
          ]);
      });

      it('should retrieve the class name of the state from its code', function() {
        var className = 'MyStateMachine';
        var smCode = 'class   ' + className + '   ( DefaultStateMachine ):\n    def populate():\n        return []';
        expect(isolateScope.getStateMachinePythonClassName(smCode)).toEqual(className);
        smCode = 'def ' + className + '(DefaultStateMachine):\n return 0';
        expect(isolateScope.getStateMachinePythonClassName(smCode)).not.toBeDefined();
      });

      it('should load to back-end memory a state machine from file', function() {
        var readAsTextSpy = jasmine.createSpy('readAsTextSpy');
        var expectedName = 'Enigma';
        var stateMachineCode = 'class ' + expectedName + ' (DefaultStateMachine):\n';
        var fileReaderMock = {
          readAsText: readAsTextSpy
        };
        var eventMock = {
          target : { result: stateMachineCode }
        };
        spyOn(window, 'FileReader').andReturn(fileReaderMock);
        spyOn(Date, 'now').andReturn(666);

        isolateScope.loadStateMachine('someFile');
        expect(window.FileReader).toHaveBeenCalled();
        expect(readAsTextSpy).toHaveBeenCalled();
        fileReaderMock.onload(eventMock);
        expect(stateMachines).toEqual([]);
        $timeout.flush();
        stateMachines = isolateScope.stateMachines;
        var expectedStateMachineId = 'statemachine_0_666';
        var sm = stateMachines[0];
        expect(sm.id).toEqual(expectedStateMachineId);
        expect(sm.name).toEqual(expectedName);
        expect(sm.code).toEqual(stateMachineCode);
      });

      it('should not try to load an invalid file', function() {
        var readAsTextSpy = jasmine.createSpy('readAsTextSpy');
        var fileReaderMock = {
          readAsText: readAsTextSpy
        };
        spyOn(window, 'FileReader').andReturn(fileReaderMock);

        isolateScope.loadStateMachine({$error:'some error'});
        expect(window.FileReader).not.toHaveBeenCalled();
      });

    });

});
