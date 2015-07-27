(function () {
  'use strict';

  angular.module('exdFrontendApp.Constants')
  .constant('EDIT_MODE', {
    VIEW: 'view',
    TRANSLATE: 'translate',
    ROTATE: 'rotate'
  });

  angular.module('exdFrontendApp')
  .directive('environmentDesigner', ['$log', 'EDIT_MODE', 'panels', 'simulationSDFWorld', 'STATE', 'simulationState',
                                     '$stateParams', '$rootScope',
  function ($log, EDIT_MODE, panels, simulationSDFWorld, STATE, simulationState, $stateParams, $rootScope) {
    return {
      templateUrl: 'views/esv/environment-designer.html',
      restrict: 'E',
      link: function(scope, element, attrs) {
        scope.EDIT_MODE = EDIT_MODE;
        scope.mode = EDIT_MODE.VIEW;
        scope.oldState = undefined;

        scope.setEditMode = function(mode) {
          if (scope.mode === mode) {
            $log.debug("Mode " + mode + " is already set.");
            panels.close();
            return;
          }

          var setMode = function() {
            $log.debug('Setting mode ' + mode + '.');
            scope.mode = mode;
            $rootScope.scene.setManipulationMode(mode);
            switch (mode) {
              case EDIT_MODE.VIEW:
                $rootScope.isInEditMode = false;
                $rootScope.toggleScreenChangeMenu(false);
                break;
              case EDIT_MODE.TRANSLATE:
              case EDIT_MODE.ROTATE:
                $rootScope.isInEditMode = true;
                break;
            }
            panels.close();
          };

          var setNewState = function(state) {
            simulationState(scope.serverBaseUrl).update(
              {sim_id: $stateParams.simulationID}, {state: state},
              function(data) {
                if (data.state !== state) {
                  $log.debug('Something went wrong when setting state.');
                  panels.close();
                  return;
                }
                setMode();
              }
            );
          };

          var onStateFetched = function(state) {
            var newState;
            if (scope.oldState === undefined) { scope.oldState = state; }
            switch (mode) {
              case EDIT_MODE.VIEW:
                if (state === STATE.PAUSED) { newState = scope.oldState; }
                break;
              case EDIT_MODE.TRANSLATE:
              case EDIT_MODE.ROTATE:
                scope.oldState = state;
                if (state === STATE.STARTED) { newState = STATE.PAUSED; }
                break;
            }
            if (newState) {
              $log.debug('Changing the simulation state to ' + newState + '.');
              setNewState(newState);
            }
            else {
              $log.debug('No need to change the simulation state.');
              setMode();
            }
          };

          simulationState(scope.serverBaseUrl).state(
            {sim_id: $stateParams.simulationID},
            function(data) { onStateFetched(data.state); }
          );
        };

        scope.exportSDFWorld = function () {
          $log.debug('ED: Querying server for SDF world export.');
          simulationSDFWorld(scope.serverBaseUrl).export({}, function (data) {
            var $q = data.sdf_dump;
            var $el = document.createElement('a');
            $el.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent($q));
            $el.setAttribute('download', 'world.sdf');
            $el.style.display = 'none';
            document.body.appendChild($el);
            $el.click();
            document.body.removeChild($el);
          });
        };
      }
    };
  }]);
}());
