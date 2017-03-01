var parameters = require('../parameters.js');
var esvPage = require('../common/esvPage.js');
var simulationPage = require('../common/simulationPage.js');
var spikesMonitor = require('../common/spikesMonitor.js');
var gz3dScene = require('../common/gz3dScene.js');

describe('Simulation Test launch and main view', function() {

    var experiment = parameters.EXPERIMENT[0];

    it('Should launch simulation', function() {
        esvPage.navigateToEsvPage();
        esvPage.clickExperiment(experiment);
        return esvPage.launchExperiment();
    })
    it('Should start simulation', function() {
        return simulationPage.startSimulation();
    });

    describe("Spike monitor", function() {

        it('Should launch spike monitor and only spikes 4,7 should spike frequently', function() {
            spikesMonitor.openSpikesWidget();
            browser.driver.sleep(parameters.timeout.SHORT);
            return spikesMonitor.getSpikes(parameters.timeout.SHORT / parameters.spikePeriod).then((spikes) => {
                var neuronsHighSpiking = [4, 7];
                var neuronsLowSpiking = [0, 1, 2, 3];
                neuronsHighSpiking.forEach((i) => expect(spikes[i].length).toBeGreaterThan(100));
                neuronsLowSpiking.forEach((i) => spikes[i] && expect(spikes[i].length).toBeLessThan(30));
            });
        });

        it('Should change the tv color to red', function() {
            return gz3dScene.changeLeftTvToRed();
        });

        it('Spikes pattern should match expected red tv spikes', function() {
            browser.driver.sleep(parameters.timeout.SHORT);
            spikesMonitor.getSpikes(parameters.timeout.SHORT / parameters.spikePeriod).then((spikes) => {
                var conditionalDependentSpikingNeurons = [1, 3, 6];
                conditionalDependentSpikingNeurons.forEach((i) => expect(spikes[i].length).toBeGreaterThan(50));
            });
            spikesMonitor.closeSpikesWidget();
        });
    });

    describe("Navigation keys", function() {
        it('Test directional key', function() {
            let positionKeys = [
                { key: "KeyW", positionCoordinate: 'x', comparisonFn: 'toBeLessThan' },
                { key: "KeyS", positionCoordinate: 'x', comparisonFn: 'toBeGreaterThan' },
                { key: "KeyA", positionCoordinate: 'y', comparisonFn: 'toBeLessThan' },
                { key: "KeyD", positionCoordinate: 'y', comparisonFn: 'toBeGreaterThan' },
                { key: "KeyR", positionCoordinate: 'z', comparisonFn: 'toBeLessThan' },
                { key: "KeyF", positionCoordinate: 'z', comparisonFn: 'toBeGreaterThan' }
            ];

            positionKeys.forEach(key => {
                gz3dScene.getCameraPosition()
                    .then(initialcamera => {
                        gz3dScene.pressKeyDown(key.key)
                            .then(() => browser.driver.sleep(parameters.timeout.RESPOND))
                            .then(() => gz3dScene.pressKeyUp(key.key))
                            .then(gz3dScene.getCameraPosition)
                            .then(finalCamera => {
                                it('Test positional key: ' + key.key, function() {
                                    return expect(finalCamera[key.positionCoordinate])[key.comparisonFn](initialcamera[key.positionCoordinate]);
                                });
                            });
                    });
            })
        });
    });

    it('should stop the simulation', function() {
        simulationPage.stopSimulation();
    });
});