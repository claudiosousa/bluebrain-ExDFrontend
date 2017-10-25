'use strict';

describe('Controller: DynamicViewController', function() {
  var $compile, $rootScope;
  var element, elementController;

  beforeEach(module('dynamicViewModule'));
  beforeEach(module('exd.templates'));

  beforeEach(
    inject(function(_$rootScope_, _$compile_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    })
  );

  beforeEach(function() {
    var $scope = $rootScope.$new();
    element = $compile('<dynamic-view></dynamic-view>')($scope);
    $scope.$digest();

    elementController = element.controller('dynamic-view');
  });

  beforeEach(function() {
    spyOn(elementController, 'setViewContent').and.callThrough();
    spyOn(elementController, 'setViewContentViaChannelType').and.callThrough();
  });

  it('should always have a view container element defined', function() {
    expect(elementController.viewContainer).toBeDefined();
  });

  it('should allow to set a directive as content (directive is compiled)', function() {
    var channel = {
      name: 'My Channel',
      directive: 'my-directive'
    };

    elementController.setViewContentViaChannelType(channel);

    expect(elementController.viewContent).toContain(channel.directive);
    expect(elementController.viewContainer.innerHTML).toContain(
      channel.directive
    );
  });

  it('should allow to set arbitrary content', function() {
    var content = 'some_test_content';

    elementController.setViewContent(content);

    expect(elementController.viewContent).toBe(content);
    expect(elementController.viewContainer.innerHTML).toContain(content);
  });

  it('should destroy existing content scope before switching content', function() {
    var contentScope = {
      $destroy: jasmine.createSpy('$destroy')
    };
    elementController.contentScope = contentScope;

    elementController.setViewContent('some-content');

    expect(contentScope.$destroy).toHaveBeenCalled();
  });

  it('should destroy the content scope when its own scope is destroyed', function() {
    var contentScope = {
      $destroy: jasmine.createSpy('$destroy')
    };
    elementController.contentScope = contentScope;

    elementController.onDestroy();

    expect(contentScope.$destroy).toHaveBeenCalled();
  });

  it('should throw a warning when viewContainer is undefined', function() {
    elementController.viewContainer = undefined;
    spyOn(console, 'warn');
    spyOn(elementController, '$compile').and.callThrough();

    elementController.setViewContent('some-content');

    expect(console.warn).toHaveBeenCalled();
    expect(elementController.$compile).not.toHaveBeenCalled();
  });
});
