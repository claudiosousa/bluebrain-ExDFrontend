var bbp = bbp || {};

var defaultAuthUrl = location.protocol + "//" + location.hostname;
if(location.port)
    defaultAuthUrl += ":8282";
defaultAuthUrl += "/api/openid-connect";

bbp.oidcDefaultOptions = {
    redirect_uri: document.URL,
    client_id: "liferay-client",
    auth_server: defaultAuthUrl,
    scopes: [ "openid" ],
    debug: false
};

bbp.client = function(options) {
    
    var _this = this;
    
    // mergin options with defaults
    var opt = $.extend(true, {}, bbp.oidcDefaultOptions, options || {});
    
    _this.opt = opt;
    
    var token = null;
    if(opt.access_token) {
        token = { 'provider': 'bbp',
                  'value': { 
                             'access_token' : opt.access_token,
                             'scopes': opt.scopes
                           }
                 };
    }
    
    jso_configure({
                    "bbp": {
                        client_id: opt.client_id,
                        redirect_uri: opt.redirect_uri,
                        authorization: opt.auth_server + "/authorize",
                        auth_server: opt.auth_server + '/'
                    }
                  },
                  {'debug': opt.debug,
                   'token': token
                   });
    
    jso_ensureTokens({
        "bbp": opt.scopes
    });
    
    if(opt.debug)
        jso_dump();
    
    _this.getToken = function() {
        return jso_getToken("bbp", opt.scopes)
    };
        
    ajax = function (type, url, data, success, error, async) {
        $.oajax({
            type: type,
            url: url,
            data: data,
            jso_provider: "bbp",
            jso_allowia: false,
            jso_scopes: _this.opt.scopes,
            dataType: 'json',
            contentType: 'application/json',
            async: async,
            success: success,
            error: error
        });
    };
    
    _this.oajax = function(options) {
        var oajaxDefaultOptions = {
                jso_provider: "bbp",
                jso_allowia: false,
                jso_scopes: _this.opt.scopes,
            };
        var opt = $.extend(true, {}, oajaxDefaultOptions, options || {});
        $.oajax(opt);
    };
    
    /*
     * GET method (synchronous response)
     * 
     * return: json data
     */
    _this.getSync = function (url) {
        var d = {};
        ajax('GET',
                url, 
                {},
                function(data) { d = data; }, 
                function() { console.log("ERROR in invoking url: " + url); }, 
                false);
        
        return d;
    };
    

    /*
     * GET method (asynchronous response)
     */
    _this.get = function (url, success, error) {
        ajax('GET', url, {}, success, error, true);
    };
    
    /*
     * POST method wrapper
     */ 
    _this.post = function (url, data, success, error) {
        ajax('POST', url, data, success, error, true);
    };
    
    /*
     * PUT method wrapper
     */
    _this.put = function (url, data, success, error) {
        ajax('PUT', url, data, success, error, true);
    };
    
    /*
     * DELETE method wrapper
     */
    _this.del = function(url, success, error) {
        ajax('DELETE', url, {}, success, error, true);
    };

    _this.getJSON = function(url, data, success){
    if ( $.isFunction(data)){ 
        ajax('GET',url,{},data,undefined, true);
    } else {
        ajax('GET',url,data,success,undefined,true);
    }
    }

    
    return _this;
};
