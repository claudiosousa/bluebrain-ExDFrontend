'use strict';

describe('Services: nrpUser', function () {
  var $rootScope, $q, $injector, nrpUser, initialForceuserValue;


  var hbpIdentityUserDirectory = {
    getCurrentUser: jasmine.createSpy('hbpIdentityUserDirectory')
      .andCallFake(function () {
        return $q.when('dir_user');
      })
  };

  beforeEach(module('exdFrontendApp'));
  beforeEach(module(function ($provide) {
    initialForceuserValue = window.bbpConfig.localmode.forceuser;
    $provide.value('hbpIdentityUserDirectory', hbpIdentityUserDirectory);
  }));

  afterEach(function () {
    window.bbpConfig.localmode.forceuser = initialForceuserValue;
  });

  beforeEach(inject(function (_$injector_, _$rootScope_, _$q_, $httpBackend, _nrpUser_) {
    $injector = _$injector_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    nrpUser = _nrpUser_;

    hbpIdentityUserDirectory.getCurrentUser.reset();
    $httpBackend.whenGET(/.*/).respond(200);
  }));

  it('should call hbpIdentityUserDirectory when not forcing user', function () {
    window.bbpConfig.localmode.forceuser = false;
    nrpUser.getCurrentUser();
    expect(hbpIdentityUserDirectory.getCurrentUser).toHaveBeenCalled();
  });

  it('should return config ownerID when not forcing config user', function () {
    window.bbpConfig.localmode.forceuser = true;
    window.bbpConfig.localmode.ownerID = 'testUser';

    nrpUser.getCurrentUser().then(function (user) {
      expect(user.id).toBe(window.bbpConfig.localmode.ownerID);
    });
    $rootScope.$digest();
    expect(hbpIdentityUserDirectory.getCurrentUser).not.toHaveBeenCalled();
  });

});
