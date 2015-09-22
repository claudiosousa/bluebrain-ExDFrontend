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

const URL_START_PAGE = 'http://localhost:9000';//'https://neurorobotics-dev.humanbrainproject.eu/#/';
const START_PAGE_BUTTON = 'Get started!';
const URL_ESV_PAGE = URL_START_PAGE + '/#/esv-web';
const URL_LOGIN = 'https://services.humanbrainproject.eu/oidc/login';
const LOGIN_USERNAME = browser.params.login.user;
const LOGIN_PASSWORD = browser.params.login.password;

// Timeouts
const TIMEOUT_SHORT = 10000;
const TIMEOUT_LONG = 300000;
const TIMEOUT_LOAD_EXPERIMENT_LIST = TIMEOUT_SHORT;
const TIMEOUT_CREATE_AND_LOAD_EXPERIMENT = 45000;

const EXPERIMENT_TO_CHOOSE = 'Husky Braitenberg experiment';
const CREATE_SIMULATION_BUTTON = 'Launch';
const JOIN_SIMULATION_BUTTON = 'Join existing simulation';
const JOIN_BUTTON = 'Join ';

// Login as user and selection of ESV
function login() {

    browser.driver.get(URL_START_PAGE);

    browser.driver.wait(function () {
        return browser.driver.getCurrentUrl().then(function (url) {
            return url == URL_LOGIN;
        });
    }, TIMEOUT_LONG).then(function () {
        browser.driver.findElement(by.id('j_username')).sendKeys(LOGIN_USERNAME);
        browser.driver.findElement(by.id('j_password')).sendKeys(LOGIN_PASSWORD);
        browser.driver.findElement(by.name('submit')).click();
    });

    var deferred = protractor.promise.defer();
    browser.driver.wait(function () {
      return browser.driver.getCurrentUrl().then(function (url) {
        return url === URL_START_PAGE + '/#/';
      });
    }, TIMEOUT_LONG).then(function () {
      element(by.cssContainingText('.network-name', START_PAGE_BUTTON)).click().then(function() {
        console.log('Login successful');

        browser.driver.wait(function () {
          return browser.driver.getCurrentUrl().then(function (url) {
            return url === URL_ESV_PAGE;
          });
        }, TIMEOUT_LONG).then(function(){
          console.log('Now we are on ' + URL_ESV_PAGE);
          deferred.fulfill();
        });
      });
    });

    return deferred.promise;
}

// Initialization of new simulation
function createSimulation() {

  var deferred = protractor.promise.defer();

  browser.ignoreSynchronization = true;
  browser.driver.sleep(TIMEOUT_LOAD_EXPERIMENT_LIST).then(function() {

    console.log('Waited for ' + (TIMEOUT_LOAD_EXPERIMENT_LIST/1000) + 's now to be sure page is completely loaded');

    element(by.cssContainingText('.h4', EXPERIMENT_TO_CHOOSE)).click().then(function(){
      console.log('Clicked on the (first) experiment containing text: "' + EXPERIMENT_TO_CHOOSE + '"');
    });

    element(by.partialButtonText(CREATE_SIMULATION_BUTTON)).click().then(function () {
      console.log('Clicked on button: "' + CREATE_SIMULATION_BUTTON + '"');
      browser.driver.sleep(TIMEOUT_CREATE_AND_LOAD_EXPERIMENT).then(function(){
        console.log('Waited for ' + (TIMEOUT_CREATE_AND_LOAD_EXPERIMENT/1000) + 's')
        deferred.fulfill();
      });
    });
  });

  return deferred.promise;
}

