'use strict';

describe('Directive: brainvisualizer', function ()
{
  var $rootScope, element;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(inject(function (
    _$rootScope_,
    $compile)
  {
    window.BRAIN3D = {
      MainView: jasmine.createSpy('MainView').andReturn({ setPaused: angular.noop })
    };
    $rootScope = _$rootScope_;
    element = $compile('<brainvisualizer></brainvisualizer>')($rootScope);
    $rootScope.$digest();
  }));


  it('should create BRAIN3D main view', function ()
  {
    $rootScope.showBrainvisualizerPanel = true;
    $rootScope.$digest();

    expect(window.BRAIN3D.MainView).toHaveBeenCalled();

  });

});
