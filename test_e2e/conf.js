exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    capabilities: {
      'browserName': 'firefox'
    },
    specs: ['spec.js'],
    allScriptsTimeout: 90000,
    framework: 'jasmine2',
    //onPrepare: function() {
    //    var jasmineReporters = require('jasmine-reporters');
    //    jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
    //        consolidateAll: true,
    //        savePath: 'testresults',
    //        filePrefix: 'xmloutput'
    //    }));
    //},
    params: {
      //Login data can be changed externally in the command line when you execute protractor by:
      //$ protractor conf.js --params.login.user='yourName' --params.login.password='yourPassword'
      login: {
        user: '',
        password: ''
      }
    }
}
