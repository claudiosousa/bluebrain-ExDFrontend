// Currently the loglevel is on ERROR, hence we work around a bit here
console.log = function(data){
  console.error((new Date).toISOString().replace(/z|t/gi,' ').trim() + ': ' + data);
};

// String of simulation time into seconds
// Input String looks like: "dd hh:mm:ss"
function simTimeInSeconds(timeString) {
  var split = timeString.split(' ')[1].split(':');
  return 60 * 60 * split[0] + 60 * split[1] + split[2];
}

// Function to take screenshots
var fs = require('fs');
function writeScreenShot(data, filename) {
  var stream = fs.createWriteStream(parameters.SCREENSHOTS_PATH + filename);
  stream.write(new Buffer(data, 'base64'));
  stream.end();
};

// Parameters
var parameters = require('./parameters.js');

// Experiment used for protractor test
// Will loop over all the experiments in the future
var experimentName = parameters.EXPERIMENT._2;

// Login as user and selection of ESV
function login() {

  var deferred = protractor.promise.defer();

  // Connecting to the main page
  browser.driver.get(parameters.url.Start);
  console.log('Connecting to ' + parameters.url.Start)

  // Login
  browser.driver.wait(function () {
    return browser.driver.getCurrentUrl().then(function (url) {
      console.log('Now we are on ' + url);
      return url == parameters.url.LOGIN;
    });
  }, parameters.timeout.LONG).then(function () {
    console.log('Entering username and password');
    browser.driver.findElement(by.id('j_username')).sendKeys(browser.params.login.user);
    browser.driver.findElement(by.id('j_password')).sendKeys(browser.params.login.password);
    console.log('Submiting username and password');
    browser.driver.findElement(by.name('submit')).click();
  });

  browser.driver.sleep(parameters.timeout.SHORT);
  browser.driver.takeScreenshot().then(function (data) {
    writeScreenShot(data, 'Testshot1.png');
    console.log('Testshot1_Login');
  });

  // Redirects to main page if login is successful
  // Waits until timeout if login unsuccessful
  browser.driver.wait(function () {
    return browser.driver.getCurrentUrl().then(function (url) {
      return url === parameters.url.Start + '/#/';
    });
  }, parameters.timeout.LONG).then(function () {
    console.log('Login successful, proceeding to main page');
    element(by.cssContainingText('.network-name', parameters.button.START_PAGE)).click().then(function () {
      browser.driver.wait(function () {
        return browser.driver.getCurrentUrl().then(function (url) {
          return url === parameters.url.Esv;
        });
      }, parameters.timeout.LONG).then(function () {
        console.log('Now we are on ' + parameters.url.Esv);
        browser.driver.sleep(parameters.timeout.SHORT);
        browser.driver.takeScreenshot().then(function (data) {
          writeScreenShot(data, 'Testshot2.png');
          console.log('Testshot2_ESV_Web');
        });
        deferred.fulfill();
      });
    });
  });

  return deferred.promise;
}

// Initialization of new simulation
function initializeSimulation(experiment,button) {

  var deferred = protractor.promise.defer();
  var splash = element(by.css('.splash'));
  var loading = element(by.css('.fa.fa-2x.fa-spinner.fa-spin'));

  browser.ignoreSynchronization = true;

  // Waits for the list of experiments to load
  browser.driver.sleep(parameters.timeout.RESPOND);
  browser.driver.wait(protractor.until.elementIsNotVisible(loading), parameters.timeout.LONG).then(function () {
    console.log('Waited for ' + (parameters.timeout.SHORT/1000) + 's now to be sure page is completely loaded');
    // Initializes 'experiment'
    element(by.cssContainingText('.h4', experiment)).click().then(function () {
      console.log('Clicked on the experiment containing text: "' + experiment + '"');
    });

    browser.driver.sleep(parameters.timeout.SHORT);
    browser.driver.takeScreenshot().then(function (data) {
      writeScreenShot(data, 'Testshot3.png');
      console.log('Testshot3_Experiment_click');
    });

    element(by.partialButtonText(button)).click().then(function () {
      console.log('Clicked on button: "' + button + '"');
      browser.driver.wait(function () {
        return browser.driver.getCurrentUrl().then(function (url) {
          return url !== parameters.url.Esv;
        });
      }, parameters.timeout.LONG).then(function () {
        console.log('Waiting for assets to load');
        browser.driver.sleep(parameters.timeout.SHORT);
        // Waits for the simulation to load
        browser.driver.wait(protractor.ExpectedConditions.stalenessOf(splash), parameters.timeout.LONG).then(function () {
          console.log('Simulation initialized');
          browser.driver.sleep(parameters.timeout.SHORT);
          browser.driver.takeScreenshot().then(function (data) {
            writeScreenShot(data, 'Testshot4.png');
            console.log('Testshot4_Simulation');
          });
          deferred.fulfill();
        });
      });
    });
  });

  return deferred.promise;
}

