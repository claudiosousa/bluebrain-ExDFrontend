(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .directive('editorToolbar', [
    'STATE', 'contextMenuState', 'userContextService', 'stateService',
    'gz3d', 'editorsPanelService',
      function (STATE, contextMenuState, userContextService, stateService, gz3d, editorsPanelService) {
        return {
          templateUrl: 'views/esv/editor-toolbar.html',
          restrict: 'E',
          scope: false,
          controller: 'editorToolbarCntrl',
         };
      }
    ]);
}());
