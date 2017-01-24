var parameters = require('../parameters.js');
var common = require('./common.js');

function navigateToEsvPage() {
  return common.navigateToUrl(parameters.url.Esv).then(() => {
    return common.waitForScriptResult(() => $('.left-right.title-line').length, (res) => res > 0);
  });
}

function clickExperiment(experimentName) {
  var experimentElement = element(by.cssContainingText('.h4', experimentName))
  experimentElement.click();
  return browser.wait(function() {
    return !!element(by.partialButtonText(parameters.button.LAUNCH))
  });
}

function launchExperiment() {
  var launchButton = element(by.partialButtonText(parameters.button.LAUNCH));
  launchButton.click();
  return common.waitForScriptResult(() => $('.splash').length, 1).then(() => common.waitForScriptResult(() => $('.splash').length, 0));
}

module.exports = {
  navigateToEsvPage,
  clickExperiment,
  launchExperiment
};

