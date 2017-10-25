'use strict';

// Makes use of the Module pattern, also see e.g.
// http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
window.TestDataGenerator = (function() {
  // Create an object which we use for storing publicly accessible methods
  var api = {};

  api.randomInt = function(lowerBound, upperBound) {
    return lowerBound + Math.floor(Math.random() * (upperBound - lowerBound));
  };

  // Convenience function to produce a given number of simulations with the given initial state.
  api.createTestSimulations = function(numberOfSimulations, initialState) {
    var simulations = [];
    for (var i = 0; i < numberOfSimulations; i++) {
      simulations.push({
        simulationID: i,
        experimentConfiguration: 'fakeExperiment' + i + '.exc',
        state: initialState
      });
    }
    return simulations;
  };

  api.createTestExperiment = function() {
    var random = api.randomInt(0, 100);
    return {
      maturity: 'development',
      name: 'FakeName ' + random,
      description: 'Some Fake Description ' + random,
      experimentConfiguration: 'fakeExperiment' + random,
      servers: ['bbpce' + random],
      timeout: api.randomInt(0, 1000)
    };
  };

  api.createTestExperiments = function(numberOfExperiments) {
    var experiments = [];
    for (var i = 0; i < numberOfExperiments; i++) {
      experiments.push(api.createTestExperiment());
    }
    return experiments;
  };

  return api;
})();
