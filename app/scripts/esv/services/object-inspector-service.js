/* global THREE: false */
/* global console: false */
(function () {
  'use strict';

  angular.module('objectInspectorModule', [])

    .constant('OBJECT_VIEW_MODE', {
      NORMAL: 'normal',
      TRANSPARENT: 'transparent',
      WIREFRAME: 'wireframe'
    })

    .factory('objectInspectorService', [
      '$timeout', 'EDIT_MODE', 'STATE', 'OBJECT_VIEW_MODE', 'gz3d', 'stateService', 'colorableObjectService', 'simulationInfo',
      function ($timeout, EDIT_MODE, STATE, OBJECT_VIEW_MODE, gz3d, stateService, colorableObjectService, simulationInfo) {
        var objectInspectorService = {
          //whether the object editor should be displayed
          isShown: false,
          selectedObject: undefined,
          translation: new THREE.Vector3(),
          rotationEuler: new THREE.Euler(),
          floatPrecision: 5,
          showCollision: undefined,

          toggleView: function (show) {
            var showing;
            if (angular.isUndefined(show)) {
              showing = !this.isShown;
            } else {
              showing = show;
            }

            if (showing) {
              registerGuiEvents();
              update();
            } else {
              // switch back to view mode on close
              this.setManipulationMode(EDIT_MODE.VIEW);
            }

            this.isShown = showing;
          },

          roundToPrecision: function (number) {
            return parseFloat(number.toFixed(this.floatPrecision));
          },

          selectMaterial: function (material) {
            colorableObjectService.setEntityMaterial(simulationInfo, this.selectedObject, material);
          },

          onObjectChange: function () {
            this.selectedObject.position.copy(this.translation);
            this.selectedObject.rotation.copy(this.rotationEuler);
            this.selectedObject.updateMatrixWorld();

            gz3d.scene.emitter.emit('entityChanged', this.selectedObject);
          },

          setViewMode: function (mode) {
            if (this.selectedObject.viewAs === mode) {
              return;
            }

            gz3d.scene.setViewAs(this.selectedObject, mode);
          },

          setManipulationMode: function (mode) {
            if (gz3d.scene.manipulationMode === mode) {
              return;
            } else {
              switch (mode) {
                case EDIT_MODE.VIEW:
                  gz3d.scene.setManipulationMode(mode);
                  break;
                case EDIT_MODE.TRANSLATE:
                case EDIT_MODE.ROTATE:
                  stateService.ensureStateBeforeExecuting(
                    STATE.PAUSED,
                    function () {
                      gz3d.scene.setManipulationMode(mode);
                    }
                  );
                  // as view mode deselects any selected object, reselect here
                  gz3d.scene.selectEntity(this.selectedObject);
                  break;
              }
            }
          },

          onShowCollisionChange: function () {
            this.selectedObject.showCollision = this.showCollision;

            var that = this;
            this.selectedObject.traverse(function (node) {
              if (node.name.indexOf('COLLISION_VISUAL') >= 0) {
                // found collision geometry node, get all meshes attached
                node.traverse(function (subnode) {
                  if (subnode instanceof THREE.Mesh) {
                    subnode.visible = that.showCollision;
                  }
                });
              }
            });
          }
        };

        var update = function () {
          // update selected object
          objectInspectorService.selectedObject = gz3d.scene.selectedEntity;
          if (angular.isUndefined(objectInspectorService.selectedObject)) {
            return;
          }

          // update translation, rotation
          objectInspectorService.translation.copy(objectInspectorService.selectedObject.position);
          objectInspectorService.rotationEuler.copy(objectInspectorService.selectedObject.rotation);
          // round for readability purposes
          objectInspectorService.translation.x = objectInspectorService.roundToPrecision(objectInspectorService.translation.x);
          objectInspectorService.translation.y = objectInspectorService.roundToPrecision(objectInspectorService.translation.y);
          objectInspectorService.translation.z = objectInspectorService.roundToPrecision(objectInspectorService.translation.z);
          objectInspectorService.rotationEuler.x = objectInspectorService.roundToPrecision(objectInspectorService.rotationEuler.x);
          objectInspectorService.rotationEuler.y = objectInspectorService.roundToPrecision(objectInspectorService.rotationEuler.y);
          objectInspectorService.rotationEuler.z = objectInspectorService.roundToPrecision(objectInspectorService.rotationEuler.z);

          objectInspectorService.hasColorableVisual = colorableObjectService.isColorableEntity(objectInspectorService.selectedObject);

          // update view mode radio buttons
          document.getElementById('oi-viewmode-normal').checked = false;
          document.getElementById('oi-viewmode-transparent').checked = false;
          document.getElementById('oi-viewmode-wireframe').checked = false;
          if (angular.isDefined(objectInspectorService.selectedObject.viewAs)) {
            switch (objectInspectorService.selectedObject.viewAs) {
              case OBJECT_VIEW_MODE.NORMAL:
                document.getElementById('oi-viewmode-normal').checked = true;
                break;
              case OBJECT_VIEW_MODE.TRANSPARENT:
                document.getElementById('oi-viewmode-transparent').checked = true;
                break;
              case OBJECT_VIEW_MODE.WIREFRAME:
                document.getElementById('oi-viewmode-wireframe').checked = true;
                break;
            }
          }

          // update show collisions
          if (angular.isUndefined(objectInspectorService.selectedObject.showCollision)) {
            objectInspectorService.showCollision = objectInspectorService.selectedObject.showCollision = false;
          } else {
            objectInspectorService.showCollision = objectInspectorService.selectedObject.showCollision;
          }
        };

        var guiEventsRegistered = false;
        var registerGuiEvents = function () {
          if (guiEventsRegistered) {
            return;
          }
          guiEventsRegistered = true;

          gz3d.gui.guiEvents.on('setTreeSelected', function () {
            if (objectInspectorService.isShown) {
              $timeout(update, 0);//force scope.$apply
            }
          });
        };

        return objectInspectorService;
      }
    ]);
} ());

