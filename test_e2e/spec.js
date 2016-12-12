var parameters = require('./parameters.js');
var experimentList = parameters.EXPERIMENT;
//helper functions
//TODO

//action functions

function connectToHomePage() {
  var deferred = protractor.promise.defer();
  browser.driver.get(parameters.url.Start);
  browser.driver.sleep(parameters.timeout.RESPOND);
  expect(browser.driver.getCurrentUrl()).toEqual(parameters.url.Start + "/#/");
  console.log('Got to the home page');
  console.log('Expectation checked : Current url matches the expected url');
  deferred.fulfill();
  return deferred.promise;
}

function connectToEsvPage() {
  var deferred = protractor.promise.defer();
  browser.driver.get(parameters.url.Esv);
  browser.driver.sleep(parameters.timeout.RESPOND);
  expect(browser.driver.getCurrentUrl()).toEqual(parameters.url.Esv);
  console.log('Got to the experiments page');
  console.log('Expectation checked : Current url matches the expected url');
  deferred.fulfill();
  return deferred.promise;
}

function clickExperiment(experimentName) {
  var deferred = protractor.promise.defer();
  var experimentElement = element(by.cssContainingText('.h4', experimentName))
  experimentElement.click().then(function () {
    console.log('Action : Clicked on the experiment: ' + experimentName);
    browser.driver.sleep(parameters.timeout.SHORT);
  });
  deferred.fulfill();
  return deferred.promise;
}

function launchExperiment() {
  var deferred = protractor.promise.defer();
  var launchButton = element(by.partialButtonText(parameters.button.LAUNCH));
  var splash = element(by.css('.splash'));
  var loading = element(by.css('.fa.fa-2x.fa-spinner.fa-spin'));
  launchButton.click().then(function () {
    console.log('Info : Launched experiment');
  });
  //wait until page has finished loading (i.e. the splash icon has dissapeared)
  browser.driver.wait(protractor.ExpectedConditions.stalenessOf(splash), parameters.timeout.LONG).then(function () {
    console.log("Info : Experiment initialized");
    deferred.fulfill();
  });
  return deferred.promise;
}

function startSimulation() {
  var deferred = protractor.promise.defer();
  var startButton = element(by.css('.glyphicon.glyphicon-play'));
  startButton.click().then(function () {
    console.log('Action : Clicked play button');
  })
  //check if time progresses
  element(by.id('simTime')).getText().then(function (text) {
    console.log('Simulation time: ' + text);
    simulationTimeStart = text;
    // Simulation time should change
    browser.driver.sleep(parameters.timeout.SHORT).then(function () {
      element(by.id('simTime')).getText().then(function (text) {
        console.log('Simulation time: ' + text);
        expect(simulationTimeStart !== text).toBe(true);
        console.log(' Expectation checked : Simulation time progressed');
        deferred.fulfill();
      });
    });
  });
  return deferred.promise;
}

function pauseSimulation() {
  var deffered = protractor.promise.defer();
  var pauseButton = element(by.css('.glyphicon.glyphicon-pause'));
  pauseButton.click().then(function () {
    console.log('Action : Clicked play button');
    deffered.fulfill();
  })
  browser.driver.sleep(parameters.timeout.SHORT);
  return deffered.promise;
}

function stopSiulation() {
  var deffered = protractor.promise.defer();
  var stopButton = element(by.css('.glyphicon.glyphicon-stop'));
  var OKButton = element(by.partialButtonText('OK'));
  stopButton.click().then(function () {
    console.log('Action : Clicked stop button');
    browser.driver.sleep(parameters.timeout.SHORT);
  })
  browser.driver.wait(element(by.partialButtonText('OK')).click(), parameters.timeout.LONG).then(function () {
    browser.driver.getCurrentUrl().then(function (url) {
      console.log('Action : Clicked OK button');
      console.log('Info : Simulation exitted');
      console.log('Info : Now we are on ' + url);
      deffered.fulfill();
    });
  });

  return deffered.promise;
}
//check functions
//TODO

//protractor tests
describe('Simulation Test', function () {

  //variables
  var width = 1920;
  var height = 1080;

  //browser setup
  browser.driver.manage().window().setSize(width, height);

  beforeEach(function () {
    browser.driver.sleep(parameters.timeout.SHORT);
  });

  afterEach(function () {
    browser.driver.sleep(parameters.timeout.SHORT);
  });

  it('Should direct to the home page', function () {
    connectToHomePage().then(function (){ 
    });
  }, parameters.timeout.LONG);

  for (var i = 0; i < experimentList.length; ++i) {
    (function (i) {
      it('Should direct to the esv page', function () {
        connectToEsvPage().then(function () {
       
        });
      }, parameters.timeout.LONG);

      it('Should be able to click an experiment', function () {
        clickExperiment(experimentList[i]).then(function () {

        });
      }, parameters.timeout.LONG)
      it('Should be able to launch an experiment', function () {
        launchExperiment().then(function () {

        });
      }, parameters.timeout.LONG)
      it('Should be able to start the simulation', function () {
        startSimulation().then(function () {

        });
      }, parameters.timeout.LONG)
      it('should be able to pause the simulation', function () {
        pauseSimulation().then(function () {

        })
      }, parameters.timeout.LONG);
      it('should be able to stop the simulation', function () {
        stopSiulation().then(function () {

        })
      }, parameters.timeout.LONG)
    })(i);
  }

});









