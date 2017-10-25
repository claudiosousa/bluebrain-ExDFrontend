(function() {
  'use strict';

  angular
    .module('editorsPanelServiceMock', [])
    .service('editorsPanelService', function() {
      this.init = jasmine.createSpy('init');
      this.deinit = jasmine.createSpy('deinit');
      this.toggleEditors = jasmine.createSpy('toggleEditors');
    });
})();
