(function () {
  'use strict';

  angular.module('editorToolbarServiceMock', [])
  .service('editorToolbarService', function () {
    this.consoleLogReceived = jasmine.createSpy('consoleLogReceived');
  });
}());
