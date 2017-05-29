'use strict';

describe('Directive: spiketrain', function() {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('spikeTrainModule'));
  beforeEach(module('exd.templates')); // import html template

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

  var scope, $rootScope, $timeout, element, editorToolbarService;
  beforeEach(inject(function(_$rootScope_, $compile, _$timeout_,
                             _editorToolbarService_) {
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    $rootScope.visible = false;
    element = $compile('<spike-train ng-show="visible"></spike-train>')($rootScope);
    $rootScope.$digest();
    scope = element.isolateScope();
    editorToolbarService = _editorToolbarService_;
  }));

  beforeEach(function() {
    spyOn(scope.vm, 'startSpikeDisplay');
    spyOn(scope.vm, 'stopSpikeDisplay');
    spyOn(scope.vm, 'calculateCanvasSize');
    spyOn(scope.vm, 'clearPlot');
    spyOn(scope.vm, 'redraw');
  });

  it('should call controller methods when visible', function() {
    editorToolbarService.showSpikeTrain = true;
    $rootScope.$digest();
    $timeout.flush();

    expect(scope.vm.startSpikeDisplay).toHaveBeenCalled();
  });

  it('should clearPlot on RESET', function() {
    scope.$emit('RESET');
    scope.$digest();
    expect(scope.vm.clearPlot).toHaveBeenCalled();
  });

  it('should stopSpikeDisplay on destroy', function() {
    scope.$emit('$destroy');
    scope.$digest();
    expect(scope.vm.stopSpikeDisplay).toHaveBeenCalled();
  });
});