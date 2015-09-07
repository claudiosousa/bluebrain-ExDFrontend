/* global jso_configure, jso_ensureTokens, jso_getToken, jso_wipe */
(function(){
    'use strict';

    var options, initialized, _alwaysPromptLogin, _ensureToken, config, jso;

    var JsoWrapper = function(options) {
        var provider, jsoConfig, jsoOptions, scopes;
        provider = options.clientId + '@' + options.authServer;
        jsoConfig = {
            client_id: options.clientId,
            redirect_uri: options.redirectUri,
            authorization: options.authServer+'/authorize'+(
                options.alwaysPromptLogin ? '?prompt=login' : ''
            ),
            auth_server: options.authServer+'/',
            jsonWebKeys: options.jsonWebKeys
        };
        jsoOptions = {
            debug: options.debug,
            // should contains {access_token, scopes[], expires_in, token_type}
            token: (options.token ?
                { provider: provider, value: options.token } :
                null)
        };
        scopes = options.scopes;

        this.configure = function() {
            var providerConfig = {};
            providerConfig[provider] = jsoConfig;
            return jso_configure(providerConfig, jsoOptions);
        };

        this.ensureTokens = function() {
            var scopesToEnsure = {};
            scopesToEnsure[provider] = scopes;
            return jso_ensureTokens(scopesToEnsure);
        };

        this.getToken = function() {
            return jso_getToken(provider, scopes);
        };

        this.wipe = function() {
            return jso_wipe();
        };
    };

    var init = function() {
        if (initialized) {
            return;
        }

        options = {
            clientId: config.get('auth.clientId'),
            authServer: config.get('auth.url'),
            debug: config.get('oidc.debug', false),
            redirectUri: document.URL,
            scopes: config.get('auth.scopes', null),
            alwaysPromptLogin: _alwaysPromptLogin,
            jsonWebKeys: {'keys':[{'alg':'RS256','e':'AQAB','n':'zlJpDPnGMUV5FlwQs5eIs77pdZTST29TELUT3_E1sKrN-lE4rEgbQQ5qU1KvF5669VmVeAt-BQ2qMjGjUyl44gq-aUkeQV7MXfYJfKHIULZMTGR0lJ4ebPRQgM5OWDNjYVbASAOz0NyO646G5H5BlHZrA9ADyrZYZ4CEhfI1KBk','kty':'RSA','kid':'bbp-oidc'}]},
            token: config.get('auth.token', null)
        };
        jso = new JsoWrapper(options);

        jso.configure();

        // This check has to occurs every time.
        if (_ensureToken) {
            if(!jso.getToken()) {
                // if there's no token, check if the session with oidc is still active
                getTokenOrLogout(options.clientId);
            }
        }

        initialized = true;
    };

    /**
     * checks if the session with oidc is still active; if so, tries to get
     * a new token, otherwise notifies the parent window.
     */
    var getTokenOrLogout = function(clientId) {
        isSessionActive(function(active) {
            if(!active) {
                // notify the parent window that a new login is needed
                postLogoutMsg(clientId);
            }
            // ensure token in any case
            // if active == true, it will get a new token, otherwise redirect to login
            jso.ensureTokens();
        });
    };

    var postLogoutMsg = function(clientId) {
        if(window.parent && window !== window.top) {
            window.parent.postMessage({
                eventName: 'oidc.logout',
                data: {
                    clientId: clientId
                }
            }, '*');
        }
    };

    var isSessionActive = function(callback) {
        var oReq = new XMLHttpRequest();
        oReq.onload = function() {
            if(callback) {
                callback(this.status === 200);
            }
        };

        oReq.open('get', options.authServer + '/session', true);
        oReq.withCredentials = true;
        oReq.send();
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

            this.$get = ['$http', function($http) {
                return {
                    logout: function() {
                        var self = this;
                        // Ensure we have a token.
                        var token = this.token();
                        var localRemoval = function() {
                            // We need to keep the token to generate
                            // Bearer for this request. Hence the reset only after.
                            jso.wipe();

                            if (_ensureToken) {
                                self.login();
                            }
                        };

                        return $http({
                            method: 'POST',
                            url: options.authServer+'/slo',
                            data: { token: token },
                            withCredentials: true
                        }).then(localRemoval, localRemoval);
                    },
                    login: function() {
                        return jso.ensureTokens();
                    },
                    token: function() {
                        return jso.getToken();
                    },
                    alwaysPromptLogin: this.alwaysPromptLogin,
                    ensureToken: this.ensureToken
                };
            }];
        })
        // authentication and request token injection
        .factory('httpOidcRequestInterceptor', ['bbpConfig', '$log', '$q',
            function (bbpConfig, $log, $q) {
            return {
                request: function (requestConfig) {
                    var token = jso.getToken();
                    if (token) {
                        if (!requestConfig.headers.Authorization) {
                            requestConfig.headers.Authorization = 'Bearer ' + token;
                        }
                    } else if(_ensureToken) {
                        jso.ensureTokens();
                    }

                    return requestConfig;
                },
                responseError: function(rejection) {
                    // if we have a Authorization token and got a 401, we should logout, and try the request again
                    var headers = rejection.config.headers;
                    if (headers && headers.Authorization && rejection.status === 401) {
                        $log.debug('current token is not valid anymore:', rejection.data);
                        // remove token from localStorage
                        jso.wipe();
                        if (_ensureToken) {
                            getTokenOrLogout(options.clientId);
                        }
                    }
                    return $q.reject(rejection);
                }
            };
        }]);
}());