// Join existing simulation
function joinSimulation(experiment) {

  var deferred = protractor.promise.defer();
  var splash = element(by.css('.splash'));
  var loading = element(by.css('.fa.fa-2x.fa-spinner.fa-spin'));

  browser.ignoreSynchronization = true;

  // Waits for the list of experiments to load
  browser.driver.sleep(parameters.timeout.RESPOND);
  browser.driver.wait(protractor.until.elementIsNotVisible(loading), parameters.timeout.LONG).then(function () {
    console.log('Waited for ' + (parameters.timeout.SHORT/1000) + 's now to be sure page is completely loaded');
    element(by.cssContainingText('.h4', experiment)).click().then(function () {
      console.log('Clicked on the (first) experiment containing text: "' + experiment + '"');
      console.log('Clicking on button: ' + parameters.button.JOIN);
      element(by.partialButtonText(parameters.button.JOIN)).click();

      browser.driver.sleep(parameters.timeout.SHORT);
      browser.driver.takeScreenshot().then(function (data) {
        writeScreenShot(data, 'Testshot5.png');
        console.log('Testshot5_Experiment_join');
      });

    });
    // It joins the first experiment listed, still needs to be reworked
    browser.driver.sleep(parameters.timeout.RESPOND);
    element.all(by.cssContainingText('.btn',parameters.button.JOIN)).then(function (items) {
      items[1].click().then(function () {
        console.log('Clicked on button: ' + parameters.button.JOIN);
        browser.driver.wait(function () {
          return browser.driver.getCurrentUrl().then(function (url) {
            return url !== parameters.url.Esv;
          });
        }, parameters.timeout.LONG).then(function () {
          console.log('Waiting for assets to load');
          browser.driver.sleep(parameters.timeout.SHORT);
          // Waits for the simulation to load
          browser.driver.wait(protractor.ExpectedConditions.stalenessOf(splash), parameters.timeout.LONG).then(function () {
            console.log('Simulation initialized');
            browser.driver.sleep(parameters.timeout.SHORT);
            browser.driver.takeScreenshot().then(function (data) {
              writeScreenShot(data, 'Testshot6.png');
              console.log('Testshot6_Simulation_join');
            });
            deferred.fulfill();
          });
        });
      });
    });
  });
    
  return deferred.promise;  
}

// Start simulation
function startSimulation() {

  var deferred = protractor.promise.defer();

  element(by.css('.glyphicon.glyphicon-play')).click().then(function() {
    console.log('Simulation started (time should change)');
    element(by.id('simTime')).getText().then(function (text) {
      console.log('Simulation time: ' + text);
        simulationTimeStart = text;
    });
    // Simulation time should change
    browser.driver.sleep(parameters.timeout.SHORT).then(function () {
      element(by.id('simTime')).getText().then(function (text) {
        console.log('Simulation time: ' + text);
        expect(simulationTimeStart !== text).toBe(true);

          browser.driver.sleep(parameters.timeout.SHORT);
          browser.driver.takeScreenshot().then(function (data) {
            writeScreenShot(data, 'Testshot7.png');
            console.log('Testshot7_start');
          });

        deferred.fulfill();
      });
    });
  });

  return deferred.promise;
}

// Pause simulation
function pauseSimulation() {

  var deferred = protractor.promise.defer();

  element(by.css('.glyphicon.glyphicon-pause')).click().then(function () {
    console.log('Simulation paused (time should not change more than 2s)')
  });
  element(by.id('simTime')).getText().then(function (text) {
    console.log('Simulation time: ' + text);
    simulationTime = simTimeInSeconds(text);
  });
  // Simulation time should not change
  browser.driver.sleep(parameters.timeout.SHORT);
  element(by.id('simTime')).getText().then(function (text) {
    console.log('Simulation time: ' + text);
    var deviation = simTimeInSeconds(text) - simulationTime;
    console.log('Deviation = ' + deviation);
    expect(deviation <= 2).toBe(true); //a slow response from server can cause error

    browser.driver.sleep(parameters.timeout.SHORT);
    browser.driver.takeScreenshot().then(function (data) {
      writeScreenShot(data, 'Testshot8.png');
      console.log('Testshot8_pause');
    });

    deferred.fulfill();
  });

  return deferred.promise;
}

