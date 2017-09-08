'use strict';

describe('Services: BaseExperimentsService', function() {

  it('should throw if instantiated', function() {
    expect(function() { new window.BaseExperimentsService(); }).toThrow();
    expect(function() { window.BaseExperimentsService(); }).toThrow();
  });

  it('should throw if abstract functions are not overriden', function() {
    var ExperimentsService = function() { };
    ExperimentsService.prototype = Object.create(window.BaseExperimentsService.prototype);
    ExperimentsService.prototype.constructor = window.BaseExperimentsService;
    var abstractFunctions = ['getExperiments', 'getExperimentImage'];

    abstractFunctions.forEach(function(fnName) {
      expect(function() { new ExperimentsService()[fnName](); }).toThrow();
    });
  });

});