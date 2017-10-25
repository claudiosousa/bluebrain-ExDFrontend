'use strict';

describe('Directive: environment settings environment', function() {
  var $rootScope, element, gz3dMock;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));
  beforeEach(module('simulationInfoMock'));

  beforeEach(
    module(function($provide) {
      gz3dMock = { scene: { composerSettings: { bloom: false } } };
      gz3dMock.scene.applyComposerSettings = function() {};

      $provide.value('gz3d', gz3dMock);
    })
  );

  beforeEach(
    inject(function(_$rootScope_, $compile, $httpBackend, SKYBOX_LIBRARY) {
      var skyboxLibraryMock = {
        skyList: ['sunset', 'sunrise', 'moon-landscape', 'end-of-the-world'],
        skyLabelList: [
          'Sunset',
          'Sunrise',
          'Moon Landscape',
          'Walking Dead city'
        ]
      };

      var regex = new RegExp('.*' + SKYBOX_LIBRARY);
      $httpBackend.whenGET(regex).respond(skyboxLibraryMock);
      $httpBackend.whenGET('http://proxy/identity').respond(200);

      $rootScope = _$rootScope_;
      element = $compile(
        '<environment-settings-environment></environment-settings-environment>'
      )($rootScope);
      $rootScope.$digest();

      $httpBackend.flush();
    })
  );

  it('should initialize default values', function() {
    $rootScope.showEnvironmentSettingsPanel = true;
    $rootScope.$digest();

    expect($rootScope.$$childTail.bloom).toBeDefined();
  });

  it('should update values to scene', function() {
    $rootScope.$$childTail.bloom = true;
    $rootScope.$$childTail.updateEnvSettings();

    expect(gz3dMock.scene.composerSettings.bloom).toBe(true);
  });
});