// Testing of simulation
function startPauseSimulation() {

    var deferred = protractor.promise.defer();
    var simulationTimeStart;

    // Start simulation
    element(by.css('.glyphicon.glyphicon-play')).click().then(function() {
        console.log('Simulation started (time should change)');
        element(by.id('simTime')).getText().then(function(text){
            console.log('Simulation Time: ' + text);
            simulationTimeStart = text;
        });
        // Wait for simulation time to change
        browser.driver.sleep(5000).then(function(){
            element(by.id('simTime')).getText().then(function(text){
                console.log('Simulation Time: ' + text);
                expect(simulationTimeStart !== text);
            });
        });
    });

    // Pause simulation
    element(by.css('.glyphicon.glyphicon-pause')).click().then(function () {
        console.log('Simulation paused (time should not change more than 1s)')
    });
    element(by.id('simTime')).getText().then(function(text){
        console.log('Simulation time: ' + text);
        simulationTime = simTimeInSeconds(text);
    });

    // Simulation time should not change while paused
    browser.driver.sleep(5000);
    element(by.id('simTime')).getText().then(function(text){
      console.log('Simulation time: ' + text);
      var deviation = simTimeInSeconds(text) - simulationTime;
      console.log('Deviation = ' + deviation);
      expect(deviation <= 3).toBe(true); //a slow response from server can cause error
      deferred.fulfill();
    });

    return deferred.promise;
}

function stopSimulation() {

    // Stop simulation
    element(by.css('.glyphicon.glyphicon-stop')).click().then(function () {
        browser.sleep(5000);
        console.log('Simulation stopped');
    });

    // Exit experiment
    browser.driver.wait(element(by.partialButtonText('OK')).click());
        return browser.driver.getCurrentUrl().then(function (url) {
        return url == URL_ESV_PAGE;
    });

}

// Join existing simulation
function joinSimulation() {

    // Navigate to ESV
    browser.driver.get(URL_ESV_PAGE);

    // Join experiment
    element(by.cssContainingText('.h4', EXPERIMENT_TO_CHOOSE)).click();

    console.log('Clicking on button now: ' + JOIN_SIMULATION_BUTTON);
    element(by.partialButtonText(JOIN_SIMULATION_BUTTON)).click();
    browser.sleep(1000);

    // It joins the first experiment listed
    element.all(by.cssContainingText('.btn', JOIN_BUTTON)).then(function(items) {
        items[1].click().then(function () {
            console.log('Clicked on button now: ' + JOIN_BUTTON);
        })
    });

    browser.driver.sleep(TIMEOUT_CREATE_AND_LOAD_EXPERIMENT).then(function(){
      console.log('Waited for ' + (TIMEOUT_CREATE_AND_LOAD_EXPERIMENT/1000) + 's')
    });

    browser.driver.wait(function() {
        var deferred = protractor.promise.defer();
        element(by.css('.lead')).isPresent().then(function(isPresent) {
            deferred.fulfill(!isPresent);
        });
        return deferred.promise;
    }, TIMEOUT_LONG);

    // Start simulation
    element(by.css('.glyphicon.glyphicon-play')).click().then(function() {
        console.log('Simulation started');
    });
}


//***********************PROTRACTOR TESTING***********************

describe('Start Simulation', function () {

  it('should login', function () {
    console.log('[TC] Starting login testcase');
    login().then(function () {
      expect(browser.driver.getCurrentUrl()).toEqual(URL_ESV_PAGE);
    });
  }, TIMEOUT_LONG);

  it('should start and stop Husky experiment', function () {
    console.log('[TC] Starting Husky start-stop testcase');
    createSimulation().then(function(){
      expect(browser.driver.getCurrentUrl()).toContain('esv-web/gz3d-view');
      startPauseSimulation().then(function(){
        stopSimulation().then(function () {
          browser.sleep(TIMEOUT_SHORT)
          console.log('Waited for '+(TIMEOUT_SHORT/1000)+'s now for splash screen to vanish')
          expect(browser.driver.getCurrentUrl()).toEqual(URL_ESV_PAGE);
        });
      });
    });
  }, TIMEOUT_LONG);

  //This could be an alternative test case
  //it('should join a running experiment', function () {
  //  console.log('[TC] Starting join running experiment testcase');
  //  createSimulation().then(function(){
  //    joinSimulation();
  //    stopSimulation().then(function () {
  //      expect(browser.driver.getCurrentUrl()).toEqual(URL_ESV_PAGE);
  //    });
  //  });
  //}, TIMEOUT_LONG);

});

