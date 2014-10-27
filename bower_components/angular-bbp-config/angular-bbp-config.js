(function() {
    'use strict';

    var get = function(key, defaultValue) {
        var parts = key.split('.');
        var cursor = window.bbpConfig;
        for (var i = 0; i < parts.length; i++) {
            if (!(cursor && cursor.hasOwnProperty(parts[i]))) {
                if (defaultValue !== undefined) {
                    return defaultValue;
                }
                throw new Error('UnkownConfigurationKey: <'+key+'>');
            }
            cursor =  cursor[parts[i]];
        }
        return cursor;
    };

    /**
     * 0.1.x version of bbpConfig is using this instead of .get().
     * This is now deprecated in favor of bbpConfig.get(key, [default]).
     */
    var bbpConfig = function() {
        console.log('bbpConfig(key, [default]) is now deprecated in favor of bbpConfig.get(key, [default]).');
        console.log('bbpConfig(key, [default] will be removed in bbpConfig 0.3)');
        return get.apply(this, arguments);
    };
    bbpConfig.get = get;

    angular.module('bbpConfig', [])
    /**
     * bbpConfig(key, [defaultValue]) provides configuration value loaded at
     * the application bootstrap.
     *
     * The service is a function that accept a key and an optional default
     * value. If the key cannot be found in the configurations, it will return
     * the provided default value. If the defaultValue is undefied, it will
     * throw an error.
     *
     * Contract ensures that those data are available when angular bootstrap the
     * application.
     */
    .constant('bbpConfig', bbpConfig);
}());
