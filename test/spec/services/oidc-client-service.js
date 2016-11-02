'use strict';

describe('Services: oidc-client-service', function ()
{
  var oidcClientService, bbpOidcSession;
  var bbpConfig, rootScope, interval;

  // Mock the necessary service

  bbpConfig = { 'auth': {} };
  bbpOidcSession = {};

  bbpOidcSession.token = function ()
  {
    return 'mockedtoken';
  };

  beforeEach(module('exdFrontendApp'));

  beforeEach(module(function ($provide)
  {
    $provide.value('bbpConfig', bbpConfig);
    $provide.value('bbpOidcSession', bbpOidcSession);
  }));

  beforeEach(inject(function ($rootScope, $httpBackend, $interval, _oidcClientService_)
  {
    rootScope = $rootScope;
    interval = $interval;
    $httpBackend.whenGET(/.*/).respond(200);
    oidcClientService = _oidcClientService_;
  }));

  it('should resolve a NULL value for ensureToken in the bbpConfig', function ()
  {
    var resolved = false;
    oidcClientService.ensureSession().then(function ()
    {
      resolved = true;
    });

    interval.flush(100);
    rootScope.$digest();
    expect(resolved).toBe(true);
  });

  it('should resolve a false value for ensureToken in the bbpConfig', function ()
  {
    bbpConfig.auth.ensureToken = false;
    var resolved = false;
    oidcClientService.ensureSession().then(function ()
    {
      resolved = true;
    });

    interval.flush(100);
    rootScope.$digest();
    expect(resolved).toBe(true);
  });

  it('should resolve a true value for ensureToken in the bbpConfig', function ()
  {
    bbpConfig.auth.ensureToken = true;
    var resolved = false;
    oidcClientService.ensureSession().then(function ()
    {
      resolved = true;
    });

    interval.flush(100);
    rootScope.$digest();
    expect(resolved).toBe(true);
  });

});
