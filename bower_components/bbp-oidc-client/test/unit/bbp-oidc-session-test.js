/* global describe, it, expect, beforeEach, afterEach, jasmine, spyOn */
/* global module, inject */
/* global jso_registerRedirectHandler, jso_registerStorageHandler, jso_getToken, jso_ensureTokens, jso_Api_default_storage */

describe('bbpOidcSession', function() {
    'use strict';
    var bbpOidcSession, $httpBackend, $scope, provider;
    var StorageStub = function() {
        this.tokens = {}
        this.getToken = function(domain, scopes) {
            var r = this.tokens[domain];
            if (!r) {
                return;
            }
            if (scopes && scopes.length) {
                // only handle one scope.
                if (r.scopes && r.scopes[0] === scopes[0]) {
                    return r;
                }
            } else {
                return r;
            }
        };
        this.wipeTokens = function(domain) {
            this.tokens = {};
        };
        this.saveToken = function(domain, value) {
            this.tokens[domain] = value;
        };
    }
    beforeEach(function() {
        window.bbpConfig = {
            auth: {
                url: 'https://test.oidc.te/auth',
                clientId: 'test'
            }
        };
        provider = 'test@https://test.oidc.te/auth';
    });
    beforeEach(module('bbpOidcClient'));

    beforeEach(inject(function(_$httpBackend_, _$rootScope_, _bbpOidcSession_) {
        $httpBackend = _$httpBackend_;
        bbpOidcSession = _bbpOidcSession_;
        $scope = _$rootScope_;
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();

        jso_registerStorageHandler(new jso_Api_default_storage());
        jso_wipe();
        bbpOidcSession.ensureToken(false);
    });

    it('should be defined', function() {
        expect(bbpOidcSession).toBeDefined();
        expect(bbpOidcSession.login).toBeDefined();
        expect(bbpOidcSession.logout).toBeDefined();
    });

    describe('.login()', function() {
        var redirectFunc;
        beforeEach(function() {
            redirectFunc = jasmine.createSpy('redirect');
            jso_registerRedirectHandler(redirectFunc);
        });

        it('should authenticate', function() {
            bbpOidcSession.login();
            expect(redirectFunc).toHaveBeenCalled();
        });

        it('should redirect to /authorize', function() {
            bbpOidcSession.login();
            expect(redirectFunc.calls.mostRecent().args[0])
            .toMatch(/\/authorize\?/);
        });

        describe('set from config', function() {
            var storage;
            beforeEach(function() {
                storage = new StorageStub();
                window.bbpConfig.auth.token = {
                    token_type: 'Bearer',
                    access_token: 'sadasdsa',
                    expires_in: 2333,
                    scopes: ['openid']
                };
                window.bbpConfig.auth.scopes = ['openid'];
                jso_registerStorageHandler(storage);
            });

            it('should set the token directly', function() {
                bbpOidcSession.ensureToken(true);
                bbpOidcSession.login();
                expect(bbpOidcSession.token()).not.toBeNull();
                expect(redirectFunc).not.toHaveBeenCalled();
            });

            it('should request if not the correct scope', function() {
                jso_registerRedirectHandler(redirectFunc);
                jso_wipe();
                window.bbpConfig.auth.scopes = ['anotherscope'];
                bbpOidcSession.ensureToken(true);
                bbpOidcSession.login();
                expect(bbpOidcSession.token()).toBeNull();
            });
        });

        describe('scopes', function() {
            var checkScopes = function(url, scopes) {
                expect(url).toMatch(
                    new RegExp('/authorize?.*scope=' + encodeURIComponent(scopes.join(' ')) + '$')
                );
            };

            var checkNoScopes = function(url) {
                expect(url).not.toMatch(
                    new RegExp('/authorize?.*scope=.*$')
                );
            };

            it('should request no default scopes', function() {
                jso_wipe();
                bbpOidcSession.ensureToken(true);
                bbpOidcSession.login();
                checkNoScopes(redirectFunc.calls.mostRecent().args[0]);
            });

            it('should request custom scopes', function() {
                window.bbpConfig.auth.scopes = ['openid', 'api.users'];
                bbpOidcSession.ensureToken(true);

                bbpOidcSession.login();
                checkScopes(redirectFunc.calls.mostRecent().args[0], ['openid', 'api.users']);
            });

            it('should request no scopes if the client really wants to', function() {
                window.bbpConfig.auth.scopes = [];
                bbpOidcSession.ensureToken(true);

                bbpOidcSession.login();
                checkScopes(redirectFunc.calls.mostRecent().args[0], []);
            });
        });

        describe('force prompt', function() {
            beforeEach(function() {
                bbpOidcSession.alwaysPromptLogin(true);
            });
            afterEach(function() {
                bbpOidcSession.alwaysPromptLogin(false);
            });

            it('should use prompt=login', function() {
                bbpOidcSession.login();
                expect(redirectFunc).toHaveBeenCalled();
                expect(redirectFunc.calls.mostRecent().args[0])
                .toMatch(/\/authorize\?prompt=login/);
            });
        });
    });

    describe('.logout()', function() {
        var storage, token, logoutUrl, tokenValue;
        beforeEach(function() {
            tokenValue = 'ABCD';
            storage = new StorageStub();
            token = storage.tokens;
            token[provider] = {
                'access_token': tokenValue
            };
            logoutUrl = 'https://test.oidc.te/auth/slo';
            jso_registerStorageHandler(storage);
            spyOn(window, 'jso_wipe').and.callThrough();
            expect(jso_getToken(provider)).not.toBeNull();
            expect(jso_ensureTokens({provider:['openid']})).toBe(true);
            spyOn(storage, 'wipeTokens').and.callThrough();
            $httpBackend.when('POST', logoutUrl).respond(200);
        });

        it('should retrieve a promise', function() {
            var p = bbpOidcSession.logout();
            var resolved = false;
            p.then(function() {
                resolved = true;
            });
            expect(p.then).toBeDefined();
            $httpBackend.flush(1);
            expect(resolved).toBe(true);
        });

        it('should send a revocation request', function() {
            bbpOidcSession.logout();
            $httpBackend.expect('POST', logoutUrl, {token: tokenValue}, function(headers){
                return headers.Authorization === 'Bearer '+tokenValue;
            });
            $httpBackend.flush(1);
        });

        it('should wipe token', function() {
            bbpOidcSession.logout();
            $httpBackend.flush(1);
            expect(window.jso_wipe).toHaveBeenCalled();
            expect(storage.wipeTokens).toHaveBeenCalled();
        });

        it('should nullify actual token', function() {
            bbpOidcSession.logout();
            $httpBackend.flush(1);
            expect(window.jso_getToken(provider)).toBeNull();
        });

        describe('then login', function() {
            beforeEach(function() {
                spyOn(bbpOidcSession, 'login');
            });

            it('should be triggered when ensureToken is true', function() {
                bbpOidcSession.ensureToken(true);
                bbpOidcSession.logout();
                $httpBackend.flush(1);
                expect(bbpOidcSession.login).toHaveBeenCalled();
            });

            it('should not be triggered when ensureToken is false', function() {
                bbpOidcSession.ensureToken(false);
                bbpOidcSession.logout();
                $httpBackend.flush(1);
                expect(bbpOidcSession.login).not.toHaveBeenCalled();
            });
        });
    });

    describe('.token()', function() {
        describe('before login', function() {
            it('should retrieve undefined', function() {
                expect(bbpOidcSession.token()).toBeNull();
            });
        });

        describe('after login', function() {
            var tokenValue, storage;
            beforeEach(function() {
                tokenValue = 'ABCD';
                storage = {
                    getToken: function() {
                        return {
                            'access_token': tokenValue
                        };
                    }
                };
                jso_registerStorageHandler(storage);
            });
            it('should retrieve the token', function() {
                expect(bbpOidcSession.token()).toBe(tokenValue);
            });
        });

    });
});
