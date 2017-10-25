'use strict';

describe('Directive: disable-animate', function() {
  var $animate, $compile, $rootScope;
  beforeEach(module('exdFrontendApp'));

  beforeEach(
    inject(function(_$compile_, _$animate_, _$rootScope_) {
      $compile = _$compile_;
      $animate = _$animate_;
      $rootScope = _$rootScope_;
    })
  );

  it('should disable animation', function() {
    spyOn($animate, 'enabled');

    var element = $compile('<disable-animate/>')($rootScope);
    $rootScope.$digest();

    expect($animate.enabled).toHaveBeenCalledWith(
      false,
      jasmine.objectContaining({ 0: element[0] })
    );
  });
});
