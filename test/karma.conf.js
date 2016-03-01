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
      // The lines between 'bower:' and 'endbower' are filled automagically with the respective bower components.
      // Note though that several packages are excluded (as described in the Gruntfile.js).
      // bower:
      'bower_components/es5-shim/es5-shim.js',
      'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-bbp-config/angular-bbp-config.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'bower_components/bbp-oidc-client/angular-bbp-oidc-client.js',
      'bower_components/lodash/lodash.js',
      'bower_components/marked-hbp/lib/marked.js',
      'bower_components/angular-hbp-common/dist/angular-hbp-common.js',
      'bower_components/angular-hbp-document-client/dist/angular-hbp-document-client.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-toArrayFilter/toArrayFilter.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js',
      'bower_components/codemirror/lib/codemirror.js',
      'bower_components/codemirror/mode/python/python.js',
      'bower_components/codemirror/mode/shell/shell.js',
      'bower_components/angular-ui-codemirror/ui-codemirror.js',
      'bower_components/angular.panels/dist/angular.panels.min.js',
      'bower_components/threejs/build/three.js',
      'bower_components/eventemitter2/lib/eventemitter2.js',
      'bower_components/xml2json/xml2json.js',
      'bower_components/gz3d-hbp/gz3d/build/gz3d.js',
      'bower_components/json3/lib/json3.js',
      'bower_components/d3/d3.js',
      'bower_components/moment/moment.js',
      'bower_components/n3-line-chart/build/line-chart.min.js',
      'bower_components/ng-file-upload/ng-file-upload.js',
      'bower_components/roslibjs/build/roslib.js',
      'bower_components/stats.js/build/stats.min.js',
      'bower_components/v-button/dist/v-button.js',
      'bower_components/SHA-1/sha1.js',
      'bower_components/angulartics/src/angulartics.js',
      'bower_components/angulartics-google-analytics/lib/angulartics-google-analytics.js',
      'bower_components/angular-mocks/angular-mocks.js',
      // endbower
      'bower_components/threejs/examples/js/controls/OrbitControls.js',
      'bower_components/threejs/examples/js/Detector.js',
      'bower_components/threejs/examples/js/shaders/CopyShader.js',
      'bower_components/threejs/examples/js/shaders/SSAOShader.js',
      'bower_components/threejs/examples/js/postprocessing/EffectComposer.js',
      'bower_components/threejs/examples/js/postprocessing/RenderPass.js',
      'bower_components/threejs/examples/js/postprocessing/MaskPass.js',
      'bower_components/threejs/examples/js/postprocessing/ShaderPass.js',
      'bower_components/gz3d-hbp/gz3d/client/js/include/ThreeBackwardsCompatibility.js',
      'bower_components/gz3d-hbp/gz3d/client/js/include/ColladaLoader.js',
      'bower_components/gz3d-hbp/gz3d/client/js/include/first-person-controls.js',
      'bower_components/gz3d-hbp/gz3d/build/gz3d.js',
      'test/support/**/*.js',
      'app/scripts/common/filters/time-filters.js', // Make sure modules used in different files are loaded before they are used
      'app/scripts/**/*.js',
      'test/mock/**/*.js',
      'test/spec/datagenerator/*.js',
      'test/spec/**/*.js',
      'app/scripts/common/**/*.js',
      // list the esv directories explicitly, since we do not want
      // to include all parts of the gz3d folder
      'app/scripts/esv/controllers/*.js',
      'app/scripts/esv/directives/*.js',
      'app/scripts/esv/services/*.js',
      'app/views/esv/*.html',
      'app/views/common/*.html',
      {pattern: 'app/views/*.*', included: false, served: true}
    ],

    preprocessors: {
        // source files, that you want to generate coverage for
        // do not include tests or libraries
        // (these files will be instrumented by Istanbul)
        'app/scripts/app/**/*.js': ['coverage'],
        'app/scripts/common/**/*.js': ['coverage'],
        'app/scripts/esv/controllers/*.js': ['coverage'],
        'app/scripts/esv/directives/*.js': ['coverage'],
        'app/scripts/esv/services/*.js': ['coverage'],
        'app/views/esv/*.html': ['ng-html2js'],
        'app/views/common/*.html': ['ng-html2js']
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
        outputDir: 'reports/coverage/',
        outputFile: 'unit-test.xml',
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
        '/img/': 'app/img/'
    },

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
