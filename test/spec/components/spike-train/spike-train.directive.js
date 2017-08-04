'use strict';

describe('Directive: spiketrain', function() {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('spikeTrainModule'));
  beforeEach(module('exd.templates')); // import html template

  beforeEach(module('editorToolbarServiceMock'));
  beforeEach(module('spikeListenerServiceMock'));

  var simulationInfoMock = {
    serverConfig: {
      rosbridge: {
        websocket: ''
      }
    }
  };

  beforeEach(module(function($provide) {
    $provide.value('simulationInfo', simulationInfoMock);
  }));

  var scope, $rootScope, $interval, element, editorToolbarService;
  beforeEach(inject(function(_$rootScope_, $compile, _$interval_,
                             _editorToolbarService_) {
    $rootScope = _$rootScope_;
    $interval = _$interval_;
    $rootScope.visible = false;
    element = $compile('<spike-train ng-show="visible"></spike-train>')($rootScope);
    $rootScope.$digest();
    scope = element.isolateScope();
    editorToolbarService = _editorToolbarService_;
  }));

  it('should initialize controller', function() {
    expect(scope.vm).toBeDefined();
  });
});
