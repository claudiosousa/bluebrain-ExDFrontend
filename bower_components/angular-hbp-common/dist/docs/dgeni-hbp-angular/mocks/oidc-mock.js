(function(){
    'use strict';

    angular.module('bbpOidcClient', [])
    .provider('bbpOidcSession', function() {
        this.alwaysPromptLogin =  function() {};
        this.ensureToken = function() {};
        this.$get = function() {
            return {
                logout: function() {},
                login: function() {},
                token: function() {},
                alwaysPromptLogin: this.alwaysPromptLogin,
                ensureToken: this.ensureToken
            };
        };
    });
}());