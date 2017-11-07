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

  beforeEach(
    module(function($provide) {
      $provide.value('simulationInfo', simulationInfoMock);
    })
  );

  var scope, $rootScope, element;
  beforeEach(
    inject(function(_$rootScope_, $compile) {
      $rootScope = _$rootScope_;
      $rootScope.visible = false;
      element = $compile('<spike-train ng-show="visible"></spike-train>')(
        $rootScope
      );
      $rootScope.$digest();
      scope = element.isolateScope();
    })
  );

  it('should initialize controller', function() {
    expect(scope.vm).toBeDefined();
  });
});
