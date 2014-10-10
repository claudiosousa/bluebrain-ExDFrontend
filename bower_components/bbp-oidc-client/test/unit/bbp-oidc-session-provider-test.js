/* global describe, it, expect, beforeEach, afterEach, jasmine, spyOn */
/* global module, inject, config */
/* global jso_registerRedirectHandler, jso_registerStorageHandler, jso_getToken, jso_ensureTokens, jso_Api_default_storage */
describe('bbpOidcSessionProvider', function() {
    'use strict';

    beforeEach(function() {
        spyOn(window, 'jso_ensureTokens').andReturn(true);
    });

    describe(".ensureToken()", function() {
        var bbpOidcSession;
        beforeEach(function() {
            angular.module('fake', ['bbpOidcClient'])
            .config(function(bbpOidcSessionProvider) {
                bbpOidcSessionProvider = bbpOidcSessionProvider.ensureToken(true);
            });
            module('bbpOidcClient');
            module('fake');
            inject(function(_bbpOidcSession_){
                bbpOidcSession = _bbpOidcSession_;
            });
        });
        afterEach(function() {
            bbpOidcSession.ensureToken(false);
        });

        it("should ensure the token presence", function() {
            expect(window.jso_ensureTokens).toHaveBeenCalled();
        });
    });
});
