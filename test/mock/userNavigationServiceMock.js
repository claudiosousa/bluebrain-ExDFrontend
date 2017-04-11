(function () {
  'use strict';

  angular.module('userNavigationServiceMock', [])
  .service('userNavigationService', function () {

    this.init = jasmine.createSpy('init');
    this.deinit = jasmine.createSpy('deinit');
    this.setDefaultPose = jasmine.createSpy('setDefaultPose');
    this.isUserAvatar = jasmine.createSpy('isUserAvatar').and.callFake(function (entity) {
      return entity.name === 'user-avatar';
    });
    this.setModeFreeCamera = jasmine.createSpy('setModeFreeCamera');
    this.setModeGhost = jasmine.createSpy('setModeGhost');
    this.setModeHumanBody = jasmine.createSpy('setModeHumanBody');
    this.setLookatRobotCamera = jasmine.createSpy('setLookatRobotCamera');
    this.update = jasmine.createSpy('update')
  });
}());
