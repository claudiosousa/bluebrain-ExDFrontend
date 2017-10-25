(function() {
  'use strict';

  angular
    .module('cameraManipulationMock', [])
    .service('cameraManipulation', function() {
      this.firstPersonRotate = jasmine.createSpy('firstPersonRotate');
      this.firstPersonTranslate = jasmine.createSpy('firstPersonTranslate');
      this.lookAtOrigin = jasmine.createSpy('lookAtOrigin');
      this.resetToInitialPose = jasmine.createSpy('resetToInitialPose');
    });
})();
