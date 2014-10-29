// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2014-10-10 using
// generator-karma 0.8.3

module.exports = function(config) {
  'use strict';

  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js',
      'bower_components/lodash/dist/lodash.js',
      'bower_components/bbp-oidc-client/angular-bbp-oidc-client.js',
      'bower_components/angular-hbp-common/dist/angular-hbp-common.js',
      'bower_components/angular-bbp-config/angular-bbp-config.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-hbp-document-client/dist/angular-hbp-document-client.js',
      'test/support/**/*.js',
      'app/scripts/**/*.js',
      'test/mock/**/*.js',
      'test/spec/**/*.js',
      'app/partials/**/*.html',
      {pattern: 'app/views/*.*', included: false, served: true}
    ],

    preprocessors: {
        // source files, that you want to generate coverage for
        // do not include tests or libraries
        // (these files will be instrumented by Istanbul)
        'app/scripts/**/*.js': ['coverage'],
        'app/partials/**/*.html': ['ng-html2js']
    },

    ngHtml2JsPreprocessor: {
        stripPrefix: 'app/',
        prependPrefix: '',

        // the name of the Angular module to create
        moduleName: "exd.templates"
    },

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 9002,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      'PhantomJS'
    ],

    reporters: ['progress', 'junit', 'coverage'],

    // Which plugins to enable
    plugins: [
        'karma-phantomjs-launcher',
        'karma-chrome-launcher',
        'karma-jasmine',
        'karma-coverage',
        'karma-junit-reporter',
        'karma-ng-html2js-preprocessor'
    ],

    junitReporter: {
        outputFile: 'reports/unit-test.xml',
        suite: 'unit'
    },

    coverageReporter: {
        reporters: [
            {
                type : 'lcov',
                dir:   'reports/coverage/',
                file : 'coverage.info'
            },
            {
                type : 'cobertura',
                dir:   'reports/coverage/'
            }
        ]
    },

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    proxies : {
        '/views/': 'http://localhost:8000/views/',
    },

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
