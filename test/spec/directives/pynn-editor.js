/**
 * Created by Bernd Eckstein on 16.10.15.
 */
'use strict';



describe('Directive: pynnEditor', function () {

  var VIEW = 'views/esv/pynn-editor.html';

  var $rootScope,
    $compile,
    $httpBackend,
    $scope,
    isolateScope,
    element,
    backendInterfaceService,
    pythonCodeHelper,
    ScriptObject,
    $timeout;

  var backendInterfaceServiceMock = {
    getBrain: jasmine.createSpy('getBrain'),
  };

  var documentationURLsMock =
  {
    getDocumentationURLs: function () {
      return {
        then: function (callback) {
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
    element = $compile('<pynn-editor control="control"/>')($scope);
    $scope.$digest();

    isolateScope = element.isolateScope();
  }));

  it('should init the pynnScript variable', function () {
    $scope.control.refresh();
    //console.log('SCOPE: ' + simpleStringify(isolateScope));
    expect(isolateScope.pynnScript).toBeUndefined();
    expect(backendInterfaceService.getBrain).toHaveBeenCalled();
  });


  describe('Retrieving, PyNN script', function () {
    var data = {
      'brain_type': 'py',
      'data': '// A PyNN script',
      'data_type': 'text',
      'filename': '/path/filename.py'
    };
    var data2 = {
      'brain_type': 'h5',
      'data': '// binary h5 data',
      'data_type': 'base64',
      'filename': '/path/filename.h5'
    };
    var expected = data.data;

    beforeEach(function () {
      // Nothing to do here.
    });

    it('should handle the retrieved pynn script properly', function () {
      // Mock getBrain Callback with data as return value
      backendInterfaceService.getBrain.andCallFake(function(f) { f(data); });
      $scope.control.refresh();
      expect(backendInterfaceService.getBrain).toHaveBeenCalled();
      expect(isolateScope.pynnScript).toEqual(expected);
    });

    it('should not load a h5 brain properly', function () {
      // Mock getBrain Callback with data2 as return value
      backendInterfaceService.getBrain.andCallFake(function(f) { f(data2); });
      $scope.control.refresh();
      expect(backendInterfaceService.getBrain).toHaveBeenCalled();
      expect(isolateScope.pynnScript).toBeUndefined();
    });

  });

});
