/* global jso_configure, jso_ensureTokens, jso_getToken, jso_dump, jso_wipe */
(function(){
    'use strict';

    var options, initialized, _alwaysPromptLogin, _ensureToken, config;

    var init = function() {
        if (initialized) {
            return;
        }
        options = {
            clientId: config('auth.clientId'),
            authServer: config('auth.url'),
            debug: config('oidc.debug', false),
            redirectUri: document.URL,
            scopes: ['openid'],
            jsonWebKeys: {"keys":[{"alg":"RS256","e":"AQAB","n":"zlJpDPnGMUV5FlwQs5eIs77pdZTST29TELUT3_E1sKrN-lE4rEgbQQ5qU1KvF5669VmVeAt-BQ2qMjGjUyl44gq-aUkeQV7MXfYJfKHIULZMTGR0lJ4ebPRQgM5OWDNjYVbASAOz0NyO646G5H5BlHZrA9ADyrZYZ4CEhfI1KBk","kty":"RSA","kid":"bbp-oidc"}]}
        };
        // If we need to generate the options, we need
        // to bootstrap jso as well.
        // It would be better to run this into a module bootstrap phase
        // but for now the bbpConfig service does not load early enough.
        // It should be a constant probably.
        jso_configure({
            'bbp': {
                client_id: options.clientId,
                redirect_uri: options.redirectUri,
                authorization: options.authServer+'/authorize'+(
                    _alwaysPromptLogin ? '?prompt=login' : ''
                ),
                auth_server: options.authServer+'/',
                jsonWebKeys: options.jsonWebKeys
            }
        },{
            'debug': options.debug,
            'token': null
        });
        // This check has to occurs every time.
        if (_ensureToken) {
            jso_ensureTokens({'bbp': options.scopes});
        }
        initialized = true;
    };

    angular.module('bbpOidcClient', ['bbpConfig'])
        .config(['bbpConfig', function(bbpConfig) {
            config = bbpConfig;
            init();
        }])
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.interceptors.push('httpOidcRequestInterceptor');
            init();
        }])
        .provider('bbpOidcSession', function() {
            /**
             * Ensure that we will always prompt the login.
             *
             * @param {Boolean} value truthy if a login prompt should be
             *        forced when a token needs to be retrieved.
             */
            this.alwaysPromptLogin = function(value) {
                _alwaysPromptLogin = !!value;
                initialized = false;
                init();
            };

            this.ensureToken = function(value) {
                _ensureToken = !!value;
                initialized = false;
                init();
            };

            this.$get = ['$http', '$log', '$q', 'bbpConfig', function($http, $log, $q, bbpConfig) {
                return {
                    logout: function() {
                        // Ensure we have a token.
                        var token = jso_getToken('bbp', options.scopes);
                        var localRemoval = function() {
                            // We need to keep the token to generate
                            // Bearer for this request. Hence the reset only after.
                            jso_wipe();
                        };
                        return $http.delete(options.authServer+'/revoke', {
                            params: {
                                token: token
                            }
                        }).then(localRemoval, localRemoval);
                    },
                    login: function() {
                        return jso_ensureTokens({'bbp': options.scopes});
                    },
                    token: function() {
                        return jso_getToken('bbp', options.scopes);
                    },
                    alwaysPromptLogin: this.alwaysPromptLogin,
                    ensureToken: this.ensureToken
                };
            }];
        })
        // authentication and request token injection
        .factory('httpOidcRequestInterceptor', ['bbpConfig', function (bbpConfig) {
            return {
                request: function (requestConfig) {
                    var token = jso_getToken('bbp', options.scopes);
                    if (token) {
                        requestConfig.headers.Authorization = 'Bearer ' + token;
                    }
                    return requestConfig;
                }
            };
        }]);
}());