// Direct start pause simulation
function directStartPauseSimulation() {

  var deferred = protractor.promise.defer();

  element(by.css('.glyphicon.glyphicon-play')).click().then(function() {
    console.log('Simulation started');
    element(by.css('.glyphicon.glyphicon-pause')).click().then(function () {
      console.log('Simulation paused')
      deferred.fulfill();
    });
  });

  return deferred.promise;
}

// Reset simulation
function resetSimulation() {

  var deferred = protractor.promise.defer();

  element(by.css('.glyphicon.glyphicon-repeat')).click().then(function () {
    browser.driver.sleep(parameters.timeout.RESPOND);
    console.log('Simulation resetted (time should restart at 0s)');
    element(by.id('simTime')).getText().then(function (text) {
      console.log('Simulation time: ' + text);
      simulationTimeStart = text;
    });
    // Simulation time should not change, simulation is paused before reset
    browser.driver.sleep(parameters.timeout.RESPOND).then(function () {
      element(by.id('simTime')).getText().then(function (text) {
        console.log('Simulation time: ' + text);
        expect(simulationTimeStart === text).toBe(true);

          browser.driver.sleep(parameters.timeout.SHORT);
          browser.driver.takeScreenshot().then(function (data) {
            writeScreenShot(data, 'Testshot8.png');
            console.log('Testshot8_reset');
          });

        deferred.fulfill();
      });
    });
  });

  return deferred.promise;
}

// Stop simulation
function stopSimulation() {

  element(by.css('.glyphicon.glyphicon-stop')).click().then(function () {
    browser.driver.sleep(parameters.timeout.RESPOND).then(function () {
      console.log('Simulation stopped');
      console.log('Waiting for splash screen to vanish');
    });
  });
  // Simulation should exit after it is stopped
  browser.driver.wait(element(by.partialButtonText('OK')).click(), parameters.timeout.LONG);
  console.log('Simulation exitted');
  return browser.driver.getCurrentUrl().then(function (url) {
    return url == parameters.url.Esv;
  });

  browser.driver.sleep(parameters.timeout.SHORT);
  browser.driver.takeScreenshot().then(function (data) {
    writeScreenShot(data, 'Testshot9.png');
    console.log('Testshot9_stop');
  });

}

//***********************PROTRACTOR TESTING***********************

describe('Simulation Test', function () {

  var width = 1391;
  var height = 736;
  browser.driver.manage().window().setSize(width,height);

  it('should login', function () {
    console.log('[TC01] Login testcase');
    login().then(function () {
      expect(browser.driver.getCurrentUrl()).toEqual(parameters.url.Esv);
    });
  }, parameters.timeout.LONG);

 it('should launch new experiment and test start pause reset buttons', function () {
    console.log('[TC02] Launching new experiment testcase');
    console.log('[TC03] Start pause reset testcase');
    initializeSimulation(experimentName, parameters.button.LAUNCH).then(function () {
      expect(browser.driver.getCurrentUrl()).toContain('esv-web/gz3d-view');
      startSimulation().then(function () {
        pauseSimulation().then(function () {
          resetSimulation().then(function () {
            directStartPauseSimulation().then(function () {
              expect(browser.driver.getCurrentUrl()).toContain('/view');
            });
          });
        });
      }); 
    });
  }, parameters.timeout.LONG);

  it('should join existing experiment', function () {
    console.log('[TC04] Joining existing experiment testcase');
    browser.driver.get(parameters.url.Esv).then(function () {
      browser.driver.sleep(parameters.timeout.RESPOND);
      expect(browser.driver.getCurrentUrl()).toEqual(parameters.url.Esv);
      joinSimulation(experimentName).then(function () {
        directStartPauseSimulation().then(function () {
          stopSimulation().then(function () {
            expect(browser.driver.getCurrentUrl()).toEqual(parameters.url.Esv);
          });
        });
      });
    });
  }, parameters.timeout.LONG);

  it('should enter edit mode', function () {
    console.log('[TC05] Starting new experiment in edit mode testcase');
    initializeSimulation(experimentName, parameters.button.EDIT).then(function () {
      expect(browser.driver.getCurrentUrl()).toContain('esv-web/gz3d-view');
      startSimulation().then(function () {
        pauseSimulation().then(function () {
          stopSimulation().then(function () {
            expect(browser.driver.getCurrentUrl()).toEqual(parameters.url.Esv);
          });
        });
      });
    });
  }, parameters.timeout.LONG);

});
