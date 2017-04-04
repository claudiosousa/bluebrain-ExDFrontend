(function () {
  'use strict';

  angular.module('simulationControlMock', [])
  .factory('simulationControl', function () {
    return jasmine.createSpy('simulationControl').and.returnValue({
      simulation: jasmine.createSpy('simulation')
    });
  });
}());
