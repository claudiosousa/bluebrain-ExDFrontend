// Parameters needed for test_e2e/spec.js

var urlStartPage = 'http://' + browser.params.ipAddress + ':9000';
var urlEsvPage = urlStartPage + '/#/esv-web';

module.exports = {

    SCREENSHOTS_PATH : 'test_e2e/screenshots/',

    // Buttons
    button : {
        START_PAGE : 'Get started!',
        LAUNCH : 'Launch',
        EDIT : 'Edit',
        JOIN : 'Join',
    },

    // Timeouts
    timeout : {
        RESPOND : 1000,
        SHORT : 5000,
        LONG : 300000,
    },

    // Experiments
    EXPERIMENT : {
        _1 : 'Husky Braitenberg experiment',
        _2 : 'Husky Braitenberg experiment in the SpaceBotCup 2013 arena',
        _3 : 'LAURON V Braitenberg experiment',
        _4 : 'LAURON V Braitenberg experiment in the SpaceBotCup 2013 arena',
    },

    // Url
    url : {
        Start : urlStartPage,
        Esv : urlEsvPage,
        LOGIN : 'https://services.humanbrainproject.eu/oidc/login',
    },

};
