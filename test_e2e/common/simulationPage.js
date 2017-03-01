var parameters = require('../parameters.js');
var common = require('./common.js');

function startSimulation() {
  var startButton = element(by.css('.glyphicon.glyphicon-play'));
  return startButton.click().then(() => browser.wait(function() {
    return element(by.id('simTime')).getText().then(function(text) {
      return Number(text.replace(/.*:([09]*)/, '$1')) > 0;
    });
  }))
}

function pauseSimulation() {
  var simTime = () => element(by.id('simTime')).getText().then(function(text) {
    return Number(text.replace(/.*:([09]*)/, '$1'));
  });

  return element(by.css('.glyphicon.glyphicon-pause'))
    .click()
    .then(function() {
      browser.driver.sleep(parameters.timeout.RESPOND);
      return simTime();
    })
    .then(function(initialTime) {
      browser.driver.sleep(parameters.timeout.RESPOND);
      return simTime().then((currentTime) => expect(currentTime).toEqual(initialTime));
    });
}

function stopSimulation() {
  return element(by.css('.glyphicon.glyphicon-stop'))
    .click()
    .then(function() {
      common.waitForScriptResult(() => $('[ng-click="close()"]').length, 1)
        .then(() => browser.executeScript(() => $('[ng-click="close()"]').click()));
    });
}

module.exports = {
  startSimulation,
  pauseSimulation,
  stopSimulation
};