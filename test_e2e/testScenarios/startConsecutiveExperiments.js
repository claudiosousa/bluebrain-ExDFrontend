var parameters = require('../parameters.js');
var homePage = require('../common/homePage.js');
var esvPage = require('../common/esvPage.js');
var simulationPage = require('../common/simulationPage.js');

describe('Simulation Test running two consequitive experiments', function() {

  var experimentList = parameters.EXPERIMENT;

  it('Should direct to the home page', function() {
    homePage.navigateToHomePage();
  });

  for (var i = 0; i < experimentList.length; ++i) {

    (function(i) {

      it('Should direct to the esv page', function() {
        esvPage.navigateToEsvPage()
      });

      it('Should be able to click an experiment', function() {
        esvPage.clickExperiment(experimentList[i]);
      });

      it('Should be able to launch an experiment', function() {
        esvPage.launchExperiment();
      });

      it('Should be able to start the simulation', function() {
        simulationPage.startSimulation();
      })

      it('should be able to pause the simulation', function() {
        simulationPage.pauseSimulation();
      });

      it('should be able to stop the simulation', function() {
        simulationPage.stopSimulation();
      });
    })(i);
  }
});









