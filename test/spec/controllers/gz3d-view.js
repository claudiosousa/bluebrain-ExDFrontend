'use strict';

describe('Controller: Gz3dViewCtrl', function () {

  // load the controller's module
  beforeEach(module('exdFrontendApp'));

  var Gz3dViewCtrl,
    scope, 
    rootScope,
    bbpConfig;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, _bbpConfig_) {
    scope = $rootScope.$new();
    rootScope = $rootScope.$new();
    bbpConfig = _bbpConfig_;
    spyOn(bbpConfig, 'get');
    Gz3dViewCtrl = $controller('Gz3dViewCtrl', {
      $rootScope: rootScope,
      $scope: scope
    });
  }));

/* global GZ3D: false */
  it('should set port for serving the assets directory', function () {
    expect(rootScope.GZ3D).toBeDefined();
    var getType = {};
    expect(getType.toString.call(rootScope.GZ3D.setAssetsPath)).toBe('[object Function]');
    expect(bbpConfig.get).toHaveBeenCalled();
    //TODO(Luc): understand why rootScope.GZ3D.assetsPath remains undefined
    //expect(rootScope.GZ3D.assetsPath).toBeDefined();
    //expect(rootScope.GZ3D.assetsPath).toMatch("http://");
    //expect(rootScope.GZ3D.assetsPath).toMatch("assets");
  });
});
