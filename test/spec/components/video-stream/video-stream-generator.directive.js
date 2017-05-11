'use strict';

describe('Directive: video-stream', function() {

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  var $rootScope, elementScope, $compile, parentElement, $q;

  var videoStreamServiceMock = { getStreamUrls: function() { return $q.resolve(); } };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(module(function($provide) {
    $provide.value('videoStreamService', videoStreamServiceMock);
  }));

  beforeEach(inject(function(_$rootScope_, _$compile_, _$q_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;
  }));

  beforeEach(function() {
    var $scope = $rootScope.$new();
    var element = $compile('<video-stream-generator></video-stream-generator>')($scope);
    parentElement = document.createElement('div');
    parentElement.appendChild(element[0]);
    $scope.$digest();
    elementScope = element.scope();
  });

  it('should correctly instanciate and append viewer DOM element', function() {
    expect(parentElement.childNodes.length).toEqual(1);
    $rootScope.$emit('openVideoStream');
    expect(parentElement.childNodes.length).toEqual(2);
  });

  it('should correctly destroyed and removed from the DOM', function() {
    $rootScope.$emit('openVideoStream');
    expect(parentElement.childNodes.length).toEqual(2);
    elementScope.$$childHead.closeVideoStream();
    expect(parentElement.childNodes.length).toEqual(1);
  });
});

