/* global GZ3D: true */
'use strict';

describe('Directive: environment settings master', function() {
  var $rootScope, element, gz3dMock;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('exd.templates'));

  beforeEach(
    module(function($provide) {
      GZ3D.MASTER_QUALITY_BEST = 'Best';
      GZ3D.MASTER_QUALITY_MIDDLE = 'Middle';
      GZ3D.MASTER_QUALITY_LOW = 'Low';
      GZ3D.MASTER_QUALITY_MINIMAL = 'Minimal';

      gz3dMock = {
        scene: { composer: { currentMasterSettings: GZ3D.MASTER_QUALITY_BEST } }
      };
      gz3dMock.scene.setMasterSettings = function(n) {
        this.composer.currentMasterSettings = n;
      };

      $provide.value('gz3d', gz3dMock);
    })
  );

  beforeEach(
    inject(function(_$rootScope_, $compile) {
      $rootScope = _$rootScope_;
      element = $compile(
        '<environment-settings-master></environment-settings-master>'
      )($rootScope);
      $rootScope.$digest();
    })
  );

  it('should initialize default values', function() {
    $rootScope.showEnvironmentSettingsPanel = true;
    $rootScope.$digest();

    expect(gz3dMock.scene.composer.currentMasterSettings).toBeDefined();
  });

  it('should update values to scene', function() {
    $rootScope.$$childTail.setMasterSettings(GZ3D.MASTER_QUALITY_MINIMAL);
    expect(gz3dMock.scene.composer.currentMasterSettings).toBe(
      GZ3D.MASTER_QUALITY_MINIMAL
    );
  });
});
