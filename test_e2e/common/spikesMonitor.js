var _ = require('lodash');

function toggleSpikesWidget(show) {
  return element(by.css('[help-tooltip="SPIKE_TRAIN"]')).click()
    .then(() =>
      browser.wait(() => {
        return element(by.id('spiketrain-widget')).isDisplayed().then((displayed) => {
          return displayed === show;
        })
      })
    );
}

function getSpikes(nbSpikes = 0) {
  return browser.executeScript(() => angular.element('#spiketrain-display').scope().messages)
    .then(spikes => _.groupBy(_.flatMap(spikes.splice(-nbSpikes), s => s.spikes), s => s.neuron));
}

module.exports = {
  openSpikesWidget: () => toggleSpikesWidget(true),
  closeSpikesWidget: () => toggleSpikesWidget(false),
  getSpikes
};