(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name exdFrontendApp.controller:Gz3dViewCtrl
   * @description
   * # Gz3dViewCtrl
   * Controller of the exdFrontendApp
   */

  /* global GZ3D: false */

  /* global THREE: false */
  /* global console: false */

  angular.module('exdFrontendApp')
    // constants for the server side status
    .constant('STATUS', {
      STARTED: 'started',
      PAUSED: 'paused'
    })
    .controller('Gz3dViewCtrl', ['$rootScope', '$scope', 'gzInitialization', 
      'simulationStatistics', 'simulationService', 'simulationControl', 'simulationState', 
      'lightControl', 'screenControl', 'STATUS',
        function ($rootScope, $scope, gzInitialization, 
          simulationStatistics, simulationService, simulationControl, simulationState, 
          lightControl, screenControl, STATUS) {



      // Initially we set paused to true, but as soon as we have information from
      // the server side we adjust the value accordingly!
      $scope.paused = true;

      simulationService.simulations(function(data) {
        $scope.simulations = data;
        var length = $scope.simulations.length;
        if (length > 0) {
          $scope.simulation = $scope.simulations[length - 1];
          $scope.paused = $scope.simulation.state === STATUS.PAUSED;
        }
      });

      $scope.pauseSimulation = function () {
        if ($scope.simulation === undefined || $scope.simulation.simulationID === undefined) {
          return;
        }

        // There are more states than just 'paused' and 'started' on the server
        // side (created, initialized etc.). Since we can assume that the simulation
        // is already in place (was done before entering the ESV), we only have to
        // deal with those two states.
        var state = $scope.paused ? STATUS.STARTED : STATUS.PAUSED;

        simulationState.update({sim_id: $scope.simulation.simulationID}, {state: state});
      };

      simulationStatistics.setRealTimeCallback(function (realTimeValue) {
        $scope.$apply(function() {
          $scope.realTimeText = realTimeValue;
        });
      });

      simulationStatistics.setSimulationTimeCallback(function (simulationTimeValue) {
        $scope.$apply(function() {
          $scope.simulationTimeText = simulationTimeValue;
        });
      });

      simulationStatistics.setPausedCallback(function (paused) {
        $scope.$apply(function() {
          $scope.paused = paused;
        });
      });

      // stores, whether the context menu should be displayed
      $scope.isContextMenuShown = false;

      // the position of the context menu
      $scope.contextMenuTop = 0;
      $scope.contextMenuLeft = 0;

      $scope.hoveredObject = '';

      $scope.getModelUnderMouse = function(event) {
        var pos = new THREE.Vector2(event.clientX, event.clientY);
        var intersect = new THREE.Vector3();
        var model = $rootScope.scene.getRayCastModel(pos, intersect);
        return model;
      };

      $scope.updateHoverInfo = function (event) {
        var model = $scope.getModelUnderMouse(event);
        if (model !== null && model !== undefined) {
          $scope.hoveredObject = model.name;
        } else {
          $scope.hoveredObject = '';
        }
      };

      // for convenience we pass just a string as "red" or "blue" currently, this will be replaced later on
      $scope.setColorOnEntity = function (value) {
        if(!$scope.selectedEntity) {
          console.error('Could not change screen color since there was no object selected');
          return;
        }
        var colors = {red: 0xff0000, blue: 0x0000ff};

        // the following line would change the color for a simple box
        //var entityToChange = scene.getByName(scene.selectedEntity.name + "::link::visual");

        // since we currently want restrict ourselves to screens we go with:
        var entityToChange = $rootScope.scene.getByName($scope.selectedEntity.name + '::body::screen_glass');
        var child = entityToChange.children[0];
        var material = child ? child.material : undefined;

        if (entityToChange && child && material && colors[value]) {
          // currently we use .setHex(), because for some reason regRGB() does not respect the
          // brightness, i.e. when turning the lights down the objects do not get darker
          material.color.setHex(colors[value]);
          material.ambient.setHex(colors[value]);
          material.specular.setHex(colors[value]);

          // send RESTful commands to server
          var screenParams = {};

          if (($scope.selectedEntity.name === 'right_vr_screen') && (value === 'red'))
          {
            screenParams.name = 'RightScreenToRed';
          }
          else if (($scope.selectedEntity.name === 'left_vr_screen') && (value === 'red'))
          {
            screenParams.name = 'LeftScreenToRed';
          }
          else if (($scope.selectedEntity.name === 'right_vr_screen') && (value === 'blue'))
          {
            screenParams.name = 'RightScreenToBlue';
          }
          else if (($scope.selectedEntity.name === 'left_vr_screen') && (value === 'blue'))
          {
            screenParams.name = 'LeftScreenToBlue';
          }

          screenControl.updateScreenColor({sim_id: $scope.simulation.simulationID}, screenParams);
        }

        // deactivate the context menu after a color was assigned
        $scope.toggleScreenChangeMenu(false);
      };

      // this menu is currently only displayed if the model name contains "screen"
      $scope.toggleScreenChangeMenu = function (show, event) {
        if (show) {
          if (!$scope.isContextMenuShown) {
            var model = $scope.getModelUnderMouse(event);
            // scene.radialMenu.showing is a property of GZ3D that was originally used to display a radial menu, We are
            // reusing it for our context menu. The reason is that this variables disables or enables the controls of
            // scene in the render loop.
            $rootScope.scene.radialMenu.showing = $scope.isContextMenuShown =
              (model &&
               model.name !== '' &&
               model.name !== 'plane' &&
               model.name.indexOf('screen') !== -1 &&
              $rootScope.scene.modelManipulator.pickerNames.indexOf(model.name) === -1);

            $scope.contextMenuTop = event.clientY;
            $scope.contextMenuLeft = event.clientX;
            $scope.selectedEntity = $rootScope.scene.selectedEntity;
          }
        }
        else
        {
          $scope.isContextMenuShown = false;
          $rootScope.scene.radialMenu.showing = false;
        }
      };

      // Lights management
      $scope.incrementLightIntensities = function (ratio) {
        var lights = $rootScope.scene.scene.__lights;
        var numberOfLights = lights.length;
        for (var i = 0; i < numberOfLights; i+=1) {
          if( lights[i] instanceof THREE.AmbientLight ) { // we don't change ambient lights
            continue;
          }
          var entity = $rootScope.scene.getByName(lights[i].name);
          var lightObj = entity.children[0];
          lightObj.intensity = (1 + ratio) * lightObj.initialIntensity;
          $rootScope.scene.emitter.emit('entityChanged', entity);
        }
      };
/*
      The performances of this are too bad now.
      $scope.incrementLightIntensities = function (ratio) {
        var lights = scene.scene.__lights;
        var numberOfLights = lights.length;
        for (var i = 0; i < numberOfLights; i+=1) {
          if (lights[i] instanceof THREE.AmbientLight) { // we don't change ambient lights
            continue;
          }
          var name = lights[i].name;
          var entity = scene.getByName(name);
          var lightObj = entity.children[0];
          lightObj.intensity = (1 + ratio) * lightObj.initialIntensity;
          var lightParams = {};
          lightParams.name = name;
          var lightType = scene.getLightType(lightObj);
          lightParams.attenuation_constant = scene.intensityToAttenuation(lightObj.intensity, lightType);
          lightControl.updateLight(lightParams);
        }
      };
*/

      $scope.sliderPosition = 50;
      $scope.updateLightIntensities = function(sliderPosition) {
        var ratio = (sliderPosition - 50.0) / 50.25; // turns the slider position (in [0,100]) into an increase/decrease ratio (in [-1, 1])
        // we avoid purposedly -1.0 when dividing by 50 + epsilon -- for zero intensity cannot scale to a positive value!
        $scope.incrementLightIntensities(ratio);
      };
  }]);
}());
