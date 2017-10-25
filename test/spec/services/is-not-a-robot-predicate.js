'use strict';

describe('Service isNotARobotPredicate', function() {
  var isNotARobotPredicate;

  beforeEach(module('exdFrontendApp'));
  beforeEach(
    inject(function(_isNotARobotPredicate_) {
      isNotARobotPredicate = _isNotARobotPredicate_;
    })
  );

  it('should detect a robot entity', function() {
    expect(isNotARobotPredicate({ name: 'robot' })).toBe(false);
    expect(isNotARobotPredicate({ name: 'some robot entity' })).toBe(false);
  });

  it('should detect non robots entities as such', function() {
    expect(isNotARobotPredicate({ name: 'some entity' })).toBe(true);
  });
});
