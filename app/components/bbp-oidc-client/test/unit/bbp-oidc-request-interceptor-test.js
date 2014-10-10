/* global describe, it, expect, beforeEach, afterEach, jasmine, spyOn */
/* global module, inject, config */
/* global jso_registerRedirectHandler, jso_registerStorageHandler, jso_getToken, jso_ensureTokens */
/* global jso_Api_default_storage */

describe('bbpOidcRequestInterceptor', function() {
    'use strict';

    var $http, $httpBackend, url, bbpOidcSession;

    beforeEach(function() {
        window.bbpConfig = {
            auth: {
                url: 'https://test.oidc.te/auth',
                clientId: 'test'
            },
            oidc: {
                debug: false
            }
        };
    });

    beforeEach(function() {
        url = 'http://onehundredcoverage.com';
        module('bbpOidcClient');
    });

    beforeEach(inject(function(_$http_, _$httpBackend_, _bbpOidcSession_) {
        $http = _$http_;
        $httpBackend = _$httpBackend_;
        bbpOidcSession = _bbpOidcSession_;
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        jso_registerStorageHandler(new jso_Api_default_storage());
    });

    describe('with a token', function() {

        beforeEach(function() {
            jso_registerStorageHandler({
                getToken: function() {
                    return { access_token: 'ABCD' };
                }
            });
        });

        it('set Authorization header', function() {
            $http.get(url);
            $httpBackend.expect('GET', url, null, function(headers) {
                return headers.Authorization === 'Bearer ABCD';
            }).respond(200);
            $httpBackend.flush();
        });
    });

    describe('without a token', function() {
        beforeEach(function() {
            jso_registerStorageHandler({
                getToken: function() {
                    return null;
                },
                saveState: function() {}
            });
        });

        it('set no Authorization header', function() {
            $http.get(url);
            $httpBackend.expect('GET', url, null, function(headers) {
                return headers.Authorization === undefined;
            }).respond(200);
            $httpBackend.flush();
        });
    });
});
