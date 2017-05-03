'use strict';

describe('Directive: spiketrain', function() {

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

  var scope, $rootScope, $timeout;
  beforeEach(inject(function(_$rootScope_, $compile, _$timeout_) {
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    $rootScope.visible = false;
    var element = $compile('<spike-train ng-show="visible"></spike-train>')($rootScope);
    $rootScope.$digest();
    scope = element.isolateScope();
  }));

  beforeEach(function() {
    spyOn(scope.vm, 'startSpikeDisplay');
    spyOn(scope.vm, 'stopSpikeDisplay');
    spyOn(scope.vm, 'calculateCanvasSize');
    spyOn(scope.vm, 'clearPlot');
    spyOn(scope.vm, 'redraw');
  });

  it('should call controller methods when visible', function() {
    $rootScope.visible = true;
    $rootScope.$digest();
    $timeout.flush();
    expect(scope.vm.startSpikeDisplay).toHaveBeenCalled();
    expect(scope.vm.calculateCanvasSize).toHaveBeenCalled();
    expect(scope.vm.redraw).toHaveBeenCalled();
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