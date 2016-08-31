'use strict';

describe('Directive: environment settings quality', function ()
{
  var $rootScope, element, gz3dMock;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(module(function ($provide)
  {
    gz3dMock = { 'scene': { 'composerSettings': { 'shadows': false } } };
    gz3dMock.scene.applyComposerSettings = function(){};

    $provide.value('gz3d', gz3dMock);
  }));

  beforeEach(inject(function (
    _$rootScope_,
    $compile)
  {
    $rootScope = _$rootScope_;
    element = $compile('<environmentsettingsquality></environmentsettingsquality>')($rootScope);
    $rootScope.$digest();
  }));

  it('should initialize default values', function ()
  {
    $rootScope.showEnvironmentSettingsPanel = true;
    $rootScope.$digest();

    expect($rootScope.$$childTail.renderShadows).toBeDefined();
  });

  it('should update values to scene', function ()
  {
    $rootScope.$$childTail.renderShadows =true;
    $rootScope.$$childTail.updateEnvQualitySettings();

    expect(gz3dMock.scene.composerSettings.shadows).toBe(true);


  });


});
